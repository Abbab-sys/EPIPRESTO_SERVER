import {GraphQLClient, gql} from 'graphql-request'
import StoresSource from "../mongodb/stores/StoresSource.js";
import ProductsVariantsSource from "../mongodb/products-variants/ProductsVariantsSource.js";
import ProductsSource from "../mongodb/products/ProductsSource.js";

async function getShopifyProductsWithCredentials(shopifyShopDomain,shopifyToken){
    const shopifyEndpoint = shopifyShopDomain + "/admin/api/2022-07/graphql.json"
    const graphQLClient = new GraphQLClient(shopifyEndpoint, {
        headers: {
            "X-Shopify-Access-Token": shopifyToken
        },
    })
    //TODO: CHANGER FIRST A 100
    const query = gql`
        query getProducts{
            products(first: 1, reverse: true) {
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
    return await graphQLClient.request(query)
}

async function syncShopifyProducts(mongoClient, store) {
    const data = await getShopifyProductsWithCredentials(store.shopifyShopDomain,store.shopifyApiToken)
    // console.log(JSON.stringify(data, undefined, 2))

    const storesSource = new StoresSource(mongoClient.db("Epipresto-dev").collection('Stores'))
    const productsSource = new ProductsSource(mongoClient.db("Epipresto-dev").collection('Products'))
    const productsVariantsSource = new ProductsVariantsSource(mongoClient.db("Epipresto-dev").collection('ProductsVariants'))
    const dataSources = {
        dataSources: {
            storesSource: storesSource,
            productsSource: productsSource,
            productsVariantsSource: productsVariantsSource
        }
    }
    // const store = await storesSource.getStore(storeId)

    const products = data.products.edges.map((edge) => {
        {
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
        }
    })

    for (const product of products) {
        await processProduct(product, store, dataSources)
    }

}

async function processProduct(product, store, {dataSources: {storesSource, productsSource, productsVariantsSource}}) {
    const existingProducts = await productsSource.collection.find({shopifyProductId: product.id}).toArray();
    if (existingProducts.length > 1) return // Exception
    const newProductsOnStore = []
    let productId
    const newProductData = {
        shopifyProductId: product.id,
        title: product.title,
        vendor: product.vendor,
        tags: product.tags,
        imgSrc: product.featuredImage.url,
        relatedStoreId: store._id,
        brand: "",
        published: product.published,
    }
    if (existingProducts.length !== 0) {
        productId = existingProducts[0]._id
        console.log("product exists", productId)
        await productsSource.collection.updateOne({_id: productId}, {$set: newProductData})
    } else {
        console.log("NEW PRODUCT")
        productId = await productsSource.createProduct({...newProductData,variantsIds:[]})
        newProductsOnStore.push(productId)
    }
    // add new products id to store in collection
    for (const newProductId of newProductsOnStore) {
        await storesSource.collection.updateOne({_id: store._id}, {$push: {productsIds: newProductId}})
    }
    product._id = productId

    for (const variant of product.variants) {
        await processProductVariant(variant, product, {
            dataSources: {
                productsSource: productsSource,
                productsVariantsSource: productsVariantsSource
            }
        })
    }
}

async function processProductVariant(productVariant, product, {dataSources: {productsSource, productsVariantsSource}}) {
    const existingProductsVariants = await productsVariantsSource.collection.find({shopifyProductVariantId: productVariant.id}).toArray();
    if (existingProductsVariants.length > 1) return // Exception
    const newProductsVariantsOnProduct = []
    let productVariantId
    const newVariantData = {
        shopifyProductVariantId: productVariant.id,
        relatedProductId: product._id,
        displayName: productVariant.displayName,
        availableForSale: productVariant.availableForSale,
        price: productVariant.price,
        sku: productVariant.sku,
        taxable: productVariant.taxable,
        imgSrc: (productVariant.image) ? productVariant.image.url : "",
        byWeight: false, // TODO
        stock: productVariant.inventoryQuantity
    }
    if (existingProductsVariants.length !== 0) {
        productVariantId = existingProductsVariants[0]._id
        console.log("product variant exists", productVariantId)
        await productsVariantsSource.collection.updateOne({_id: productVariantId}, {$set: newVariantData})
    } else {
        console.log("NEW PRODUCT VARIANT")
        productVariantId = await productsVariantsSource.createProductVariant(newVariantData)
        newProductsVariantsOnProduct.push(productVariantId)
    }
    // add new products id to store in collection
    for (const newProductVariantId of newProductsVariantsOnProduct) {
        await productsSource.collection.updateOne({_id: product._id}, {$push: {variantsIds: newProductVariantId}})
    }

}


export {syncShopifyProducts,getShopifyProductsWithCredentials}
