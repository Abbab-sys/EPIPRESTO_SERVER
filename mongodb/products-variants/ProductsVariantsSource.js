import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";

export default class ProductsVariantsSource extends MongoDataSource {
    async getProductsVariantsByIds(variantsIds) {
        return await this.collection.find({
            _id: {"$in": variantsIds}
        }).toArray();
    }

}
