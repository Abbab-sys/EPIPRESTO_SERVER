import {syncProducts} from "./SyncInventory.js";
import {GraphQLClient, gql} from 'graphql-request'
import StoresSource from "../mongodb/stores/StoresSource.js";
import ProductsVariantsSource from "../mongodb/products-variants/ProductsVariantsSource.js";
import ProductsSource from "../mongodb/products/ProductsSource.js";

async function syncShopifyProducts(mongoClient,store){
    const shopifyShopDomain = store.shopifyShopDomain
    const shopifyEndpoint=shopifyShopDomain+"/admin/api/2022-07/graphql.json"
    const shopifyToken=store.shopifyApiToken

    const graphQLClient = new GraphQLClient(shopifyEndpoint, {
        headers: {
            "X-Shopify-Access-Token": shopifyToken
        },
    })
    const query = gql`
        query getProducts{
            products(first: 10, reverse: true) {
                edges {
                    node {
                        id
                        title
                        tags
                        publishedAt
                        variants (first:10){
                            edges{
                                node{
                                    id
                                    displayName
                                    sku
                                    price
                                    taxable
                                    image{
                                        url
                                    }
                                    weight
                                    inventoryQuantity
                                    availableForSale

                                }
                            }
                        }
                        featuredImage{
                            url
                        }
                    }

                }
            }
        }
    `
    const data = await graphQLClient.request(query)
    // console.log(JSON.stringify(data, undefined, 2))
    
    const storesSource = new StoresSource(mongoClient.db("Epipresto-dev").collection('Stores'))
    const productsSource = new ProductsSource(mongoClient.db("Epipresto-dev").collection('Products'))
    const productsVariantsSource = new ProductsVariantsSource(mongoClient.db("Epipresto-dev").collection('ProductsVariants'))
    const dataSources={dataSources:{storesSource:storesSource,productsSource:productsSource,productsVariantsSource:productsVariantsSource}}
    // const store = await storesSource.getStore(storeId)
    
    const products = data.products.edges.map((edge) => {{
        const product = edge.node
        return {
            id: product.id,
            title: product.title,
            vendor: store.name,
            tags: product.tags,
            variants: product.variants.edges.map((edge) => {
                const variant = edge.node
                return {
                    id: variant.id,
                    displayName: variant.displayName,
                    sku: variant.sku,
                    price: variant.price,
                    taxable: variant.taxable,
                    image: variant.image,
                    weight: variant.weight,
                    inventoryQuantity: variant.inventoryQuantity,
                    availableForSale: variant.availableForSale,
                }
            }),
            featuredImage: product.featuredImage,
            published: true, //TODO remplacer par 
        }
    }})
    
    for(const product of products){
       await processProduct(product,store,dataSources)
    }
    
}
async function processProduct(product,store,{dataSources:{storesSource,productsSource}}){
    const existingProducts=productsSource.collection.find({
        shopifyProductId: product.id}).toArray();
    if(existingProducts.length>1) return // Exception
    let productId
    if(existingProducts.length===1){
        productId=existingProducts[0]._id
        console.log("product exists", productId)
    }else{
        console.log("NEW PRODUCT")
        productId=await productsSource.createProduct({
            shopifyProductId: product.id,
            title: product.title,
            vendor: product.vendor,
            tags: product.tags,
            imgSrc: product.featuredImage.url,
            relatedStoreId: store._id,
            brand:"",
            published:product.published,
            variants:[]
        })
    }
}

async function processProductVariant(productVariant,product){
    
}



export {syncShopifyProducts}