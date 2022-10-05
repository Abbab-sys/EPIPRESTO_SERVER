const outputsResolvers = {
    VendorAccount: {
        store: async (parent, _, {dataSources: {stores}}) => {
            return await stores.findOneById(parent.storeId)
        }
    },
    Store: {
        products: async (mongoStoreObject, {first,offset}, {dataSources: {products}}) => {
            const productsIds = mongoStoreObject.productsIds
            const productsIdsSliced = productsIds.slice(offset, offset + first)
            return await products.getProductsByIds(productsIdsSliced)
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
export {outputsResolvers}
