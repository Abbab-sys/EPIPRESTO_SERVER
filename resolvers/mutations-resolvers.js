import {getWooCommerceProductsWithCredentials} from "../sync/woocommerce/SyncWooCommerce.js";
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
import {ObjectId} from "mongodb";
import {mutationsOrdersResolvers} from "./mutations-resolvers/mutations-orders-resolvers.js";
import {PUB_SUB} from "./subscriptions-resolvers.js";

const mutationsResolvers = {
    Mutation: {
        ...mutationsUpdatesResolvers,
        ...mutationsSyncResolvers,
        ...mutationsProductsManagementResolvers,
        ...mutationsOrdersResolvers,
        vendorSignUp: async (parent, {accountInput}, {dataSources: {vendors, stores, verificationTokens}}) => {
            const {shopName, address} = accountInput
            try {
                accountInput.storeId = await stores.createNewStore(shopName, address)
                const newVendorAccount = await vendors.signUp(accountInput)
                await stores.updateOne(newVendorAccount.storeId, {$set:{relatedVendorId: newVendorAccount._id}})
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
        clientSignUp: async (parent, {accountInput}, {dataSources: {clients}}) => {
            try {
                const newClientAccount = await clients.signUp(accountInput)
                // const newToken = await verificationTokens.createVendorToken(newVendorAccount._id)
                // sendConfirmationEmail(newVendorAccount.email, newToken.toString())
                return {
                    code: 200,
                    message: "Client account created successfully",
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
                    const query = {_id: new ObjectId(relatedVendorId)};
                    const updateValues = {$set: {verified: true}};
                    await vendors.collection.updateOne(query, updateValues)
                    await verificationTokens.collection.deleteOne({_id: new ObjectId(token)})
                    return {
                        code: 200,
                        message: "Vendor account verified",
                        vendorAccount: vendorAccount
                    }
                }
                return {code: 404, message: "Inactive Token"}
            }
         
            return {code: 406, message: "Token not found"}
        },
        sendMessageToChat: async (parent, {message:messageInput}, {dataSources: {messages, chats,stores,clients}}) => {
            const {relatedChatID, content, role} = messageInput

            try {
                const newMessageId = await messages.createNewMessage(content, role, relatedChatID)
                const {
                    chatId,
                    relatedVendorId,
                    relatedClientId
                } = await chats.addMessageToChat(relatedChatID, newMessageId)
                const newMessage = await messages.findOneById(newMessageId)
                newMessage.relatedVendor = await stores.findOneById(relatedVendorId)
                newMessage.relatedChat = await chats.findOneById(chatId)
                newMessage.relatedClient = await clients.findOneById(relatedClientId)
                PUB_SUB.publish("MESSAGE_SENT", {messageSent:newMessage})
                return {code: 200, message: "Message sent successfully"}

            } catch (e) {
                return {code: 406, message: e.message}
            }
        }
    }
};
export {mutationsResolvers}
