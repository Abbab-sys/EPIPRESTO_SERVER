import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";

export default class ProductsSource extends MongoDataSource {
    async getProductsByIds(productsIds) {
        if (!productsIds || productsIds.length === 0) return []
        return await this.collection.find({
            _id: {"$in": productsIds}
        }).toArray();
    }

    //create product
    async createProduct(product) {
        const {insertedId} = await this.collection.insertOne(product);
        return insertedId;
    }

    async updateProductById(idProduct, fieldsToUpdate) {
        const query = {_id: new ObjectId(idProduct)};
        const updateValues = {$set: fieldsToUpdate};
        return await this.collection.updateOne(query, updateValues);
    }
    async addNewVariantToProduct(productId, newVariantId) {
        const query = {_id: new ObjectId(productId)};
        const updateVariants = {$push: {variantsIds: newVariantId}};
        return await this.collection.updateOne(query, updateVariants);
    }
    async removeVariantFromProduct(productId, variantId) {
        const query = {_id: new ObjectId(productId)};
        const updateVariants = {$pull: {variantsIds: variantId}};
        return await this.collection.updateOne(query, updateVariants);
    }
    async deleteProductById(idProduct) {
        const query = {_id: new ObjectId(idProduct)};
        return await this.collection.deleteOne(query);
    }
}
