import pkg from "@woocommerce/woocommerce-rest-api";
const WooCommerceRestApi = pkg.default; //https://stackoverflow.com/questions/62250120/typeerror-woocommercerestapi-is-not-a-constructor

import StoresSource from "../../mongodb/StoresSource.js";
import ProductsVariantsSource from "../../mongodb/ProductsVariantsSource.js";
import ProductsSource from "../../mongodb/ProductsSource.js";

async function getWooCommerceProductsWithCredentials(
  woocommerceShopDomain,
  woocommerceShopConsumerKey,
  woocommerceShopConsumerSecret
) {
  const api = new WooCommerceRestApi({
    url: woocommerceShopDomain,
    consumerKey: woocommerceShopConsumerKey,
    consumerSecret: woocommerceShopConsumerSecret,
    version: "wc/v3",
    queryStringAuth: true,
  });

  const data = await api.get("products", {
    per_page: 1,
  });
  return data.data;
}

async function syncWooCommerceProducts(mongoClient, store) {
  const storesSource = new StoresSource(
    mongoClient.db("Epipresto-dev").collection("Stores")
  );
  const productsSource = new ProductsSource(
    mongoClient.db("Epipresto-dev").collection("Products")
  );
  const productsVariantsSource = new ProductsVariantsSource(
    mongoClient.db("Epipresto-dev").collection("ProductsVariants")
  );
  const dataSources = {
    dataSources: {
      storesSource: storesSource,
      productsSource: productsSource,
      productsVariantsSource: productsVariantsSource,
    },
  };

  const api = new WooCommerceRestApi({
    url: store.woocommerceShopDomain,
    consumerKey: store.woocommerceConsumerKey,
    consumerSecret: store.woocommerceConsumerSecretKey,
    version: "wc/v3",
    queryStringAuth: true,
  });

  let data;
  let page = 1;
  let woocommerce_products=[];


  //If it's the first time we sync the store, we get all the products
  if (!store.lastWoocoommerceSyncDate) {
    do {
      data = await api.get("products", {
        per_page: 100,
        page: page,
      });
      woocommerce_products = woocommerce_products.concat(data.data);
      page++;
    } while (data.headers["x-wp-totalpages"] >= page);

    console.log("Woocommerce synchronized for the first time");
  } else {
    data = await api.get("products", {
      per_page: 100,
      modified_after: store.lastWoocoommerceSyncDate, //If a product is created, this field will have the creation date as value
      dates_are_gmt: true,
    });
    console.log("Woocommece store sync");
  }


  //if data.data is empty, it means that there are no updated products
  if (data.data.length === 0) {
    console.log("no updated products");
    await storesSource.updateStoreById(store._id, {
      lastWoocoommerceSyncDate: new Date().toISOString().slice(0, 19),
    });
    return;
  }

  const products = woocommerce_products.map((product) => {
    return {
      id: product.id,
      title: product.name,
      vendor: store.name,
      tags: product.tags.map((tag) => tag.name),
      variants: [],
      variantsIds:product.variations,
      featuredImage: product.images.length > 0 ? product.images[0].src : "",
      published: true,
      sku: product.sku,
      price: product.price,
      taxable:product.tax_status === "taxable",
      weight:product.weight,
      inventoryQuantity:product.stock_quantity?product.stock_quantity:0,
      availableForSale:product.stock_status === "instock",
    };
  });

  for (const product of products) {
    //If product doesn't have variants, we create a variant with the same data as the product
    if (product.variantsIds.length === 0) {
      product.variants.push({
        id: product.id,
        displayName: product.title,
        sku: product.sku,
        price: product.price,
        taxable: product.taxable,
        image: product.featuredImage,
        weight: product.weight,
        inventoryQuantity: product.inventoryQuantity,
        availableForSale: product.availableForSale,
      });
    } else{
      const variants = await getProductVariants(product.id, api);
      product.variants = variants.map((variant) => {
        return {
          id: variant.id,
          displayName: variant.attributes[0].option,
          sku: variant.sku,
          price: variant.price,
          taxable: variant.tax_status === "taxable",
          image: (variant.image)?variant.image.src:product.featuredImage,
          weight: variant.weight,
          inventoryQuantity: variant.stock_quantity?variant.stock_quantity:0, //certains produits sont des services, donc pas de stock (normal que sa soit null)
          availableForSale: variant.purchasable,
        };
      });
    }
    await processProduct(product, store, dataSources);

    await storesSource.updateStoreById(store._id, {
      lastWoocoommerceSyncDate: new Date().toISOString().slice(0, 19),
    });
  }
}

