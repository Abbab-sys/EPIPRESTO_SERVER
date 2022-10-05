import {resolvers} from "./resolvers/resolvers.js";
import {ApolloServer} from 'apollo-server';
import {MongoClient} from "mongodb";
import VendorsSource from "./mongodb/vendors/VendorsSource.js";
import StoresSource from "./mongodb/stores/StoresSource.js";
import VerificationTokensSource from "./mongodb/VerificationTokens/VerificationTokensSource.js";
import {ApolloServerPluginLandingPageLocalDefault} from "apollo-server-core";
import {syncProducts} from "./sync/SyncInventory.js";
import ProductsSource from "./mongodb/products/ProductsSource.js";
import ProductsVariantsSource from "./mongodb/products-variants/ProductsVariantsSource.js";
import nodeCron from 'node-cron';
import {loadSchema} from "@graphql-tools/load";
import {GraphQLFileLoader} from "@graphql-tools/graphql-file-loader";
import {printSchema} from 'graphql';
import * as dotenv from "dotenv";

dotenv.config()
const graphQLSchema = await loadSchema('./graphql/**/*.graphql', {
    loaders: [new GraphQLFileLoader()]
})
const typeDefs = printSchema(graphQLSchema);
const username = encodeURIComponent(process.env.DATABASE_USERNAME);
const password = encodeURIComponent(process.env.DATABASE_PASSWORD);
const clusterUrl = process.env.DATABASE_CLUSTER_URL;
const authMechanism = process.env.DATABASE_AUTH_MECHANISM;

const uri =
    `mongodb+srv://${username}:${password}@${clusterUrl}/?authMechanism=${authMechanism}`;
const client = new MongoClient(uri, {useUnifiedTopology: true});
await client.connect();
const db = client.db("Epipresto-dev");
const vendorsSource = new VendorsSource(db.collection(process.env.DATABASE_VENDORS_COLLECTION))
const storesSource = new StoresSource(db.collection(process.env.DATABASE_STORES_COLLECTION))
const productsSource = new ProductsSource(db.collection(process.env.DATABASE_PRODUCTS_COLLECTION))
const productsVariantsSource = new ProductsVariantsSource(db.collection(process.env.DATABASE_PRODUCTS_VARIANTS_COLLECTION))
const verificationTokensSource = new VerificationTokensSource(db.collection(process.env.DATABASE_VERIFICATION_TOKENS_COLLECTION))
const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    cache: 'bounded',
    context: ({req}) => ({
        // get the user token from the headers
        user: req.headers.authorization || ''
    }),
    dataSources: () => ({
        vendors: vendorsSource,
        stores: storesSource,
        products: productsSource,
        productsVariants: productsVariantsSource,
        verificationTokens: verificationTokensSource

    }),
    plugins: [
        ApolloServerPluginLandingPageLocalDefault({embed: true}),
    ],
})

server.listen().then(({url}) => {
    console.log(`🚀  Server ready at ${url}`);

    // syncProducts(client).then(() => {
    //     console.log("Products synchronized for first time\nWaiting for next sync in 1 hour ...")
    // })
    // nodeCron.schedule('0 */1 * * *', () => {
    //     syncProducts(client).then(() => {
    //         console.log("Products synchronized\nWaiting for next sync in 1 hour ...")
    //     })
    // })


});
