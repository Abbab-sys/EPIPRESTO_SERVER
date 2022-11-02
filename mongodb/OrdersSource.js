import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";
import sanitize from 'mongo-sanitize';

export default class OrdersSource extends MongoDataSource {
    async findOneById(id) {
        id = sanitize(id);
        return await this.collection.findOne({_id: new ObjectId(id)})
    }

    async getOrdersCount() {
        const {ORDERS_COUNT} = await this.collection.findOne({ORDERS_COUNT: {$ne: null}});
        return ORDERS_COUNT;
    }

    async incrementOrdersCount() {
        return await this.collection.updateOne({ORDERS_COUNT: {$ne: null}}, {$inc: {ORDERS_COUNT: 1}});
    }

    async getAllOrders() {
        return await this.collection.find({ORDERS_COUNT: {$eq: null}}).toArray();
    }

    async getOrdersByIds(ordersIds) {
        ordersIds = sanitize(ordersIds);
        if (!ordersIds || ordersIds.length === 0) return []
        return await this.collection.find({
            _id: {"$in": ordersIds}
        }).toArray();
    }
}
