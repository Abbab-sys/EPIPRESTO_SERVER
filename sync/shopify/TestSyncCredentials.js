import { GraphQLClient, gql } from "graphql-request";

export async function testShopifyRequest(
    shopifyShopDomain,
    shopifyToken
  ) {
    const shopifyEndpoint = shopifyShopDomain + "/admin/api/2022-07/graphql.json";
    const graphQLClient = new GraphQLClient(shopifyEndpoint, {
      headers: {
        "X-Shopify-Access-Token": shopifyToken,
      },
    });
  
  
    const query = gql`
      query getProducts {
        products(first: 1) {
          pageInfo {
            hasNextPage
          }
          edges {
            cursor
            node {
              id
              title
              tags
              publishedAt
              variants(first: 100) {
                edges {
                  node {
                    id
                    displayName
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
    `;
    return await graphQLClient.request(query);
  }