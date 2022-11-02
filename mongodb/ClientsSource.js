import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";
import sanitize from 'mongo-sanitize';

export default class ClientsSource extends MongoDataSource {
    async findOneById(id) {
        id=sanitize(id);
        return await this.collection.findOne({_id: new ObjectId(id)})
    }
    async findByFields(fields) {
        return await this.collection.findOne(fields)
    }
    async updateClientById(clientId, fieldsToUpdate) {
        clientId=sanitize(clientId);
        fieldsToUpdate=sanitize(fieldsToUpdate);
        const query = {_id: new ObjectId(clientId)};
        const updateValues = {$set: fieldsToUpdate};
        return await this.collection.updateOne(query, updateValues);
    }
    async loginByUsername(username, password) {
        password=sanitize(password);
        return await this.findByFields({
            username: username,
            password: password
        })
    }
    async signUp(accountInput) {
        let newClientId = (await this.collection.insertOne({
            ...accountInput,
            chats: [],
            orders: [],
            verified: false,

        })).insertedId
        return await this.findOneById(newClientId)
    }
    async loginByEmail(email, password) {
        password=sanitize(password);
        return await this.findByFields({
            email: email,
            password: password
        })
    }
    async findClientByUsername(username) {
        return await this.findByFields({username: username})
    }
    async findClientByEmail(email) {
        return await this.findByFields({email: email})
    }
}
