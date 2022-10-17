const queriesGettersByIdResolvers = {
    getStoreById: async (_, args, {dataSources: {stores}}) => {
        const result = await stores.findOneById(args.idStore)
        if (result) {
            return {
                code: 200,
                message: "Store found",
                store: result
            }
        } else {
            return {
                code: 404,
                message: "Store not found"
            }
        }
    },
    getProductVariantById: async (_, args, {dataSources: {productsVariants}}) => {
        const result = await productsVariants.findOneById(args.idVariant)
        if (result) {
            return {
                code: 200,
                message: "Product variant found",
                productVariant: result
            }
        } else {
            return {
                code: 404,
                message: "Product variant not found"
            }
        }
    },
    getProductById: async (_, args, {dataSources: {products}}) => {
        const result = await products.findOneById(args.idProduct)
        if (result) {
            return {
                code: 200,
                message: "Product found",
                product: result
            }
        } else {
            return {
                code: 404,
                message: "Product not found"
            }
        }
    },
    getOrderById: async (_, args, {dataSources: {orders}}) => {
        const result = await orders.findOneById(args.idOrder)
        if (result) {
            return {
                code: 200,
                message: "Order found",
                order: result
            }
        } else {
            return {
                code: 404,
                message: "Order not found"
            }
        }
    }
};
export {queriesGettersByIdResolvers}
