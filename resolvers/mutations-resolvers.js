import {getShopifyProductsWithCredentials} from "../sync/SyncShopify.js";
import {getWooCommerceProductsWithCredentials} from "../sync/syncWooCommerce.js";
import {
    graphqlUpdateProductFields,
    graphqlUpdateStoreFields,
    graphqlUpdateVendorAccountFields
} from "./updates-accepted-fields.js";
import {mutationsUpdatesResolvers} from "./mutations-resolvers/mutations-updates-resolvers.js";
import {mutationsSyncResolvers} from "./mutations-resolvers/mutations-sync-resolvers.js";
import {mutationsProductsManagementResolvers} from "./mutations-resolvers/mutations-products-management-resolvers.js";
import * as nodemailer from 'nodemailer';
import {sendConfirmationEmail} from "../email/SendConfirmationEmail.js";

const mutationsResolvers = {
    Mutation: {
        ...mutationsUpdatesResolvers,
        ...mutationsSyncResolvers,
        ...mutationsProductsManagementResolvers,
        vendorSignUp: async (parent, {accountInput}, {dataSources: {vendors, stores,verificationTokens}}) => {
            const {shopName, address} = accountInput
            try {
                accountInput.storeId = await stores.createNewStore(shopName, address)
                const newVendorAccount = await vendors.signUp(accountInput)
                const newToken = await verificationTokens.createVendorToken(newVendorAccount._id)
                sendConfirmationEmail(newVendorAccount.email, newToken.toString())

                return {
                    code: 200,
                    message: "Vendor account created successfully, please check your email to confirm your account",
                }
            } catch (e) {
                return {code: 406, message: e.message}
            }
        },
        verifyVendorAccount: async (parent, {token}, {dataSources: {vendors, verificationTokens}}) => {
            const {relatedVendorId, relatedClientId} = await verificationTokens.findOneById(token)
            if (relatedVendorId) {
                const vendorAccount = await vendors.findOneById(relatedVendorId)
                if (vendorAccount) {
                    await vendors.updateOneById(relatedVendorId, {verified: true})
                    await verificationTokens.deleteOneById(token)
                    return {
                        code: 200,
                        message: "Vendor account verified",
                        vendorAccount: vendorAccount
                    }
                }
                return {code: 404, message: "Inactive Token"}
            }
            // if (relatedClientId) {
            //     const clientAccount = await clients.findOneById(relatedClientId)
            //     if (clientAccount) {
            //         await clients.updateOneById(relatedClientId, {verified: true})
            //         await verificationTokens.deleteOneById(token)
            //         return {
            //             code: 200,
            //             message: "Client account verified",
            //             clientAccount: clientAccount
            //         }
            //     }
            // }
            return {code: 406, message: "Token not found"}
        }
    }
};
export {mutationsResolvers}
