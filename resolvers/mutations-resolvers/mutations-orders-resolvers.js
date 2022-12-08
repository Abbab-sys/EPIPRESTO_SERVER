import {ObjectId} from "mongodb";
import {sendUpdateStatusEmail} from "../../email/SendConfirmationEmail.js";

const mutationsOrdersResolvers = {
  submitOrder: async (parent, {clientId, productsVariantsToOrder, paymentMethod}, {
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
    } catch (e) {
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
      chatsIds: [],
      subOrdersStatus: [],
    }


    //for each store in the order, add to newOrder.subOrdersLogs a new subOrderLog with the idStore and the status WAITING_CONFIRMATION
    for (const vendorId of newOrder.relatedVendorsIds) {
      newOrder.subOrdersStatus.push({
        idStore: vendorId,
        status: "WAITING_CONFIRMATION",
        time: new Date().toUTCString()
      })
    }


    const {insertedId} = await orders.collection.insertOne(newOrder);
    let order = await orders.findOneById(insertedId);
    const ORDERS_COUNT = await orders.getOrdersCount() + 1
    orders.collection.updateOne({_id: new ObjectId(order._id)}, {
      $set: {
        paymentMethod,
        orderNumber: "EP" + ORDERS_COUNT.toString()
      }
    })
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
        messagesIds: []
      })
      await orders.collection.updateOne({_id: order._id}, {$push: {chatsIds: chatId}})
      await stores.collection.updateOne(queryVendor, {$push: {chats: chatId}})
      await clients.collection.updateOne(queryClient, {$push: {chats: chatId}})
    }
    order = await orders.findOneById(insertedId);
    return {code: 200, message: "Order submitted", order: order};
  },

  updateOrderStatus: async (parent, {storeId, orderId, newStatus}, {dataSources: {orders, stores, clients}}) => {
    const orderQuery = {_id: new ObjectId(orderId)};
    const subOrderQuery = {_id: new ObjectId(orderId), "subOrdersStatus.idStore": new ObjectId(storeId)};

    const store = await stores.collection.findOne({_id: new ObjectId(storeId)})

    let matchedCount;

    if (store.ADMIN) {

      const newLog = {status: newStatus, time: new Date().toUTCString()};
      matchedCount = await orders.collection.updateOne(orderQuery, {$push: {logs: newLog}})
    } else {
      new ObjectId(storeId);
      new Date().toUTCString();
      matchedCount = await orders.collection.updateOne(subOrderQuery, {
        $set: {
          "subOrdersStatus.$.status": newStatus,
          "subOrdersStatus.$.time": new Date().toUTCString()
        }
      })
    }

    if (!matchedCount) {
      return {code: 406, message: "Order not found"};
    }
    if (store.ADMIN) {
      //get client id
      const order = await orders.collection.findOne(orderQuery)
      const clientId = order.relatedClientId
      const client = await clients.collection.findOne({_id: new ObjectId(clientId)})
      const clientEmail = client.email
      const orderNumber = order.orderNumber
      
      switch (newStatus) {
        case "WAITING_CONFIRMATION":
          newStatus = "Waiting confirmation"
          break;
        case "WAITING_PAYMENT":
          newStatus = "Waiting payment"
          break;
        case "WAITING_DELIVERY":
          newStatus = "Waiting delivery"
          break;
        case "DELIVERED":
          newStatus = "Delivered"
          break;
        case "CANCELED":
          newStatus = "Canceled"
          break;
        case "REFUNDED":
          newStatus = "Refunded"
          break;
        case "CONFIRMED":
          newStatus = "Confirmed"
          break;
        case "IN_DELIVERY":
          newStatus = "In delivery"
          break;
        case "CLOSED":
          newStatus = "Closed"
          break;
        default:
          newStatus = "Unknown"
      }
      sendUpdateStatusEmail(clientEmail, orderNumber, newStatus)
    }
    return {code: 200, message: "Order status updated"};
  }
};
export {mutationsOrdersResolvers}