async function processProduct(
  product,
  store,
  { dataSources: { storesSource, productsSource, productsVariantsSource } }
) {
  let productId;
  const existingProducts = await productsSource.collection
    .find({ wooCommerceProductId: product.id })
    .toArray();

  if (existingProducts.length > 1) return; // Exception

  const newProductsOnStore = [];

  const newProductData = {
    wooCommerceProductId: product.id,
    title: product.title,
    vendor: product.vendor,
    tags: product.tags,
    imgSrc: product.featuredImage,
    relatedStoreId: store._id,
    brand: "",
    published: product.published,
  };

  if (existingProducts.length !== 0) {
    productId = existingProducts[0]._id;
    console.log("WOOCOMMERCE : PRODUCT EXISTS", productId);
    await productsSource.collection.updateOne(
      { _id: productId },
      { $set: newProductData }
    );
  } else {
    console.log("WOOCOMMERCE : NEW PRODUCT");
    productId = await productsSource.createProduct({
      ...newProductData,
      variantsIds: [],
    });
    newProductsOnStore.push(productId);
  }

  // add new products id to store in collection
  for (const newProductId of newProductsOnStore) {
    await storesSource.collection.updateOne(
      { _id: store._id },
      { $push: { productsIds: newProductId } }
    );
  }
  product._id = productId;

  for (const variant of product.variants) {
    await processProductVariant(variant, product, {
      dataSources: {
        productsSource: productsSource,
        productsVariantsSource: productsVariantsSource,
      },
    });
  }
}

//process product variants
async function processProductVariant(
  productVariant,
  product,
  { dataSources: { productsSource, productsVariantsSource } }
) {
  let productVariantId;
  const existingProductVariants = await productsVariantsSource.collection
    .find({ wooCommerceProductVariantId: productVariant.id })
    .toArray();

  if (existingProductVariants.length > 1) return; // Exception

  const newProductVariantsOnStore = [];

  const newProductVariantData = {
    wooCommerceProductVariantId: productVariant.id,
    relatedProductId: product._id,
    displayName: productVariant.displayName,
    availableForSale: productVariant.availableForSale,
    sku: productVariant.sku,
    price: productVariant.price,
    taxable: productVariant.taxable,
    imgSrc: productVariant.image,
    byWeight: false,
    stock: productVariant.inventoryQuantity,
  };

  if (existingProductVariants.length !== 0) {
    productVariantId = existingProductVariants[0]._id;
    console.log("WOOCOMMERCE: PRODUCT VARIANTE EXISTS", productVariantId);
    await productsVariantsSource.collection.updateOne(
      { _id: productVariantId },
      { $set: newProductVariantData }
    );
  } else {
    console.log("WOOCOMMERCE - NEW PRODUCT VARIANT");
    productVariantId = await productsVariantsSource.createProductVariant({
      ...newProductVariantData,
    });
    newProductVariantsOnStore.push(productVariantId);
  }

  // add new products id to store in collection
  for (const newProductVariantId of newProductVariantsOnStore) {
    await productsSource.collection.updateOne(
      { _id: product._id },
      { $push: { variantsIds: newProductVariantId } }
    );
  }
}

async function getProductVariants(productId, api) {
  const data = await api.get(`products/${productId}/variations`, {
    per_page: 100,
  });
  return data.data;
}



export { syncWooCommerceProducts, getWooCommerceProductsWithCredentials };
