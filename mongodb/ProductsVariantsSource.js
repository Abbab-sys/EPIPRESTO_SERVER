import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";
import sanitize from 'mongo-sanitize';

export default class ProductsVariantsSource extends MongoDataSource {
    async findOneById(id) {
        id=sanitize(id);
        return await this.collection.findOne({_id: new ObjectId(id)})
    }
    async getProductsVariantsByIds(variantsIds) {
        variantsIds=sanitize(variantsIds);
        if (!variantsIds || variantsIds.length === 0) return []
        return await this.collection.find({
            _id: {"$in": variantsIds}
        }).toArray();
    }
    async findProductVariantsByProductId(productId) {
        productId=sanitize(productId);
        return await this.collection.find({
            relatedProductId: productId
        }).toArray();
    }
    async createProductVariant(productVariant) {
        // const {insertedId} = await this.collection.insertOne(productVariant);
        // return insertedId;
        const {insertedId}= await this.collection.insertOne(productVariant);
        return insertedId;
    }
    async updateProductVariantById(idProductVariant, fieldsToUpdate) {
        idProductVariant=sanitize(idProductVariant);
        const query = {_id: new ObjectId(idProductVariant)};
        const updateValues = {$set: fieldsToUpdate};
        return await this.collection.updateOne(query, updateValues);
    }
    async deleteProductVariantById(idProductVariant) {
        idProductVariant=sanitize(idProductVariant);
        const query = {_id: new ObjectId(idProductVariant)};
        return await this.collection.deleteOne(query);
    }
    async deleteProductVariantsByProductId(productId) {
        productId=sanitize(productId);
        const query = {relatedProductId: productId};
        return await this.collection.deleteMany(query);
    }

    //getProductVariantByShopifyProductVariantId

    async getProductVariantByShopifyId(shopifyProductVariantId) {
        shopifyProductVariantId=sanitize(shopifyProductVariantId);
        return await this.collection.findOne({
            shopifyVariantId: shopifyProductVariantId
        });
    }


}
