import {ObjectId} from "mongodb";
const mutationsProductsManagementResolvers = {
    addNewVariantToProduct: async (parent, args, {dataSources: {productsVariants, products}}) => {
        const {productId, newVariant} = args
        newVariant.relatedProductId = new ObjectId(productId)
        try {
            const newVariantId = await productsVariants.createProductVariant(newVariant)
            await products.addNewVariantToProduct(productId, newVariantId)
            return {code: 200, message: "Variant added successfully"}
        } catch (e) {
            return {code: 500, message: e.message}
        }
    },
    addNewVariantsToProduct: async (parent, {productId, newVariants}, {dataSources: {productsVariants, products}}) => {
        for (const newVariant of newVariants) {
            const {code, message} = await mutationsProductsManagementResolvers.addNewVariantToProduct(parent, {
                productId,
                newVariant
            }, {dataSources: {productsVariants, products}})
            if (code !== 200) {
                return {code, message}
            }
        }
        return {code: 200, message: "Variants added successfully"}
    },
    removeVariantById: async (parent, args, {dataSources: {productsVariants, products}}) => {
        const {productVariantId} = args
        try {
            const variantToDelete = await productsVariants.findOneById(productVariantId)
            if (!variantToDelete) return {code: 404, message: "Variant not found"}
            const relatedProductId = variantToDelete.relatedProductId
            const relatedProduct = await products.findOneById(relatedProductId)
            if (relatedProduct.variantsIds.length === 1) {
                return {code: 406, message: "Cannot delete the last variant of a product"}
            }
            const deletionResult = await productsVariants.deleteProductVariantById(productVariantId);
            if (deletionResult.deletedCount === 1) {
                await products.removeVariantFromProduct(relatedProductId.toString(), productVariantId);
                return {code: 200, message: "Variant removed successfully"}
            }
            return {code: 404, message: "Variant not found"}
        } catch (e) {
            return {code: 500, message: e.message}
        }
    },
    removeVariantsByIds: async (parent, {productVariantsIds}, {dataSources: {productsVariants, products}}) => {
        for (const productVariantId of productVariantsIds) {
            const {code, message} = await mutationsProductsManagementResolvers.removeVariantById(parent, {
                productVariantId
            }, {dataSources: {productsVariants, products}})
            if (code !== 200) {
                return {code, message}
            }
        }
        return {code: 200, message: "Variants removed successfully"}
    },
    addNewProductToStore: async (parent, {storeId, newProduct}, {
        dataSources: {
            productsVariants,
            products,
            stores
        }
    }) => {
        const {variants} = newProduct
        newProduct.relatedStoreId = storeId
        let newProductId = null
        try {
            newProductId = await products.createProduct(newProduct)
            await stores.addNewProductToStore(storeId, newProductId)
            for (const variant of variants) {
                variant.relatedProductId = new ObjectId(newProductId)
                const newVariantId = await productsVariants.createProductVariant(variant)
                await products.addNewVariantToProduct(newProductId, newVariantId)
            }
            return {code: 200, message: "Product added successfully"}
        } catch (e) {
            // Clean up
            if (!newProductId) return {code: 500, message: e.message}
            await products.deleteProductById(newProductId)
            await stores.removeProductFromStore(storeId, newProductId)
            await productsVariants.deleteProductVariantsByProductId(newProductId)
            return {code: 500, message: e.message}
        }
    },
    removeProductById: async (parent, args, {dataSources: {productsVariants, products, stores}}) => {
        const {productId} = args
        try {
            const productToDelete = await products.findOneById(productId)
            const relatedStoreId = productToDelete.relatedStoreId
            const deletionResult = await products.deleteProductById(productId);

            if (deletionResult.deletedCount === 1) {
                await stores.removeProductFromStore(relatedStoreId, productId);
                await productsVariants.deleteProductVariantsByProductId(productId)
                return {code: 200, message: "Product removed successfully"}
            }
            return {code: 500, message: "Product not found"}
        } catch (e) {
            return {code: 500, message: e.message}
        }
    },


};
export {mutationsProductsManagementResolvers}
