import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";
import sanitize from 'mongo-sanitize';

//This Class contains all the methods to interact with the database for the Products collection
export default class ProductsSource extends MongoDataSource {
    async findOneById(id) {
        id = sanitize(id);
        return await this.collection.findOne({_id: new ObjectId(id)})
    }

    async getAllProducts() {
        return await this.collection.find({}).toArray();
    }

    async getProductsByIds(productsIds) {
        productsIds = sanitize(productsIds);
        if (!productsIds || productsIds.length === 0) return []
        return await this.collection.find({
            _id: {"$in": productsIds}
        }).toArray();
    }

    async getRelatedStoreId(productId) {
        productId = sanitize(productId);
        const {relatedStoreId} = await this.collection.findOne({_id: new ObjectId(productId)}, {projection: {relatedStoreId: 1}});
        return relatedStoreId;
    }

    //create product
    async createProduct(product) {
        const {variants, ...productWithoutVariants} = product;
        productWithoutVariants.variantsIds = [];
        const {insertedId} = await this.collection.insertOne(productWithoutVariants);
        return insertedId;
    }

    async updateProductById(idProduct, fieldsToUpdate) {
        idProduct = sanitize(idProduct);
        const query = {_id: new ObjectId(idProduct)};
        const updateValues = {$set: fieldsToUpdate};
        return await this.collection.updateOne(query, updateValues);
    }

    async addNewVariantToProduct(productId, newVariantId) {
        productId = sanitize(productId);
        const query = {_id: new ObjectId(productId)};
        const updateVariants = {$push: {variantsIds: newVariantId}};
        return await this.collection.updateOne(query, updateVariants);
    }

    async removeVariantFromProduct(productId, variantId) {
        productId = sanitize(productId);
        const query = {_id: new ObjectId(productId)};
        const updateVariants = {$pull: {variantsIds: new ObjectId(variantId)}};
        return await this.collection.updateOne(query, updateVariants);
    }

    async deleteProductById(idProduct) {
        idProduct = sanitize(idProduct);
        const query = {_id: new ObjectId(idProduct)};
        return await this.collection.deleteOne(query);
    }

    //GET single product by id
    async getProductByShopifyId(idProduct) {
        idProduct = sanitize(idProduct);
        return await this.collection.findOne({shopifyProductId: idProduct});
    }

}
