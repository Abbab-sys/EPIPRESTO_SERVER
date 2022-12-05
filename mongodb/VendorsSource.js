import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";
import sanitize from 'mongo-sanitize';

//This Class contains all the methods to interact with the database for the Vendors collection
export default class VendorsSource extends MongoDataSource {
    async findOneById(id) {
        id=sanitize(id);
        return await this.collection.findOne({_id: new ObjectId(id)})
    }

    async loginByEmail(vendorEmail, vendorPassword) {
        vendorPassword=sanitize(vendorPassword);
        return await this.findByFields({
            email: vendorEmail,
            password: vendorPassword
        })
    }

    async loginByUsername(vendorUsername, vendorPassword) {
        vendorPassword=sanitize(vendorPassword);
        return await this.findByFields({
            username: vendorUsername,
            password: vendorPassword
        })
    }
    async findByFields(fields) {
        return await this.collection.findOne(fields)
    }

    async signUp(accountInput) {
        const {shopName, adress, ...accountInputWithoutShopNameAndAdress} = accountInput;
        let newVendorId = (await this.collection.insertOne({
            ...accountInputWithoutShopNameAndAdress,
            verified: false,
            email: accountInput.email.toLowerCase(),

        })).insertedId
        return await this.findOneById(newVendorId)
    }

    async findVendorByEmail(email) {
        return await this.findByFields({email: email})
    }

    async findVendorByUsername(username) {
        return await this.findByFields({username: username})
    }

    async updateVendorById(vendorId, fieldsToUpdate) {
        vendorId=sanitize(vendorId);
        const query = {_id: new ObjectId(vendorId)};
        const updateValues = {$set: fieldsToUpdate};
        return await this.collection.updateOne(query, updateValues);
    }

    async getVendorsByIds(vendorsIds) {
        vendorsIds=sanitize(vendorsIds);
        if (!vendorsIds || vendorsIds.length === 0) return []
        return await this.collection.find({
            _id: {"$in": vendorsIds}
        }).toArray();
    }
}
