import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";

export default class VendorsSource extends MongoDataSource {
    async loginByEmail(vendorEmail, vendorPassword) {
        return await this.findByFields({
            email: vendorEmail,
            password: vendorPassword
        })
    }
    async loginByUsername(vendorUsername, vendorPassword) {
        return await this.findByFields({
            username: vendorUsername,
            password: vendorPassword
        })
    }

    async signUp(accountInput) {
        const {shopName,adress,...accountInputWithoutShopNameAndAdress} = accountInput;
        let newVendorId = (await this.collection.insertOne({
            ...accountInputWithoutShopNameAndAdress,
        })).insertedId
        return await this.findOneById(newVendorId)
    }
    async findVendorByEmail(email){
        return await this.findByFields({email:email})
    }
    async findVendorByUsername(username){
        return await this.findByFields({username:username})
    }
    async updateVendorById(vendorId, fieldsToUpdate) {
        const query = {_id: new ObjectId(vendorId)};
        const updateValues = {$set: fieldsToUpdate};
        return await this.collection.updateOne(query, updateValues);
    }
}
