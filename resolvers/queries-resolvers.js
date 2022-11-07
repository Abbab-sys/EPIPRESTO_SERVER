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

        getStripe: async(_, {variantsToOrder}, {dataSources: {productsVariants}}) => {

            const stripe = stripePackage.Stripe('sk_live_bA0XUdrZQUUlbt0CuN4Y7kQp000wUU5OiN');
            // Use an existing Customer ID if this is a returning customer.
            const subTotal = await productsVariants.getTotalPriceOfProductVariants(variantsToOrder);
            const customer = await stripe.customers.create();
            const ephemeralKey = await stripe.ephemeralKeys.create(
                {customer: customer.id},
                {apiVersion: '2022-08-01'}
            );
            const paymentIntent = await stripe.paymentIntents.create({
                amount: subTotal,
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
                    publishableKey: "pk_live_wKUFHBGUKYlaCqEAEaJtuHP000dvnnJ0p6"
                }
            }
        }
    },
};
export {queriesResolvers}
