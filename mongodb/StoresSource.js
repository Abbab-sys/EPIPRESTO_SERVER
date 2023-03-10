import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";
import sanitize from "mongo-sanitize";
import {getCoordinates} from "../geolocalisation/Geolocalisation.js";

//This Class contains all the methods to interact with the database for the Stores collection
export default class StoresSource extends MongoDataSource {
  async updateOne(storeId, updateValues) {
    storeId = sanitize(storeId);
    const query = {_id: new ObjectId(storeId)};
    return await this.collection.updateOne(query, updateValues);
  }


  async findOneById(id) {
    id = sanitize(id);
    return await this.collection.findOne({_id: new ObjectId(id)});
  }

  async createNewStore(shopName, shopAddress, shopCategory) {

    //get coordinates from address on store creation
    let coordinates = await getCoordinates(shopAddress)

    //GeoJSON , lng first, lat second ==> check MongoDB documentation for more info
    const locationObject = {
      type: "Point",
      coordinates: [parseFloat(coordinates.lng), parseFloat(coordinates.lat)]
    }

    const defaultDisponibilities = [
      {
        day: "MONDAY",
        activesHours: [
          {
            openingHour: "09:00",
            endingHour: "21:00",
          }
        ]
      },
      {
        day: "TUESDAY",
        activesHours: [
          {
            openingHour: "09:00",
            endingHour: "21:00",
          }
        ]
      },
      {
        day: "WEDNESDAY",
        activesHours: [
          {
            openingHour: "09:00",
            endingHour: "21:00",
          }
        ]
      },
      {
        day: "THURSDAY",
        activesHours: [
          {
            openingHour: "09:00",
            endingHour: "21:00",
          }
        ]
      },

      {
        day: "FRIDAY",
        activesHours: [
          {
            openingHour: "09:00",
            endingHour: "21:00",
          }
        ]
      },
      {
        day: "SATURDAY",
        activesHours: [
          {
            openingHour: "09:00",
            endingHour: "21:00",
          }
        ]
      },
      {
        day: "SUNDAY",
        activesHours: [
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
          shopCategory: shopCategory,
          isPaused: false,
          productsIds: [],
          ADMIN: false,
          orders: [],
          chats: [],
        })
    ).insertedId;
  }

  async addShopifySyncToStore(storeId, apiToken, shopDomain) {
    storeId = sanitize(storeId);
    const query = {_id: new ObjectId(storeId)};
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
      return {code: 200, message: "Synchronization parametrized"};
    return {code: 406, message: "MongoDB update failed"};
  }

  async addWoocommerceSyncToStore(
      storeId,
      consumerKey,
      consumerSecretKey,
      shopDomain
  ) {
    const query = {_id: new ObjectId(storeId)};
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
      return {code: 200, message: "Synchronization parametrized"};
    return {code: 406, message: "MongoDB update failed"};
  }

  async findStoresToSynchronize() {
    return await this.collection
        .find({
          apiType: {$in: ["SHOPIFY", "WOOCOMMERCE"]},
        })
        .toArray();
  }

  async updateStoreById(storeId, fieldsToUpdate) {
    const query = {_id: new ObjectId(storeId)};
    const updateValues = {$set: fieldsToUpdate};
    return await this.collection.updateOne(query, updateValues);
  }

  async addNewProductToStore(storeId, newProductId) {
    const query = {_id: new ObjectId(storeId)};
    const updateProducts = {$push: {productsIds: newProductId}};
    return await this.collection.updateOne(query, updateProducts);
  }

  async removeProductFromStore(storeId, productId) {
    const query = {_id: new ObjectId(storeId)};
    const updateProducts = {$pull: {productsIds: productId}};
    return await this.collection.updateOne(query, updateProducts);
  }

  async getStoresByIds(storesIds) {
    if (!storesIds || storesIds.length === 0) return [];
    return await this.collection
        .find({
          _id: {$in: storesIds},
        })
        .toArray();
  }

  async getStoreById(storeId) {
    return await this.collection.findOne({_id: new ObjectId(storeId)});
  }

  async submitOrderToStore(storeId, orderId) {
    const query = {_id: new ObjectId(storeId)};
    const updateOrders = {$push: {orders: orderId}};
    return await this.collection.updateOne(query, updateOrders);
  }

  async getStoresByDistance(coordinates, distance) {
    await this.collection.createIndex({location: "2dsphere"});
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
          ADMIN: false
        })
        .toArray();
  }

  async getStoresByCategory(category, clientCoordinates) {
    await this.collection.createIndex({location: "2dsphere"});
    return await this.collection
        .find({
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: clientCoordinates,
              },
              $maxDistance: 15000,
            },
          },
          shopCategory: category,
          ADMIN: false
        })
        .toArray();
  }

  async searchStores(searchString,clientCoordinates) {
    await this.collection.createIndex({location: "2dsphere"});
    return await this.collection
        .find({
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: clientCoordinates,
              },
              $maxDistance: 15000,
            },
          },
          name: {$regex: searchString},
          ADMIN: false

        })
        .toArray();
  }
}
