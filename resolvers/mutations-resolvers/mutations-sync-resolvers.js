import {getWooCommerceProductsWithCredentials} from "../../sync/woocommerce/SyncWoocommerce.js";
import { testShopifyRequest } from "../../sync/shopify/TestSyncCredentials.js";
import { subscribeToProductUpdateWebHook } from "../../sync/shopify/updateProduct.js";
import {subscribeToProductCreateWebHook} from "../../sync/shopify/createProduct.js";
import { sendBulkOperationMutation } from "../../sync/shopify/SyncAllProducts.js";
import {syncWooCommerceProducts} from "../../sync/woocommerce/SyncWoocommerce.js";

const mutationsSyncResolvers = {

    synchronizeWoocommerceStore: async (parent, args, {user,client, dataSources: {stores}}) => {
        try {
            user = JSON.parse(user)
        } catch (e) {
            return {code: 500, message: e.message}
        }
        const {woocommerceCreds} = args
        const {consumerKey, consumerSecretKey, shopDomain} = woocommerceCreds
        try {
            await getWooCommerceProductsWithCredentials(shopDomain, consumerKey, consumerSecretKey)
            await stores.addWoocommerceSyncToStore(user.storeId, consumerKey, consumerSecretKey, shopDomain)

            const store = await stores.getStoreById(user.storeId)

            await syncWooCommerceProducts(client,store)

            return {
                code: 200,
                message: "Woocommerce Store ready to be synchronized"
            }
        } catch (e) {
            return {code: 406, message: e.message}
        }
    },
    synchronizeShopifyStore: async (parent, args, {user, dataSources: {stores}}) => {
        try {
            user = JSON.parse(user)
        } catch (e) {
            return {code: 500, message: e.message}
        }
        const {shopifyCreds} = args
        const {apiToken, shopDomain} = shopifyCreds
        try {
            await testShopifyRequest(shopDomain, apiToken)
            await stores.addShopifySyncToStore(user.storeId, apiToken, shopDomain)

            //Sync ALL products into our DB the first time the store is synchronized
            await sendBulkOperationMutation(shopDomain, apiToken, user.storeId)

            //Subscribe to product update webhook
            await subscribeToProductUpdateWebHook(shopDomain, apiToken, user.storeId)
            
            //Subscribe to product create webhook
            await subscribeToProductCreateWebHook(shopDomain, apiToken, user.storeId)



            await stores.updateStoreById(user.storeId, {
                lastShopifySyncDate: new Date().toISOString().slice(0, 19),
              });

            return {
                code: 200,
                message: "Shopify store ready to be synchronized",
            }
        } catch (e) {
            return {code: 406, message: e.message}
        }
    },


};
export {mutationsSyncResolvers}
