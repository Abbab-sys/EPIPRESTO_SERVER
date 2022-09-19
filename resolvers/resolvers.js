const resolvers = {
    Mutation: {
        vendorSignUp: async (parent, args, {dataSources: {vendors, stores}}) => {
            const vendorAccountInput = args.accountInput // temp storeid
            const newStoreId = await stores.createNewStore(vendorAccountInput.shopName, vendorAccountInput.address)
            return await vendors.signUp({...vendorAccountInput, storeId: newStoreId})
        },
        synchronizeStore: async (parent, args,{user,dataSources:{stores}}) => {
            const apiType = args.apiType
            const apiToken = args.apiToken
            return await stores.addSynchronizationToStore(user.storeId,apiType,apiToken)
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
        store: async (parent, _, {dataSources: {stores}}) => {
            return await stores.getStoreById(parent.storeId)
        }
    },

};
export {resolvers}
