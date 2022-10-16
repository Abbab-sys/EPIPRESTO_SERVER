import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";
import sanitize from 'mongo-sanitize';

export default class ClientsSource extends MongoDataSource {
    async findOneById(id) {
        id=sanitize(id);
        return await this.collection.findOne({_id: new ObjectId(id)})
    }
    async updateClientById(clientId, fieldsToUpdate) {
        clientId=sanitize(clientId);
        fieldsToUpdate=sanitize(fieldsToUpdate);
        const query = {_id: new ObjectId(clientId)};
        const updateValues = {$set: fieldsToUpdate};
        return await this.collection.updateOne(query, updateValues);
    }
}
