import {GraphQLClient, gql} from 'graphql-request'
import StoresSource from "../mongodb/stores/StoresSource.js";
import {syncShopifyProducts} from "./syncShopify.js";

async function syncProducts(mongoClient) {
    const storesSource = new StoresSource(mongoClient.db("Epipresto-dev").collection('Stores'))
    const storesToSync = await storesSource.findStoresToSynchronize()
    for (const store of storesToSync) {
        if (store.shopifyShopDomain) syncShopifyProducts(mongoClient,store)
        
    }
}

export {syncProducts}
