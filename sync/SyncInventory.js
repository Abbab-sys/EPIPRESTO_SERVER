import StoresSource from "../mongodb/StoresSource.js";
import {sendBulkOperationMutation} from "./shopify/SyncAllProducts.js";
import {subscribeToProductUpdateWebHook} from "./shopify/updateProduct.js";
import {syncWooCommerceProducts} from "./woocommerce/SyncWoocommerce.js";

async function syncProducts(mongoClient) {
    const storesSource = new StoresSource(mongoClient.db("Epipresto-dev").collection('Stores'))
    const storesToSync = await storesSource.findStoresToSynchronize()

    for (const store of storesToSync) {
        if (store.shopifyShopDomain){
            //check if the store has a lastShopifySyncDate, if not it means its the first time we sync the store. if yes, continue to the next store
            if (!store.lastShopifySyncDate) {
                console.log('NEW SHOPIFY STORE, SYNCING ALL PRODUCTS...')
                await sendBulkOperationMutation(store.shopifyShopDomain,store.shopifyApiToken,store._id)

                //SUBSCRIBE TO PRODUCT UPDATE WEBHOOK
                await subscribeToProductUpdateWebHook(store.shopifyShopDomain,store.shopifyApiToken,store._id)

                //TODO SUBSCRIBE TO PRODUCT DELETE WEBHOOK
                //TODO SUBSCRIBE TO PRODUCT CREATE WEBHOOK
            }
            else continue;
        }
         else if (store.woocommerceShopDomain) await syncWooCommerceProducts(mongoClient,store)
    }
}

export {syncProducts}
