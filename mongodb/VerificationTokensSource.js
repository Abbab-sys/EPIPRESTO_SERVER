import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";
import sanitize from 'mongo-sanitize';

export default class VerificationTokensSource extends MongoDataSource {
    async findOneById(id) {
        id=sanitize(id);
        return await this.collection.findOne({_id: new ObjectId(id)})
    }
    async createVendorToken(vendorId) {
        const {insertedId} = await this.collection.insertOne({
            relatedVendorId: vendorId,
            relatedClientId: null,
        });
        return insertedId;
    }
    async createClientToken(clientId) {
        const {insertedId} = await this.collection.insertOne({
            relatedVendorId: null,
            relatedClientId: clientId,
        });
        return insertedId;
    }
}
