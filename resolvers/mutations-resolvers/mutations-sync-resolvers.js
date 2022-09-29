import {getWooCommerceProductsWithCredentials} from "../../sync/SyncWoocommerce.js";
import {getShopifyProductsWithCredentials} from "../../sync/SyncShopify.js";

const mutationsSyncResolvers = {
    synchronizeWoocommerceStore: async (parent, args, {user, dataSources: {stores}}) => {
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
            await getShopifyProductsWithCredentials(shopDomain, apiToken)
            await stores.addShopifySyncToStore(user.storeId, apiToken, shopDomain)
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
