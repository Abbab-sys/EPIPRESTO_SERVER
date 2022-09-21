import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";

export default class StoresSource extends MongoDataSource {
    async createNewStore(shopName, shopAddress) {
        return (await this.collection.insertOne({
            name: shopName,
            address: shopAddress,
            products: [],
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

    async addWoocommerceSyncToStore(storeId, apiToken, shopDomain) {
        const query = {_id: new ObjectId(storeId)};
        const synchronizationValues = {
            $set: {
                apiType: "WOOCOMMERCE",
                woocommerceShopDomain: shopDomain,
                woocommerceApiToken: apiToken
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

}
