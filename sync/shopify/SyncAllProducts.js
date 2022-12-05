import {GraphQLClient, gql} from "graphql-request";
import StoresSource from "../../mongodb/StoresSource.js";
import ProductsVariantsSource from "../../mongodb/ProductsVariantsSource.js";
import ProductsSource from "../../mongodb/ProductsSource.js";
import fetch from 'node-fetch'
import {SHOPIFY_CALLBACK_URL} from "../../constants.js"

let settings = {method: "Get"};


/**
 * This method is called when we need to sync all products from a store:
 *  - It sends a bulk operation request to shopify to receive all products later
 *  - It subscribes to a webhook to receive the products to our endpoint when they are ready
 *
 * @param {string} shopifyShopDomain :
 *@param {string} shopifyToken
 *@param {string} storeId
 @return void
 */
export async function sendBulkOperationMutation(
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

    //storeId must be "123" not new ObjectId("123")
    const store_id_string = storeId.toString();


    const bulkOperationMutation = gql`
        mutation {
            bulkOperationRunQuery(
                query: """
                {
                products {
                edges {
                node {
                id
                title
                tags
                publishedAt
                description
                variants(first: 100) {
                edges {
                node {
                id
                displayName
                title
                sku
                price
                taxable
                image {
                url
                }
                weight
                inventoryQuantity
                availableForSale
                }
                }
                }
                featuredImage {
                url
                }
                }
                }
                }
                }
                """
            ) {
                bulkOperation {
                    id
                    status
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    const res = await graphQLClient.request(bulkOperationMutation);


    if (res) {
        const subscription = await subscribeToWebhook(
            shopifyShopDomain,
            shopifyToken,
            store_id_string
        );
    }
}

/**
 * This method is called once to subscribe to a webhook to receive products from shopify when they are ready
 *  - We need to specify our Endpoint URL to receive the products
 *
 * @param {string} shopifyShopDomain :
 * @param {string} shopifyToken
 * @param {string} storeId
 @return void
 */
async function subscribeToWebhook(shopifyShopDomain, shopifyToken, store_id_string) {
    const shopifyEndpoint = shopifyShopDomain + "/admin/api/2022-07/graphql.json";
    const graphQLClient = new GraphQLClient(shopifyEndpoint, {
        headers: {
            "X-Shopify-Access-Token": shopifyToken,
        },
    });


    const webhookMutation = gql`
        mutation {
            webhookSubscriptionCreate(
                topic: BULK_OPERATIONS_FINISH
                webhookSubscription: {
                    format: JSON
                    callbackUrl: "${SHOPIFY_CALLBACK_URL}/webhooks/shopify/get-all-products/${store_id_string}"
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

    const data = await graphQLClient.request(webhookMutation);



    return data;

}

/**
 * This method is called when we receive the products from shopify (When our webhook endpoint is triggered)
 *  - It maps the products and variants to our database
 *  - It updates the store status to "synced" with the timestamp of the sync
 *
 *  @param {string} shopifyShopDomain
 * @param {string} shopifyToken
 * @param {string} admin_graphql_api_id : this is the id of the list of our products returned by shopify
 * @param {string} mongoClient : the mongo client to connect to the database
 * @param {string} store
 @return void
 */
export async function getAllProducts(
    shopifyShopDomain,
    shopifyToken,
    admin_graphql_api_id,
    mongoClient,
    store
) {

    const productsSource = new ProductsSource(
        mongoClient.db("Epipresto-dev").collection("Products")
    );
    const storesSource = new StoresSource(
        mongoClient.db("Epipresto-dev").collection("Stores")
    );

    const productsVariantsSource = new ProductsVariantsSource(
        mongoClient.db("Epipresto-dev").collection("ProductsVariants")
    );

    const shopifyEndpoint = shopifyShopDomain + "/admin/api/2022-07/graphql.json";
    const graphQLClient = new GraphQLClient(shopifyEndpoint, {
        headers: {
            "X-Shopify-Access-Token": shopifyToken,
        },
    });


    const getAllProducts = gql`
        query {
            node(id: "${admin_graphql_api_id}") {
                ... on BulkOperation {
                    id
                    status
                    errorCode
                    createdAt
                    completedAt
                    objectCount
                    fileSize
                    url
                    partialDataUrl
                }
            }
        }
    `;

    const data = await graphQLClient.request(getAllProducts);

    //Shopify returns a url containing a JSONL file with all products
    //Refer to https://shopify.dev/api/usage/bulk-operations/queries for more info

    //We need to fetch this file and parse it to get the products

    fetch(data.node.url, settings)
        .then((res) => res.text())
        .then((text) => {
            const lines = text.split("\n")
            //remove the last empty line to avoid parsing errors
            lines.pop()

            const products = lines.map((line) => JSON.parse(line))

            //Hashmap with key being a product id and value being an array of its variants
            const productsWithVariants = new Map();

            products.forEach((product) => {

                //const products contains both products and variants, so we need to filter them by their ID
                //Id returned by shopify is of type "gid://shopify/Product/123456789" for example

                const regex = new RegExp(/gid:\/\/shopify\/Product\/\d+/);

                if (regex.test(product.id)) {
                    if (!productsWithVariants.has(product.id)) {
                        productsWithVariants.set(product.id, []);
                    }
                } else {
                    //If the product is a variant, we need to get its parent product and add it to the hashmap
                    const productId = product.__parentId;

                    if (productsWithVariants.has(productId)) {

                        productsWithVariants.get(productId).push(product);
                    }
                }
            });


            //For each product in the hashmap, map it into our product object and save it in mongodb
            productsWithVariants.forEach(async (variants, productId) => {
                const product = products.find((product) => product.id === productId);

                const mappedProduct = mapProduct(product, variants, store);
                productId = await productsSource.createProduct({
                    ...mappedProduct,
                    variantsIds: [],
                });

                //Update the store's productIds array with the newly created product
                await storesSource.addNewProductToStore(store._id, productId);


                //For each variant, we map it, add it to ProductsVariants collection and update the product's variantsIds array
                variants.forEach(async (variant) => {
                    const mappedVariant = mapVariant(variant, productId);
                    const newVariant = await productsVariantsSource.createProductVariant(
                        mappedVariant
                    );
                    //push newVariant.insertedId to the variantsIds array of the product
                    const addedVariant=await productsSource.addNewVariantToProduct(productId, newVariant);
                });
            });
        });

    await storesSource.updateStoreById(store._id, {
        lastShopifySyncDate: new Date().toISOString().slice(0, 19),
    });

    return {status: "accepted"};
}

function mapProduct(product, variants, store) {
    const mappedProduct = {
        shopifyProductId: product.id.split("/").pop(), //get the last part of the id, WHICH IS THE ID
        title: product.title,
        vendor: store.name,
        tags: validateTags(product.tags),
        description: product.description,
        imgSrc: product.featuredImage ? product.featuredImage.url : "",
        relatedStoreId: store._id,
        brand: "",
        published: true,
    };

    return mappedProduct;
}



function mapVariant(variant, parentProductId) {
    const mappedVariant = {
        shopifyVariantId: variant.id.split("/").pop(), //get the last part of the id, WHICH IS THE ID
        relatedProductId: parentProductId,
        variantTitle: variant.title,
        availableForSale: variant.availableForSale,
        price: variant.price,
        sku: variant.sku,
        taxable: variant.taxable,
        imgSrc: variant.image ? variant.image.url : "",
        byWeight: false,
        stock: validateStock(variant.inventoryQuantity),
    };

    return mappedVariant;
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
        return tags;
    }
}
