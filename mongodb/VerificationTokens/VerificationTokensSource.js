import {MongoDataSource} from "apollo-datasource-mongodb";

export default class VerificationTokensSource extends MongoDataSource {
    async createVendorToken(vendorId) {
        const {insertedId} = await this.collection.insertOne({
            relatedVendorId: vendorId,
            relatedClientId: null,
        });
        return insertedId;
    }
}
