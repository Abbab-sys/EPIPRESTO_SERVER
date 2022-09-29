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
            if (graphqlUpdateStoreFields.includes(key) && value) {
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
            if (graphqlUpdateVendorAccountFields.includes(key) && value) {
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
            if (graphqlUpdateProductFields.includes(key) && value) {
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
            if (graphqlUpdateProductVariantFields.includes(key) && value) {
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

};
export {mutationsUpdatesResolvers}
