import {GraphQLClient, gql} from 'graphql-request'

async function main() {
    const endpoint = 'https://projet4-8301.myshopify.com/admin/api/2022-07/graphql.json'

    const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
            "X-Shopify-Access-Token": "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"
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

main().catch((error) => console.error(error))
