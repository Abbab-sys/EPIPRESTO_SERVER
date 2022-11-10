import { MongoDataSource } from "apollo-datasource-mongodb";
import { ObjectId } from "mongodb";
import sanitize from "mongo-sanitize";
import { getCoordinates } from "../geolocalisation/Geolocalisation.js";

export default class StoresSource extends MongoDataSource {
  async updateOne(storeId, updateValues) {
    storeId = sanitize(storeId);
    const query = { _id: new ObjectId(storeId) };
    return await this.collection.updateOne(query, updateValues);
  }

  async findOneById(id) {
    id = sanitize(id);
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async createNewStore(shopName, shopAddress) {
    
    let coordinates = await getCoordinates(shopAddress)       

    //GeoJSON , lng first, lat second
    const locationObject={
        type: "Point",
        coordinates:[parseFloat(coordinates.lng), parseFloat(coordinates.lat)]
    }

    const defaultDisponibilities = [
      {
        day: "MONDAY",
        activesHours:[
          {
            openingHour: "09:00",
            endingHour: "21:00",
          }
        ]
      },
      {
        day: "TUESDAY",
        activesHours:[
          {
            openingHour: "09:00",
            endingHour: "21:00",
          }
        ]
        },
        {
          day: "WEDNESDAY",
          activesHours:[
            {
              openingHour: "09:00",
              endingHour: "21:00",
            }
          ]
        },
        {
          day: "THURSDAY",
          activesHours:[
            {
              openingHour: "09:00",
              endingHour: "21:00",
            }
          ]
        },
        
          {
            day: "FRIDAY",
            activesHours:[
              {
                openingHour: "09:00",
                endingHour: "21:00",
              }
            ]
          },
          {
            day: "SATURDAY",
            activesHours:[
              {
                openingHour: "09:00",
                endingHour: "21:00",
              }
            ]
            },
          {
              day: "SUNDAY",
              activesHours:[
                {
                  openingHour: "09:00",
                  endingHour: "21:00",
                }
              ]
          },

    ]

    return (
      await this.collection.insertOne({
        name: shopName,
        address: shopAddress,
        location: locationObject,
        disponibilities: defaultDisponibilities,
        isOpen: true,
        productsIds: [],
        ADMIN: false,
        orders: [],
        chats: [],
      })
    ).insertedId;
  }

  async addShopifySyncToStore(storeId, apiToken, shopDomain) {
    storeId = sanitize(storeId);
    const query = { _id: new ObjectId(storeId) };
    const synchronizationValues = {
      $set: {
        apiType: "SHOPIFY",
        shopifyShopDomain: shopDomain,
        shopifyApiToken: apiToken,
      },
    };
    const mongoResponse = await this.collection.updateOne(
      query,
      synchronizationValues
    );
    if (mongoResponse.matchedCount)
      return { code: 200, message: "Synchronization parametrized" };
    return { code: 406, message: "MongoDB update failed" };
  }

  async addWoocommerceSyncToStore(
    storeId,
    consumerKey,
    consumerSecretKey,
    shopDomain
  ) {
    const query = { _id: new ObjectId(storeId) };
    const synchronizationValues = {
      $set: {
        apiType: "WOOCOMMERCE",
        woocommerceShopDomain: shopDomain,
        woocommerceConsumerKey: consumerKey,
        woocommerceConsumerSecretKey: consumerSecretKey,
      },
    };
    const mongoResponse = await this.collection.updateOne(
      query,
      synchronizationValues
    );
    if (mongoResponse.matchedCount)
      return { code: 200, message: "Synchronization parametrized" };
    return { code: 406, message: "MongoDB update failed" };
  }

  async findStoresToSynchronize() {
    return await this.collection
      .find({
        apiType: { $in: ["SHOPIFY", "WOOCOMMERCE"] }, // TODO add this to a global const
      })
      .toArray();
  }

  async updateStoreById(storeId, fieldsToUpdate) {
    const query = { _id: new ObjectId(storeId) };
    const updateValues = { $set: fieldsToUpdate };
    return await this.collection.updateOne(query, updateValues);
  }

  async addNewProductToStore(storeId, newProductId) {
    const query = { _id: new ObjectId(storeId) };
    const updateProducts = { $push: { productsIds: newProductId } };
    return await this.collection.updateOne(query, updateProducts);
  }

  async removeProductFromStore(storeId, productId) {
    const query = { _id: new ObjectId(storeId) };
    const updateProducts = { $pull: { productsIds: productId } };
    return await this.collection.updateOne(query, updateProducts);
  }

  async getStoresByIds(storesIds) {
    if (!storesIds || storesIds.length === 0) return [];
    return await this.collection
      .find({
        _id: { $in: storesIds },
      })
      .toArray();
  }

  //get store by id
  async getStoreById(storeId) {
    return await this.collection.findOne({ _id: new ObjectId(storeId) });
  }

  async submitOrderToStore(storeId, orderId) {
    const query = { _id: new ObjectId(storeId) };
    const updateOrders = { $push: { orders: orderId } };
    return await this.collection.updateOne(query, updateOrders);
  }

  async getStoresByDistance(coordinates, distance) {
    await this.collection.createIndex({ location: "2dsphere" });
    return await this.collection
      .find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: coordinates,
            },
            $maxDistance: distance,
          },
        },
      })
      .toArray();
  }
}
