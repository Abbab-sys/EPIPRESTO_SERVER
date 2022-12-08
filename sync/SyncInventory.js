import StoresSource from "../mongodb/StoresSource.js";
import {sendBulkOperationMutation} from "./shopify/SyncAllProducts.js";
import {subscribeToProductUpdateWebHook} from "./shopify/updateProduct.js";
import { subscribeToProductCreateWebHook } from "./shopify/createProduct.js";
import {syncWooCommerceProducts} from "./woocommerce/SyncWoocommerce.js";

async function syncProducts(mongoClient) {
    const storesSource = new StoresSource(mongoClient.db("Epipresto-dev").collection('Stores'))
    const storesToSync = await storesSource.findStoresToSynchronize()

    for (const store of storesToSync) {
        if (store.shopifyShopDomain){
             continue;
        }
         else if (store.woocommerceShopDomain) await syncWooCommerceProducts(mongoClient,store)
    }
}

export {syncProducts}
