import {
    queriesVendorsCredentialsCheckingResolvers
} from "./queries-resolvers/queries-vendors-credentials-checking-resolvers.js";
import {queriesVendorsLoginResolvers} from "./queries-resolvers/queries-vendors-login-resolvers.js";
import {queriesGettersByIdResolvers} from "./queries-resolvers/queries-getters-by-id-resolvers.js";
import { queriesAnalyticsResolvers } from "./queries-resolvers/queries-analytics-resolvers.js";
import {queriesClientsLoginResolvers} from "./queries-resolvers/queries-clients-login-resolvers.js";
import {
    queriesClientsCredentialsCheckingResolvers
} from "./queries-resolvers/queries-clients-credentials-checking-resolvers.js";
const queriesResolvers = {
    Query: {
        ...queriesVendorsCredentialsCheckingResolvers,
        ...queriesClientsCredentialsCheckingResolvers,
        ...queriesVendorsLoginResolvers,
        ...queriesClientsLoginResolvers,
        ...queriesGettersByIdResolvers,
        ...queriesAnalyticsResolvers
    },
};
export {queriesResolvers}
