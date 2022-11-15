import {
  queriesVendorsCredentialsCheckingResolvers
} from "./queries-resolvers/queries-vendors-credentials-checking-resolvers.js";
import {queriesVendorsLoginResolvers} from "./queries-resolvers/queries-vendors-login-resolvers.js";
import {queriesGettersByIdResolvers} from "./queries-resolvers/queries-getters-by-id-resolvers.js";
import {queriesAnalyticsResolvers} from "./queries-resolvers/queries-analytics-resolvers.js";
import {queriesClientsLoginResolvers} from "./queries-resolvers/queries-clients-login-resolvers.js";
import {
  queriesClientsCredentialsCheckingResolvers
} from "./queries-resolvers/queries-clients-credentials-checking-resolvers.js";

import * as stripePackage from "stripe";
import {getCoordinates} from "../geolocalisation/Geolocalisation.js";

const queriesResolvers = {
  Query: {
    ...queriesVendorsCredentialsCheckingResolvers,
    ...queriesClientsCredentialsCheckingResolvers,
    ...queriesVendorsLoginResolvers,
    ...queriesClientsLoginResolvers,
    ...queriesGettersByIdResolvers,
    ...queriesAnalyticsResolvers,

    getStripe: async (_, {variantsToOrder}, {dataSources: {productsVariants}}) => {

      const stripe = stripePackage.Stripe('sk_test_Cgu80eDQ7D3Km7WKNIAwfuRp0053siIUft');
      // Use an existing Customer ID if this is a returning customer.
      const subTotal = await productsVariants.getTotalPriceOfProductVariants(variantsToOrder);
      const taxs = await productsVariants.getTaxsOfProductVariants(variantsToOrder);
      const deliveryCost = await productsVariants.getDeliveryCostOfProductVariants(variantsToOrder);
      const total = subTotal + taxs + deliveryCost * 1.14975;
      const customer = await stripe.customers.create();
      const ephemeralKey = await stripe.ephemeralKeys.create(
          {customer: customer.id},
          {apiVersion: '2022-08-01'}
      );
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 10),
        currency: 'eur',
        customer: customer.id,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      return {
        code: 200,
        message: "Stripe data retrieved",
        stripe: {
          paymentIntent: paymentIntent.client_secret,
          ephemeralKey: ephemeralKey.secret,
          customer: customer.id,
          publishableKey: "pk_test_EK2EADQF4MqPyfL63ZrKGRiJ00MgduNzlC"
        }
      }
    },
    searchStores: async (_, {search,idClient}, {dataSources: {stores,clients}}) => {
      const client=await clients.findOneById(idClient);
      const clientCoordinates = await getCoordinates(client.address);
      const coordinatesArray= [clientCoordinates.lng, clientCoordinates.lat]
      const result = await stores.searchStores(search,coordinatesArray);
      if (result) {
        return result
      }
      return []
    },
    searchProducts: async (_, {search, first, offset}, {dataSources: {products}}) => {

      let allProducts = await products.collection.find({}).toArray();

      const result = allProducts.filter((product) => {
        const regex = new RegExp(search, "gi");
        //check if any words of products tags match the search
        try {
          const tagsMatch = product.tags.some((tag) => tag.match(regex));
          return product.title.match(regex) || product.brand.match(regex) || tagsMatch
        } catch (e) {
          console.log(product)
          return false
        }

      });
      if (result) {
        return result.slice(offset, offset + first)
      }
      return []
    },
    getStoresByCategory: async (_, {category,idClient}, {dataSources: {stores,clients}}) => {
      const client=await clients.findOneById(idClient);
      const clientCoordinates = await getCoordinates(client.address);
      const coordinatesArray= [clientCoordinates.lng, clientCoordinates.lat]
      const result = await stores.getStoresByCategory(category,coordinatesArray);
      if (result) {
        return {
          code: 200,
          message: "Stores retrieved",
          stores: result
        }
      }
      return {
        code: 404,
        message: "No stores found",
      }
    }
  },
};
export {queriesResolvers}
