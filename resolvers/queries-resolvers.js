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
    searchStores: async (_, {search}, {dataSources: {stores}}) => {
      const result = await stores.searchStores(search);
      if (result) {
        return result
      }
      return []
    }
  },
};
export {queriesResolvers}
