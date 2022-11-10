import StoresSource from "../mongodb/StoresSource.js";
import {sendBulkOperationMutation} from "./shopify/SyncAllProducts.js";
import {subscribeToProductUpdateWebHook} from "./shopify/updateProduct.js";
import {syncWooCommerceProducts} from "./woocommerce/SyncWoocommerce.js";

async function syncProducts(mongoClient) {
    const storesSource = new StoresSource(mongoClient.db("Epipresto-dev").collection('Stores'))
    const storesToSync = await storesSource.findStoresToSynchronize()

    for (const store of storesToSync) {
        if (store.shopifyShopDomain){

            //Idee: pour shopify, on subscribe deja a tout lors de la creation du store, donc on a pas besoin diterer sur les produits shopify ici, vu qu'on utilise des webhook
            // if (!store.lastShopifySyncDate) {
            //     console.log('NEW SHOPIFY STORE, SYNCING ALL PRODUCTS...')
            //     //Syncronize all products
            //     await sendBulkOperationMutation(store.shopifyShopDomain,store.shopifyApiToken,store._id)

            //     //Subscribe to the product update webhook
            //     await subscribeToProductUpdateWebHook(store.shopifyShopDomain,store.shopifyApiToken,store._id)

            //     //TODO SUBSCRIBE TO PRODUCT DELETE WEBHOOK
            //     //TODO SUBSCRIBE TO PRODUCT CREATE WEBHOOK
            // }
             continue;
        }
         else if (store.woocommerceShopDomain) await syncWooCommerceProducts(mongoClient,store)
    }
}

export {syncProducts}
