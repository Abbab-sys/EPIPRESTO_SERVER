import {MongoDataSource} from "apollo-datasource-mongodb";

export default class StoresSource extends MongoDataSource {
    async createNewStore(shopName, shopAddress) {
        return (await this.collection.insertOne({
            name: shopName,
            adress: shopAddress,
            products: [],
            disponibilities: []
        })).insertedId
    }

    async getStoreById(id) {
        return await this.findOneById(id)
    }
}
