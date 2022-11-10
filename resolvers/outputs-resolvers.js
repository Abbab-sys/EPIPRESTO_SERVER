import { getCoordinates } from "../geolocalisation/Geolocalisation.js";

const outputsResolvers = {
    VendorAccount: {
        store: async (parent, _, {dataSources: {stores}}) => {
            return await stores.findOneById(parent.storeId)
        }
    },
    Store: {
        products: async (mongoStoreObject, {first, offset, searchText}, {dataSources: {products}}) => {
            if (!mongoStoreObject.ADMIN) {
                const productsIds = mongoStoreObject.productsIds
                const mongoProductsObjects = await products.getProductsByIds(productsIds)
                if (searchText) {
                    return mongoProductsObjects.filter(product => product.title.toLowerCase().includes(searchText.toLowerCase())).slice(offset, offset + first)
                }
                return mongoProductsObjects.slice(offset, offset + first)
            }
            const mongoProductsObjects = await products.getAllProducts()
            if (searchText) {
                return mongoProductsObjects.filter(product => product.title.toLowerCase().includes(searchText.toLowerCase())).slice(offset, offset + first)
            }
            return mongoProductsObjects.slice(offset, offset + first)

        },
        orders: async (mongoStoreObject, _, {dataSources: {orders, productsVariants, products}}) => {
            if (!mongoStoreObject.ADMIN) {
                const ordersIds = mongoStoreObject.orders
                const ordersObjects = await orders.getOrdersByIds(ordersIds)
                for (const order of ordersObjects) {
                    order.productsVariantsOrdered.filter(async ({relatedProductVariantId}) => {
                        const productVariant = await productsVariants.findOneById(relatedProductVariantId)
                        if (!productVariant || !productVariant.relatedProductId) return false
                        const product = await products.findOneById(productVariant.relatedProductId)
                        return product.relatedStoreId === mongoStoreObject._id
                    })
                }
                return ordersObjects
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
        }
    },
    Product: {
        relatedStore: async (mongoProductObject, _, {dataSources: {stores}}) => {
            const relatedStoreId = mongoProductObject.relatedStoreId
            return await stores.findOneById(relatedStoreId)
        },
        variants: async (mongoProductObject, _, {dataSources: {productsVariants}}) => {
            const productsVariantsIds = mongoProductObject.variantsIds
            return await productsVariants.getProductsVariantsByIds(productsVariantsIds)
        },
    },
    ProductVariant: {
        relatedProduct: async (mongoProductVariantObject, _, {dataSources: {products}}) => {
            const relatedProductId = mongoProductVariantObject.relatedProductId
            return await products.findOneById(relatedProductId)
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
            return 10
        },
        taxs: async ({productsVariantsOrdered}, _, {dataSources: {productsVariants}}) => {
            let taxs = 0
            for (const productVariantOrdered of productsVariantsOrdered) {
                const productVariant = await productsVariants.findOneById(productVariantOrdered.relatedProductVariantId)
                if (productVariant.taxable) {
                    taxs += productVariant.price * productVariantOrdered.quantity * 0.15
                }
            }
            return taxs
        },
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
            
            const coordinatesArray= [clientCoordinates.lng, clientCoordinates.lat]
            const distanceInMeters = distance * 1000

            return await stores.getStoresByDistance(coordinatesArray,distanceInMeters);
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
