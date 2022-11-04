import {
    graphqlUpdateProductFields, graphqlUpdateProductVariantFields,
    graphqlUpdateStoreFields,
    graphqlUpdateVendorAccountFields
} from "../updates-accepted-fields.js";

const mutationsUpdatesResolvers = {
    updateStore: async (parent, args, {dataSources: {stores}}) => {
        const {storeId, fieldsToUpdate} = args;
        const cleanedFieldsToUpdate = {};
        for (const [key, value] of Object.entries(fieldsToUpdate)) {
            if (key in graphqlUpdateStoreFields && value !== null) {
                cleanedFieldsToUpdate[key] = value
            }
        }
        const updateResult = await stores.updateStoreById(storeId, cleanedFieldsToUpdate);
        if (updateResult.matchedCount) {
            return {
                code: 200,
                message: "Store updated",
                store: await stores.findOneById(storeId)
            }
        }
        return {code: 406, message: "MongoDB update failed to update store"};
    },
    updateVendorAccount: async (parent, args, {dataSources: {vendors}}) => {
        const {vendorId, fieldsToUpdate} = args;
        const cleanedFieldsToUpdate = {};
        for (const [key, value] of Object.entries(fieldsToUpdate)) {
            if (key in graphqlUpdateVendorAccountFields && value !== null) {
                cleanedFieldsToUpdate[key] = value
            }
        }
        const updateResult = await vendors.updateVendorById(vendorId, cleanedFieldsToUpdate);
        if (updateResult.matchedCount) {
            return {
                code: 200,
                message: "Vendor updated",
                vendor: await vendors.findOneById(vendorId)
            }
        }
        return {code: 406, message: "Database failed to update vendor account"};
    },
    updateProduct: async (parent, args, {dataSources: {products}}) => {
        const {productId, fieldsToUpdate} = args;
        const cleanedFieldsToUpdate = {};
        for (const [key, value] of Object.entries(fieldsToUpdate)) {
            if (key in graphqlUpdateProductFields && value !== null) {
                cleanedFieldsToUpdate[key] = value
            }
        }
        const updateResult = await products.updateProductById(productId, cleanedFieldsToUpdate);
        if (updateResult.matchedCount) {
            return {
                code: 200,
                message: "Product updated",
                product: await products.findOneById(productId)
            }
        }
        return {code: 406, message: "Database failed to update product"};
    },
    updateProductVariant: async (parent, args, {dataSources: {productsVariants}}) => {
        const {variantId, fieldsToUpdate} = args;
        const cleanedFieldsToUpdate = {};
        for (const [key, value] of Object.entries(fieldsToUpdate)) {
            if (key in graphqlUpdateProductVariantFields && value !== null) {
                cleanedFieldsToUpdate[key] = value
            }
        }
        const updateResult = await productsVariants.updateProductVariantById(variantId, cleanedFieldsToUpdate);
        if (updateResult.matchedCount) {
            return {
                code: 200,
                message: "Product variant updated",
                variant: await productsVariants.findOneById(variantId)
            }
        }
        return {code: 406, message: "Database failed to update product variant"};
    },
    updateProductsVariants: async (parent, {variantsToUpdate}, {dataSources: {productsVariants}}) => {
        for (const variant of variantsToUpdate) {
            if(!variant.variantId) {
                return {code: 406, message: "Missing variantId"};
            }
        }
        for (const variant of variantsToUpdate) {
            const cleanedFieldsToUpdate = {};
            const {variantId, ...fieldsToUpdate} = variant;
            const {code,message}=await mutationsUpdatesResolvers.updateProductVariant(parent, {variantId, fieldsToUpdate}, {dataSources: {productsVariants}})
            if(code!==200){
                return {code,message}
            }
        }
        return {code: 200, message: "Product variants updated"};
    }

};
export {mutationsUpdatesResolvers}
