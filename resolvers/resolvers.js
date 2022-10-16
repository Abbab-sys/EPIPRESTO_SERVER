import {mutationsResolvers} from "./mutations-resolvers.js";
import {outputsResolvers} from "./outputs-resolvers.js";
import {queriesResolvers} from "./queries-resolvers.js";
import {unionsResolvers} from "./unions-resolvers.js";
import {scalarsResolvers} from "./scalars-resolvers.js";
import {subscriptionResolvers} from "./subscriptions-resolvers.js";
const resolvers = {
    ...queriesResolvers,
    ...mutationsResolvers,
    ...outputsResolvers,
    ...unionsResolvers,
    ...scalarsResolvers,
    ...subscriptionResolvers
};
export {resolvers}
