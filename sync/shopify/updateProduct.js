import { GraphQLClient, gql } from "graphql-request";
import StoresSource from "../../mongodb/StoresSource.js";
import ProductsVariantsSource from "../../mongodb/ProductsVariantsSource.js";
import ProductsSource from "../../mongodb/ProductsSource.js";
import {SHOPIFY_CALLBACK_URL} from "../../constants.js"

/**
 * This method is called ONLY ONCE, when we sync the store for the first time
 *  - It subscribes to a webhook to receive a product to our UPDATE endpoint when it has been updated
 * @param {string} shopifyShopDomain :
  *@param {string} shopifyToken
  *@param {string} storeId
  @return void
 */
export async function subscribeToProductUpdateWebHook(
  shopifyShopDomain,
  shopifyToken,
  storeId
) {
  const shopifyEndpoint = shopifyShopDomain + "/admin/api/2022-07/graphql.json";
  const graphQLClient = new GraphQLClient(shopifyEndpoint, {
    headers: {
      "X-Shopify-Access-Token": shopifyToken,
    },
  });

  const store_id_string = storeId.toString();

  // create subscription mutation
  const subscriptionMutation = gql`
        mutation {
            webhookSubscriptionCreate(
            topic: PRODUCTS_UPDATE
            webhookSubscription: {
                format: JSON
                callbackUrl: "${SHOPIFY_CALLBACK_URL}/webhooks/shopify/update-product/${store_id_string}"
            }
            ) {
            userErrors {
                field
                message
            }
            webhookSubscription {
                id
            }
            }
        }
    `;
   return await graphQLClient.request(subscriptionMutation);


}

/**
 * This method is called EACH TIME a product has been updated from shopify
 *  - It's only triggered by the UPDATE webhook
 *  - It maps the updated product and its variants to our database
 *
 * @param {string} client :mongo client
 * @param {string} shopifyShopDomain
  *@param {string} shopifyToken
  *@param {string} store
  *@param {string} shopifyProduct: the (updated) product returned by shopify
  @return void
 */
export async function updateProduct(
  client,
  shopifyShopDomain,
  shopifyToken,
  store,
  shopifyProduct
) {
  const productsSource = new ProductsSource(
    client.db("Epipresto-dev").collection("Products")
  );
  const productsVariantsSource = new ProductsVariantsSource(
    client.db("Epipresto-dev").collection("ProductsVariants")
  );
  const storesSource = new StoresSource(
    client.db("Epipresto-dev").collection("Stores")
  );


  const shopifyProductId = shopifyProduct.id.toString(); //because shopify returns it as a number

  const product = await productsSource.getProductByShopifyId(shopifyProductId);

  //We verify that the product to updated has the same store Id as the store that triggered the webhook
  if (product && product.relatedStoreId.toString() === store._id.toString()) {

    const updatedProduct = {
      shopifyProductId: shopifyProductId,
      title: shopifyProduct.title,
      vendor: shopifyProduct.vendor,
      tags: validateTags(shopifyProduct.tags),
      imgSrc: shopifyProduct.image
        ? shopifyProduct.image.src
        : shopifyProduct.images[0].src,
      relatedStoreId: store._id,
      variantsIds:product.variantsIds,
      brand: "",
      published: shopifyProduct.status === "active",
    };



    //If the updated product sent by shopify has variants, it means we need to update the variants in our database
    if (shopifyProduct.variants.length > 0) {

      const variants = shopifyProduct.variants.map((variant) => {
        return {
          shopifyProductVariantId: variant.id.toString(),
          relatedProductId: product._id,
          variantTitle: variant.title,
          availableForSale: variant.inventory_quantity > 0,
          price: variant.price,
          sku: variant.sku ? variant.sku : "",
          taxable: variant.taxable,
          byWeight: variant.weight !== 0,
          imgSrc: variantImages(variant.image_id,shopifyProduct.images),
          stock: validateStock(variant.inventory_quantity),
        };
      });


      for (const variant of variants) {
        const productVariant =
          await productsVariantsSource.getProductVariantByShopifyId(
            variant.shopifyProductVariantId
          );

          //If variant exists, we update it, else we create it
        if (productVariant) {
          await productsVariantsSource.updateProductVariantById(
            productVariant._id,
            variant
          );
        } else {
          const newVariant = await productsVariantsSource.createProductVariant(
            variant
          );
          //update product variantsIds
          updatedProduct.variantsIds.push(newVariant);

        }
      }
    }
    //update product in DB
    await productsSource.updateProductById(product._id, updatedProduct);

      await storesSource.updateStoreById(store._id, {
        lastShopifySyncDate: new Date().toISOString().slice(0, 19),
      });
  }

  


  return "updateProduct called successfully";
}
function validateStock(stock){
  if(stock < 0 || stock === null){
      return 0;
  }else{
      return stock;
  }
}

function validateTags(tags){
  if(tags === null || tags === ""){
      return [];
  }else{
      //if tags is a string, we split it into an array
      if(typeof tags === "string"){
          return tags.split(",");
      }
      return tags;
  }
}

function variantImages(imageId,images){
  // in the images array , find the src of the image with the same id as the imageId
  const image = images.find(image => image.id === imageId);

  if (image){
      return image.src;
  } else {
    return ""
}
  
}
