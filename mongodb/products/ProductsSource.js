import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";

export default class ProductsSource extends MongoDataSource {
    async getProductsByIds(productsIds) {
        return await this.collection.find({
            _id: {"$in": productsIds}
        }).toArray();
    }
}
