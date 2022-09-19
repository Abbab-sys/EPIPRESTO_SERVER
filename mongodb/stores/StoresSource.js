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
    async addSynchronizationToStore(storeId,apiType,apiToken) {
        const query = { _id: new ObjectId(storeId) };
        const synchronizationValues = { $set: {apiType: apiType, apiToken: apiToken } };
        const mongoResponse= await(this.collection.updateOne(query, synchronizationValues))
        if(mongoResponse.matchedCount)return {code:200,message:"Synchronization parametrized"}
        return {code:406,message:"MongoDB update failed"};
    }
    async getStoreById(id) {
        return await this.findOneById(id)
    }
}
