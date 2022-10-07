import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";

export default class ProductsVariantsSource extends MongoDataSource {
    async getProductsVariantsByIds(variantsIds) {
        if (!variantsIds || variantsIds.length === 0) return []
        return await this.collection.find({
            _id: {"$in": variantsIds}
        }).toArray();
    }
    async findProductVariantsByProductId(productId) {
        return await this.collection.find({
            relatedProductId: productId
        }).toArray();
    }
    async createProductVariant(productVariant) {
        // const {insertedId} = await this.collection.insertOne(productVariant);
        // return insertedId;
        return await this.collection.insertOne(productVariant);
    }
    async updateProductVariantById(idProductVariant, fieldsToUpdate) {
        const query = {_id: new ObjectId(idProductVariant)};
        const updateValues = {$set: fieldsToUpdate};
        return await this.collection.updateOne(query, updateValues);
    }
    async deleteProductVariantById(idProductVariant) {
        const query = {_id: new ObjectId(idProductVariant)};
        return await this.collection.deleteOne(query);
    }
    async deleteProductVariantsByProductId(productId) {
        const query = {relatedProductId: productId};
        return await this.collection.deleteMany(query);
    }

    //getProductVariantByShopifyProductVariantId

    async getProductVariantByShopifyId(shopifyProductVariantId) {
        return await this.collection.findOne({
            shopifyVariantId: shopifyProductVariantId
        });
    }
    

}
