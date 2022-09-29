import StoresSource from "../mongodb/stores/StoresSource.js";
import {syncShopifyProducts} from "./syncShopify.js";
import {syncWooCommerceProducts} from "./syncWooCommerce.js";

async function syncProducts(mongoClient) {
    const storesSource = new StoresSource(mongoClient.db("Epipresto-dev").collection('Stores'))
    const storesToSync = await storesSource.findStoresToSynchronize()
    for (const store of storesToSync) {
        if (store.shopifyShopDomain) await syncShopifyProducts(mongoClient,store)
        else if (store.woocommerceShopDomain) await syncWooCommerceProducts(mongoClient,store)
    }
}

export {syncProducts}
