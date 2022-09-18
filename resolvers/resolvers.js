import {ObjectId} from "mongodb";

const resolvers = {
    Mutation: {
        vendorSignUp: (parent, args, {dataSources: {vendors, stores}}) => {
            const vendorAccountInput = {...args.accountInput, storeId: new ObjectId()} // temp storeid
            const newStoreId = stores.createNewStore(vendorAccountInput.shopName, vendorAccountInput.address)
            const accountsFound = vendors.signUp({...vendorAccountInput, storeId: newStoreId})
            if (accountsFound.length !== 1) return null
            return accountsFound[0]
        },
    },
    Query: {
        loginVendor: async (_, args, {dataSources: {vendors}}) => {
            const accountsFound = await vendors.loginByEmail(args.email, args.password)
            if (accountsFound.length !== 1) return null
            return accountsFound[0]
        },
    },
    VendorAccount: {
        store(parent, _, {dataSources: {stores}}) {
            return stores.getStoreById(parent.storeId)
        }
    },
    //
    // Store: {
    //     products(parent, args, context, info) {
    //     },
    //     disponibilities(parent, args, context, info) {
    //     }
    //
    // },
    // Product: {
    //     vendor(parent, args, context, info) {
    //     },
    // },
    // Disponibility: {
    //     activesHours(parent, args, context, info) {
    //     },
    // }
};
export {resolvers}
