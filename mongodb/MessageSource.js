import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";
import sanitize from 'mongo-sanitize';

export default class MessageSource extends MongoDataSource {
    async findOneById(id) {
        id=sanitize(id);
        return await this.collection.findOne({_id: new ObjectId(id)})
    }
    async getMessagesByIds(messagesIds) {
        messagesIds=sanitize(messagesIds);
        if (!messagesIds || messagesIds.length === 0) return []
        return await this.collection.find({
            _id: {"$in": messagesIds}
        }).toArray();
    }
    async createNewMessage(content, role, relatedChatId) {
        const newMessage = {
            message:content,
            role,
            relatedChatId: new ObjectId(relatedChatId),
            date: new Date(),
            status: "SENT"
        }
        const {insertedId} = await this.collection.insertOne(newMessage)
        return insertedId
    }
}
