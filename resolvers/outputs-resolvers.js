import {getCoordinates} from "../geolocalisation/Geolocalisation.js";

const outputsResolvers = {
  AccountResponse: {
    __resolveType(obj) {
      // Only Author has a name field
      if (obj.vendorAccount) {
        return 'VendorAccountResponse';
      }
      // Only Book has a title field
      if (obj.clientAccount) {
        return 'ClientAccountResponse';
      }
      return null; // GraphQLError is thrown
    },
  },
  VendorAccount: {
    store: async (parent, _, {dataSources: {stores}}) => {
      return await stores.findOneById(parent.storeId)
    }
  },
  Store: {
    products: async (mongoStoreObject, {first, offset, searchText, filterAvailable}, {dataSources: {products}}) => {
      if (!mongoStoreObject.ADMIN) {
        const productsIds = mongoStoreObject.productsIds
        let mongoProductsObjects = await products.getProductsByIds(productsIds)
        if (filterAvailable) {
          mongoProductsObjects = mongoProductsObjects.filter(product => product.published)
        }
        if (searchText) {
          if (first === -1 || offset === -1) {
            return mongoProductsObjects.filter(product => product.title.toLowerCase().includes(searchText.toLowerCase()))
          }
          return mongoProductsObjects.filter(product => product.title.toLowerCase().includes(searchText.toLowerCase())).slice(offset, offset + first)
        }
        if (first === -1 || offset === -1) {
          return mongoProductsObjects
        }
        return mongoProductsObjects.slice(offset, offset + first)
      }
      let mongoProductsObjects = await products.getAllProducts()
      if (filterAvailable) {
        mongoProductsObjects = mongoProductsObjects.filter(product => product.published)
      }
      if (searchText) {
        if (first === -1 || offset === -1) {
          return mongoProductsObjects.filter(product => product.title.toLowerCase().includes(searchText.toLowerCase()))
        }
        return mongoProductsObjects.filter(product => product.title.toLowerCase().includes(searchText.toLowerCase())).slice(offset, offset + first)
      }
      if (first === -1 || offset === -1) {
        return mongoProductsObjects
      }
      return mongoProductsObjects.slice(offset, offset + first)

    },
    isOpen: async (mongoStoreObject, _, {dataSources: {stores}}) => {
      // set isOpen to true if the current time is between the opening and closing hours
      // create day map to get the current day
      const dayMap = new Map([
        [0, "SUNDAY"],
        [1, "MONDAY"],
        [2, "TUESDAY"],
        [3, "WEDNESDAY"],
        [4, "THURSDAY"],
        [5, "FRIDAY"],
        [6, "SATURDAY"]
      ])
      const montrealTime = new Date().toLocaleString("en-US", {timeZone: "America/Montreal"})
      const currentDay = new Date(montrealTime).getDay()
      const currentHour = new Date(montrealTime).getHours()
      const currentMinute = new Date(montrealTime).getMinutes()
      const currentDayObject = mongoStoreObject.disponibilities.find(disponibility => disponibility.day === dayMap.get(currentDay))
      if (currentDayObject) {
        const currentHourObject = currentDayObject.activesHours.find(activeHour => {
          const openingHour = activeHour.openingHour.split(":")
          const endingHour = activeHour.endingHour.split(":")
          return (currentHour > openingHour[0] && currentHour < endingHour[0]) || (currentHour == openingHour[0] && currentMinute >= openingHour[1]) || (currentHour == endingHour[0] && currentMinute <= endingHour[1])
        })
        if (currentHourObject) {
          return true
        }
      }
      return false
    },
    orders: async (mongoStoreObject, {idOrder}, {dataSources: {orders, productsVariants, products}}) => {
      const returnedOrders = []

      if (!mongoStoreObject.ADMIN) {
        const ordersIds = mongoStoreObject.orders
        const ordersObjects = await orders.getOrdersByIds(ordersIds)

        for (let i = 0; i < ordersObjects.length; i++) {
          const order = ordersObjects[i]


          if (idOrder && order._id.toString() !== idOrder) continue;


          const productsVariantsObjects = await Promise.all(order.productsVariantsOrdered.map(({relatedProductVariantId}) => {

            return productsVariants.findOneById(relatedProductVariantId)
          }))
          const productsObjects = await Promise.all(productsVariantsObjects.map(({relatedProductId}) => {
            return products.findOneById(relatedProductId)
          }))

          order.productsVariantsOrdered = order.productsVariantsOrdered.filter(({relatedProductVariantId}) => {
            const productVariant = productsVariantsObjects.find(productVariant => productVariant._id.toString() === relatedProductVariantId.toString())
            if (!productVariant || !productVariant.relatedProductId) return false
            const product = productsObjects.find(product => product._id.toString() === productVariant.relatedProductId.toString())
            return product.relatedStoreId.toString() === mongoStoreObject._id.toString()
          })

          ordersObjects[i] = order
          returnedOrders.push(order)

        }

        return returnedOrders;
      }

      const ordersObjects = await orders.getAllOrders()

      if (idOrder) {
        const order = ordersObjects.find(order => order._id.toString() === idOrder)
        if (!order) return []
        return [order]
      }

      return await orders.getAllOrders()

    },
    chats: async (mongoStoreObject, _, {dataSources: {chats}}) => {
      if (!mongoStoreObject.ADMIN) {
        const chatsIds = mongoStoreObject.chats
        return await chats.getChatsByIds(chatsIds)
      }
      return await chats.getAllChats()
    },
    relatedVendor: async (mongoStoreObject, _, {dataSources: {vendors}}) => {
      return await vendors.findOneById(mongoStoreObject.relatedVendorId)
    },
    disponibilities: async (mongoStoreObject, _) => {
      if (!mongoStoreObject.ADMIN) {
        return mongoStoreObject.disponibilities
      }
      return []
    },
    isAdmin: async (mongoStoreObject, _) => {
      return mongoStoreObject.ADMIN
    }
  },
  Product: {
    relatedStore: async (mongoProductObject, _, {dataSources: {stores}}) => {
      const relatedStoreId = mongoProductObject.relatedStoreId
      return await stores.findOneById(relatedStoreId)
    },
    variants: async (mongoProductObject, {
      first,
      offset,
      searchText,
      filterAvailable
    }, {dataSources: {productsVariants}}) => {
      const productsVariantsIds = mongoProductObject.variantsIds
      let allVariants = await productsVariants.getProductsVariantsByIds(productsVariantsIds)
      if (filterAvailable) {
        allVariants = allVariants.filter(variant => variant.availableForSale)
      }
      // for each variant create a display name
      allVariants.forEach(variant => {
        variant.displayName = `${mongoProductObject.title} - ${variant.variantTitle}`
      })
      if (searchText) {
        const filteredVariants = allVariants.filter(variant => variant.displayName.toLowerCase().includes(searchText.toLowerCase()))
        if (offset === -1 || first === -1) {
          return filteredVariants
        }
        return filteredVariants.slice(offset, offset + first)
      }
      if (offset === -1 || first === -1) {
        return allVariants
      }
      return allVariants.slice(offset, offset + first)
    },
  },
  ProductVariant: {
    relatedProduct: async (mongoProductVariantObject, _, {dataSources: {products}}) => {
      const relatedProductId = mongoProductVariantObject.relatedProductId
      return await products.findOneById(relatedProductId)
    },
    relatedStore: async (mongoProductVariantObject, _, {dataSources: {products, stores}}) => {
      const relatedProductId = mongoProductVariantObject.relatedProductId
      const product = await products.findOneById(relatedProductId)
      const relatedStoreId = product.relatedStoreId
      return await stores.findOneById(relatedStoreId)
    },
    displayName: async (mongoProductVariantObject, _, {dataSources: {products}}) => {
      const relatedProductId = mongoProductVariantObject.relatedProductId
      const relatedProduct = await products.findOneById(relatedProductId)
      return relatedProduct.title + " - " + mongoProductVariantObject.variantTitle
    }
  },
  Order: {
    relatedVendors: async ({relatedVendorsIds}, _, {dataSources: {stores}}) => {
      return await stores.getStoresByIds(relatedVendorsIds)
    },
    relatedClient: async ({relatedClientId}, _, {dataSources: {clients}}) => {
      return await clients.findOneById(relatedClientId)
    },
    relatedChats: async ({chatsIds}, _, {dataSources: {chats}}) => {
      return await chats.getChatsByIds(chatsIds)
    },
    subTotal: async ({productsVariantsOrdered}, _, {dataSources: {productsVariants}}) => {
      let subTotal = 0
      for (const productVariantOrdered of productsVariantsOrdered) {
        const productVariant = await productsVariants.findOneById(productVariantOrdered.relatedProductVariantId)
        subTotal += productVariant.price * productVariantOrdered.quantity - productVariantOrdered.discount
      }
      return subTotal
    },
    deliveryFee: async ({productsVariantsOrdered}, _, {dataSources: {productsVariants}}) => {
      return 9.99
    },
    taxs: async ({productsVariantsOrdered}, _, {dataSources: {productsVariants}}) => {
      const taxRate = 0.14975
      let taxs = 9.99 * taxRate

      for (const productVariantOrdered of productsVariantsOrdered) {
        const productVariant = await productsVariants.findOneById(productVariantOrdered.relatedProductVariantId)
        if (productVariant.taxable) {
          taxs += productVariant.price * productVariantOrdered.quantity * taxRate
        }
      }
      return taxs
    },
    subOrdersStatus: async ({subOrdersStatus}, _, {dataSources: {stores}}) => {

      // for each subOrderStatus, get the store and return the store Id with the name and the status and time
      const subOrdersStatusOfStore = []
      for (const subOrderStatus of subOrdersStatus) {
        const store = await stores.findOneById(subOrderStatus.idStore)
        subOrdersStatusOfStore.push({
          relatedStore: store,
          status: subOrderStatus.status,
          time: subOrderStatus.time
        })
      }
      return subOrdersStatusOfStore
    }
  },
  ProductVariantOrdered: {
    relatedProductVariant: async ({relatedProductVariantId}, _, {dataSources: {productsVariants}}) => {
      return await productsVariants.findOneById(relatedProductVariantId)
    }
  },
  ClientAccount: {
    orders: async (mongoClientObject, _, {dataSources: {orders}}) => {
      const ordersIds = mongoClientObject.orders
      return await orders.getOrdersByIds(ordersIds)
    },
    chats: async (mongoClientObject, _, {dataSources: {chats}}) => {
      const chatsIds = mongoClientObject.chats
      return await chats.getChatsByIds(chatsIds)
    },
    nearbyShops: async (mongoClientObject, {distance}, {dataSources: {stores}}) => {
      const clientAddress = mongoClientObject.address
      const clientCoordinates = await getCoordinates(clientAddress);

      const coordinatesArray = [clientCoordinates.lng, clientCoordinates.lat]
      const distanceInMeters = distance * 1000

      return await stores.getStoresByDistance(coordinatesArray, distanceInMeters);
    }
  },
  Chat: {
    relatedOrder: async ({relatedOrderId}, _, {dataSources: {orders}}) => {
      return await orders.findOneById(relatedOrderId)
    },
    relatedVendor: async ({relatedVendorId}, _, {dataSources: {stores}}) => {
      return await stores.findOneById(relatedVendorId)
    },
    relatedClient: async ({relatedClientId}, _, {dataSources: {clients}}) => {
      return await clients.findOneById(relatedClientId)
    },
    messages: async ({messagesIds}, _, {dataSources: {messages}}) => {
      return await messages.getMessagesByIds(messagesIds)
    }
  },
  Message: {
    relatedChat: async ({relatedChatId}, _, {dataSources: {chats}}) => {
      return await chats.findOneById(relatedChatId)
    }
  }


};
export {outputsResolvers}
