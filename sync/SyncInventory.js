import {GraphQLClient, gql} from 'graphql-request'
import StoresSource from "../mongodb/stores/StoresSource.js";

async function syncShopifyProducts(mongoClient) {
    const storesSource = new StoresSource(mongoClient.db("Epipresto-dev").collection('Stores'))
    const storesToSync = await storesSource.findStoresToSynchronize()
    for (const store of storesToSync) {
        if (!store.shopifyShopDomain) continue
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
                            vendor
                            tags
                            hasOnlyDefaultVariant
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
                            images(first:10){
                                edges{
                                    node{
                                        url
                                    }
                                }
                            }
                            featuredImage{
                                url
                            }
                            images(first:10){
                                edges{
                                    node{
                                        id
                                        url
                                    }
                                }
                            }
                        }

                    }
                }
            }
        `
        const data = await graphQLClient.request(query)
        console.log(JSON.stringify(data, undefined, 2))
    }
}

export {syncShopifyProducts}
