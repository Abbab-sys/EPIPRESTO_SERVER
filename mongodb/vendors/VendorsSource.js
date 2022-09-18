import {MongoDataSource} from "apollo-datasource-mongodb";

export default class VendorsSource extends MongoDataSource {
    async loginByEmail(vendorEmail, vendorPassword) {
        return await this.findByFields({
            email: vendorEmail,
            password: vendorPassword
        })
    }

    async signUp(accountInput) {
        let newVendorId = (await this.collection.insertOne({
            ...accountInput,
        })).insertedId
        return await this.findOneById(newVendorId)
    }
}
