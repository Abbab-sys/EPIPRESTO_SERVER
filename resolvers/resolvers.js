import {mutationsResolvers} from "./mutations-resolvers.js";
import {outputsResolvers} from "./outputs-resolvers.js";
import {queriesResolvers} from "./queries-resolvers.js";
import {unionsResolvers} from "./unions-resolvers.js";
const resolvers = {
    ...queriesResolvers,
    ...mutationsResolvers,
    ...outputsResolvers,
    ...unionsResolvers
};
export {resolvers}
