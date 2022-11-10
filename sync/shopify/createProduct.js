import { GraphQLClient, gql } from "graphql-request";
import StoresSource from "../../mongodb/StoresSource.js";
import ProductsVariantsSource from "../../mongodb/ProductsVariantsSource.js";
import ProductsSource from "../../mongodb/ProductsSource.js";
import { SHOPIFY_CALLBACK_URL } from "../../constants.js";

/**
 * This method is called ONLY ONCE, when we sync the store for the first time
 *  - It subscribes to a webhook to receive a product to our CREATE endpoint when it has been created
 * @param {string} shopifyShopDomain :
  *@param {string} shopifyToken
  *@param {string} storeId
  @return void
 */
export async function subscribeToProductCreateWebHook(
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
            topic: PRODUCTS_CREATE
            webhookSubscription: {
                format: JSON
                callbackUrl: "${SHOPIFY_CALLBACK_URL}/webhooks/shopify/create-product/${store_id_string}"
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
 * This method is called EACH TIME a product has been created from shopify
 *  - It's only triggered by the CREATE webhook
 *  - It maps the created product and its variants to our database
 *
 * @param {string} client :mongo client
 * @param {string} shopifyShopDomain
  *@param {string} shopifyToken
  *@param {string} store
  *@param {string} shopifyProduct: the (updated) product returned by shopify
  @return void
 */

export async function createProduct(
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


  const extisingProduct = await productsSource.getProductByShopifyId(
    shopifyProductId
  );

  if (extisingProduct) {
    return;
  } else {
    console.log("Received Created Product from Shopify", shopifyProduct);

    //map the product
    const mappedProduct = {
      shopifyProductId: shopifyProduct.id.toString(),
      title: shopifyProduct.title,
      vendor: store.name,
      tags: shopifyProduct.tags,
      imgSrc: shopifyProduct.image ? shopifyProduct.image.src : "",
      relatedStoreId: store._id,
      brand: "",
      published: true,
    };

    const createdProductId = await productsSource.createProduct({
      ...mappedProduct,
      variantsIds: [],
    });

    await storesSource.addNewProductToStore(store._id, createdProductId);

    //map the variants
    const variants = shopifyProduct.variants;

    variants.forEach(async (variant) => {
      const mappedVariant = {
        shopifyVariantId: variant.id.toString(), 
        relatedProductId: createdProductId,
        variantTitle: variant.title,
        availableForSale: variant.inventory_quantity > 0? true : false,
        price: variant.price,
        sku: variant.sku,
        taxable: variant.taxable,
        imgSrc: variant.image ? variant.image.src : mappedProduct.imgSrc,
        byWeight: false,
        stock: variant.inventory_quantity, 
      };

      console.log("Variant created in our database", mappedVariant);

      const createdVariantId = await productsVariantsSource.createProductVariant(mappedVariant);

      console.log("created variant insertedID", createdVariantId);
      await productsSource.addNewVariantToProduct(createdProductId,createdVariantId);

    });

    console.log("Product created in our database", mappedProduct);
    await storesSource.updateStoreById(store._id, {
      lastShopifySyncDate: new Date().toISOString().slice(0, 19),
  });
  }

  return "create Product called successfully";
}
