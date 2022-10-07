import {getWooCommerceProductsWithCredentials} from "../sync/woocommerce/syncWooCommerce.js";
import {
    graphqlUpdateProductFields,
    graphqlUpdateStoreFields,
    graphqlUpdateVendorAccountFields
} from "./updates-accepted-fields.js";
import {mutationsUpdatesResolvers} from "./mutations-resolvers/mutations-updates-resolvers.js";
import {mutationsSyncResolvers} from "./mutations-resolvers/mutations-sync-resolvers.js";
import {mutationsProductsManagementResolvers} from "./mutations-resolvers/mutations-products-management-resolvers.js";

const mutationsResolvers = {
    Mutation: {
        ...mutationsUpdatesResolvers,
        ...mutationsSyncResolvers,
        ...mutationsProductsManagementResolvers,
        vendorSignUp: async (parent, args, {dataSources: {vendors, stores}}) => {
            const {accountInput} = args // temp storeid
            const {shopName, address} = accountInput
            try {
                accountInput.storeId = await stores.createNewStore(shopName, address)
                const newVendorAccount = await vendors.signUp(accountInput)
                return {
                    code: 200,
                    message: "Vendor account created",
                    vendorAccount: newVendorAccount
                }
            } catch (e) {
                return {code: 406, message: e.message}
            }
        },
    }
};
export {mutationsResolvers}
