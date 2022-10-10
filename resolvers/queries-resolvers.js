import {
    queriesVendorsCredentialsCheckingResolvers
} from "./queries-resolvers/queries-vendors-credentials-checking-resolvers.js";
import {queriesVendorsLoginResolvers} from "./queries-resolvers/queries-vendors-login-resolvers.js";
import {queriesGettersByIdResolvers} from "./queries-resolvers/queries-getters-by-id-resolvers.js";

const queriesResolvers = {
    Query: {
        ...queriesVendorsCredentialsCheckingResolvers,
        ...queriesVendorsLoginResolvers,
        ...queriesGettersByIdResolvers,
    },
};
export {queriesResolvers}