import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";
import sanitize from 'mongo-sanitize';

export default class ChatsSource extends MongoDataSource {
    async findOneById(id,options) {
        id=sanitize(id);
        return await this.collection.findOne({_id: new ObjectId(id)})
    }
    async getChatsByIds(chatsIds) {
        chatsIds=sanitize(chatsIds);
        if (!chatsIds || chatsIds.length === 0) return []
        return await this.collection.find({
            _id: {"$in": chatsIds}
        }).toArray();
    }
    async addMessageToChat(chatId, newMessageId) {
        chatId=sanitize(chatId);
        newMessageId=sanitize(newMessageId);
        const query = {_id: new ObjectId(chatId)};
        const {_id:chatID,relatedVendorId,relatedClientId} = await this.collection.findOne(query);

        const updateMessages = {$push: {messagesIds: newMessageId}};
        await this.collection.updateOne(query, updateMessages);
        return {chatId:chatID, relatedVendorId, relatedClientId}
    }
}
