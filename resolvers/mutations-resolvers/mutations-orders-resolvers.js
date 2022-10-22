import {ObjectId} from "mongodb";

const mutationsOrdersResolvers = {
    submitOrder: async (parent, {clientId, productsVariantsToOrder,paymentMethod}, {
        dataSources: {
            stores,
            productsVariants,
            products,
            orders,
            chats,
            clients
        }
    }) => {
        const originalProductsQuantity = []
        for (const productVariantToOrder of productsVariantsToOrder) {
            const {relatedProductVariantId, quantity} = productVariantToOrder;
            const productVariant = await productsVariants.findOneById(relatedProductVariantId);
            originalProductsQuantity.push({
                relatedProductVariantId,
                stock: productVariant.stock
            })
            if (productVariant.quantity < quantity) {
                return {code: 406, message: "Product quantity not enough"};
            }
        }
        const vendorsIdsString = new Set()
        const vendorsIds = new Set()
        try {
            for (const productVariantToOrder of productsVariantsToOrder) {
                const {relatedProductVariantId, quantity} = productVariantToOrder;
                const productVariant = await productsVariants.findOneById(relatedProductVariantId);
                const product = await products.findOneById(productVariant.relatedProductId);
                const store = await stores.findOneById(product.relatedStoreId);
                vendorsIdsString.add(store._id.toString())
                const updateResult = await productsVariants.updateProductVariantById(relatedProductVariantId, {stock: productVariant.stock - quantity});
                if (!updateResult.matchedCount) {
                    throw new Error("Product quantity not enough");
                }
            }
            vendorsIdsString.forEach(id => vendorsIds.add(new ObjectId(id)))
        }
         catch (e) {
            for (const originalProductQuantity of originalProductsQuantity) {
                const {relatedProductId, stock} = originalProductQuantity;
                await productsVariants.updateProductVariantById(relatedProductId, {stock});
            }
            return {code: 406, message: "Order failed"};
        }

        const newOrder = {
            productsVariantsOrdered: productsVariantsToOrder.map(({relatedProductVariantId, quantity, discount}) => {
                return {
                    relatedProductVariantId,
                    quantity,
                    discount
                }
            }),
            relatedVendorsIds: Array.from(vendorsIds),
            relatedClientId: new ObjectId(clientId),
            logs: [{status: "WAITING_CONFIRMATION", time: new Date().toUTCString()}],
            chatsIds:[]
        }

        const {insertedId} = await orders.collection.insertOne(newOrder);
        const order = await orders.findOneById(insertedId);
        const ORDERS_COUNT=await orders.getOrdersCount() + 1
        orders.collection.updateOne({_id: new ObjectId(order._id)}, {$set: {paymentMethod,orderNumber: "EP" + ORDERS_COUNT.toString()}})
        await orders.incrementOrdersCount();
        const vendorsIdsArray = Array.from(vendorsIds)
        const queryClient = {_id: new ObjectId(clientId)};
        for (const vendorId of vendorsIdsArray) {
            const queryVendor = {_id: new ObjectId(vendorId)};
            await stores.collection.updateOne(queryVendor, {$push: {orders: order._id}})
            await clients.collection.updateOne(queryClient, {$push: {orders: order._id}})
            const {insertedId: chatId} = await chats.collection.insertOne({
                relatedOrderId: order._id,
                relatedVendorId: new ObjectId(vendorId),
                relatedClientId: new ObjectId(clientId),
                messages: []
            })
            await orders.collection.updateOne({_id: order._id}, {$push: {chatsIds: chatId}})
            await stores.collection.updateOne(queryVendor, {$push: {chats: chatId}})
            await clients.collection.updateOne(queryClient, {$push: {chats: chatId}})
        }
        return {code: 200, message: "Order submitted"};
    },
    updateOrderStatus: async (parent, {orderId, newStatus}, {dataSources: {orders}}) => {
        const orderQuery = {_id: new ObjectId(orderId)};
        const newLog = {status: newStatus, time: new Date().toUTCString()};
        const {matchedCount} = await orders.collection.updateOne(orderQuery, {$push: {logs: newLog}})
        if (!matchedCount) {
            return {code: 406, message: "Order not found"};
        }
        return {code: 200, message: "Order status updated"};
    }
};
export {mutationsOrdersResolvers}
