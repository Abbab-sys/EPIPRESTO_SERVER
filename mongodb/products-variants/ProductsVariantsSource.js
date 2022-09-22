import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";

export default class ProductsVariantsSource extends MongoDataSource {
    async getProductsVariantsByIds(variantsIds) {
        if (!variantsIds || variantsIds.length === 0) return []
        return await this.collection.find({
            _id: {"$in": variantsIds}
        }).toArray();
    }

    // create product variant
    async createProductVariant(productVariant) {
        const {insertedId} = await this.collection.insertOne(productVariant);
        return insertedId;
    }
}
