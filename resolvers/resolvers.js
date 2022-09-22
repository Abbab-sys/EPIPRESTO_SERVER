const resolvers = {
    Mutation: {
        vendorSignUp: async (parent, args, {dataSources: {vendors, stores}}) => {
            const vendorAccountInput = args.accountInput // temp storeid
            const newStoreId = await stores.createNewStore(vendorAccountInput.shopName, vendorAccountInput.address)
            return await vendors.signUp({...vendorAccountInput, storeId: newStoreId})
        },
        synchronizeWoocommerceStore: async (parent, args, {user, dataSources: {stores}}) => {
            try {
                user = JSON.parse(user)
            } catch (e) {
                return {code: 500, message: e.message}
            }
            const woocommerceCreds = args.woocommerceCreds
            const apiToken = woocommerceCreds.apiToken
            const shopDomain = woocommerceCreds.shopDomain
            return await stores.addWoocommerceSyncToStore(user.storeId, apiToken, shopDomain)
        },
        synchronizeShopifyStore: async (parent, args, {user, dataSources: {stores}}) => {
            try {
                user = JSON.parse(user)
            } catch (e) {
                return {code: 500, message: e.message}
            }
            const shopifyCreds = args.shopifyCreds
            const apiToken = shopifyCreds.apiToken
            const shopDomain = shopifyCreds.shopDomain
            return await stores.addShopifySyncToStore(user.storeId, apiToken, shopDomain)
        },

    },
    Query: {
        getStoreById: async (_, args, {dataSources: {stores}}) => {
            return await stores.findOneById(args.idStore)
        },
        getProductVariantById: async (_, args, {dataSources: {productsVariants}}) => {
            return await productsVariants.findOneById(args.idVariant)
        },
        getProductById: async (_, args, {dataSources: {products}}) => {
            return await products.findOneById(args.idProduct)
        },
        loginVendor: async (_, args, {dataSources: {vendors}}) => {
            const accountsFound = await vendors.loginByEmail(args.email, args.password)
            if (accountsFound.length !== 1) return null
            return accountsFound[0]
        },
        isVendorUsernameUsed: async (_, args, {dataSources: {vendors}}) => {
            const accountsFound = await vendors.findVendorByUsername(args.username)
            return accountsFound.length !== 0
        },
        isVendorEmailUsed: async (_, args, {dataSources: {vendors}}) => {
            const accountsFound = await vendors.findVendorByEmail(args.email)
            return accountsFound.length !== 0
        },
    },
    VendorAccount: {
        store: async (parent, _, {dataSources: {stores}}) => {
            return await stores.findOneById(parent.storeId)
        }
    },
    Store: {
        products: async (mongoStoreObject, _, {dataSources: {products}}) => {
            const productsIds = mongoStoreObject.productsIds
            return await products.getProductsByIds(productsIds)
        },
    },
    Product: {
        relatedStore: async (mongoProductObject, _, {dataSources: {stores}}) => {
            const relatedStoreId = mongoProductObject.relatedStoreId
            return await stores.findOneById(relatedStoreId)
        },
        variants: async (mongoProductObject, _, {dataSources: {productsVariants}}) => {
            const productsVariantsIds = mongoProductObject.variantsIds
            return await productsVariants.getProductsVariantsByIds(productsVariantsIds)
        },
    },
    ProductVariant: {
        relatedProduct: async (mongoProductVariantObject, _, {dataSources: {products}}) => {
            const relatedProductId = mongoProductVariantObject.relatedProductId
            return await products.findOneById(relatedProductId)
        },
    },
};
export {resolvers}
