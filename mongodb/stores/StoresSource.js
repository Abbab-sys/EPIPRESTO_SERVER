import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";

export default class StoresSource extends MongoDataSource {
    async createNewStore(shopName, shopAddress) {
        return (await this.collection.insertOne({
            name: shopName,
            address: shopAddress,
            disponibilities: []
        })).insertedId
    }

    async addShopifySyncToStore(storeId, apiToken, shopDomain) {
        const query = {_id: new ObjectId(storeId)};
        const synchronizationValues = {
            $set: {
                apiType: "SHOPIFY",
                shopifyShopDomain: shopDomain,
                shopifyApiToken: apiToken
            }
        };
        const mongoResponse = await (this.collection.updateOne(query, synchronizationValues))
        if (mongoResponse.matchedCount) return {code: 200, message: "Synchronization parametrized"}
        return {code: 406, message: "MongoDB update failed"};
    }

    async addWoocommerceSyncToStore(storeId, consumerKey,consumerSecretKey, shopDomain) {
        const query = {_id: new ObjectId(storeId)};
        const synchronizationValues = {
            $set: {
                apiType: "WOOCOMMERCE",
                woocommerceShopDomain: shopDomain,
                woocommerceConsumerKey: consumerKey,
                woocommerceConsumerSecretKey: consumerSecretKey
            }
        };
        const mongoResponse = await (this.collection.updateOne(query, synchronizationValues))
        if (mongoResponse.matchedCount) return {code: 200, message: "Synchronization parametrized"}
        return {code: 406, message: "MongoDB update failed"};
    }

    async findStoresToSynchronize() {
        return await this.collection.find({
            apiType: {"$in": ["SHOPIFY","WOOCOMMERCE"]} // TODO add this to a global const
        }).toArray();
    }
    async updateStoreById(storeId, fieldsToUpdate) {
        const query = {_id: new ObjectId(storeId)};
        const updateValues = {$set: fieldsToUpdate};
        return await this.collection.updateOne(query, updateValues);
    }
    async addNewProductToStore(storeId, newProductId) {
        const query = {_id: new ObjectId(storeId)};
        const updateProducts = {$push: {productsIds: newProductId}};
        return await this.collection.updateOne(query, updateProducts);
    }
    async removeProductFromStore(storeId, productId) {
        const query = {_id: new ObjectId(storeId)};
        const updateProducts = {$pull: {productsIds: productId}};
        return await this.collection.updateOne(query, updateProducts);
    }

    //get store by id
    async getStoreById(storeId) {
        return await this.collection.findOne({_id: new ObjectId(storeId)})
    }


    
}
