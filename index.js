import {resolvers} from "./resolvers/resolvers.js";
import {ApolloServer} from '@apollo/server';
import {MongoClient} from "mongodb";
import VendorsSource from "./mongodb/VendorsSource.js";
import StoresSource from "./mongodb/StoresSource.js";
import VerificationTokensSource from "./mongodb/VerificationTokensSource.js";
import {ApolloServerPluginLandingPageLocalDefault} from "apollo-server-core";
import {syncProducts} from "./sync/SyncInventory.js";
import ProductsSource from "./mongodb/ProductsSource.js";
import ProductsVariantsSource from "./mongodb/ProductsVariantsSource.js";
import nodeCron from 'node-cron';
import {loadSchema} from "@graphql-tools/load";
import {GraphQLFileLoader} from "@graphql-tools/graphql-file-loader";
import {printSchema} from 'graphql';
import * as dotenv from "dotenv";
import OrdersSource from "./mongodb/OrdersSource.js";
import ClientsSource from "./mongodb/ClientsSource.js";
import ChatsSource from "./mongodb/ChatsSource.js";
import MessageSource from "./mongodb/MessageSource.js";
import cors from 'cors';
import json from 'body-parser';
import express from 'express';
import {expressMiddleware} from '@apollo/server/express4';
import {ApolloServerPluginDrainHttpServer} from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import bodyParser from 'body-parser';
import {createServer} from 'http';
import {makeExecutableSchema} from '@graphql-tools/schema';
import {WebSocketServer} from 'ws';
import {useServer} from 'graphql-ws/lib/use/ws';


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
const ordersSource = new OrdersSource(db.collection(process.env.DATABASE_ORDERS_COLLECTION))
const clientsSource = new ClientsSource(db.collection(process.env.DATABASE_CLIENTS_COLLECTION))
const chatsSource = new ChatsSource(db.collection(process.env.DATABASE_CHATS_COLLECTION))
const messagesSource = new MessageSource(db.collection(process.env.DATABASE_MESSAGES_COLLECTION))

const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);
const schema = makeExecutableSchema({typeDefs, resolvers});
const server = new ApolloServer({
    schema,
    csrfPrevention: true,
    cache: 'bounded',
    introspection: true,
    plugins: [
        ApolloServerPluginLandingPageLocalDefault({embed: true}),
        ApolloServerPluginDrainHttpServer({httpServer}),
        // Proper shutdown for the WebSocket server.
        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        await serverCleanup.dispose();
                    },
                };
            },
        },
    ],
})
// Creating the WebSocket server
const wsServer = new WebSocketServer({
    // This is the `httpServer` we created in a previous step.
    server: httpServer,
    // Pass a different path here if app.use
    // serves expressMiddleware at a different path
    path: '/graphql',
});
// Hand in the schema we just created and have the
// WebSocketServer start listening.
const serverCleanup = useServer({
    schema,
    context: async (ctx, msg, args) => {
        // Returning an object will add that information to our
        // GraphQL context, which all of our resolvers have access to.
        return {
            client,
            dataSources: {
                vendors: vendorsSource,
                stores: storesSource,
                products: productsSource,
                productsVariants: productsVariantsSource,
                verificationTokens: verificationTokensSource,
                orders: ordersSource,
                clients: clientsSource,
                chats: chatsSource,
                messages: messagesSource

            },
        }
    },
}, wsServer);

await server.start()

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
    '/',
    cors(),
    bodyParser.json(),
    // expressMiddleware accepts the same arguments:
    // an Apollo Server instance and optional configuration options
    expressMiddleware(server, {
        context: async ({req}) => {
            return {
                user: req.headers.authorization || '',
                client,
                dataSources: {
                    vendors: vendorsSource,
                    stores: storesSource,
                    products: productsSource,
                    productsVariants: productsVariantsSource,
                    verificationTokens: verificationTokensSource,
                    orders: ordersSource,
                    clients: clientsSource,
                    chats: chatsSource,
                    messages: messagesSource

                },
            }
        },
    }),
);
const PORT = 4000;
// Now that our HTTP server is fully set up, we can listen to it.
httpServer.listen(PORT, () => {
    console.log(`Server is now running on http://localhost:${PORT}/graphql`);
});


// server.start().then(({url}) => {
//     console.log(`🚀  Server ready at ${url}`);
//
//     // syncProducts(client).then(() => {
//     //     console.log("Products synchronized for first time\nWaiting for next sync in 1 hour ...")
//     // })
//     // nodeCron.schedule('0 */1 * * *', () => {
//     //     syncProducts(client).then(() => {
//     //         console.log("Products synchronized\nWaiting for next sync in 1 hour ...")
//     //     })
//     // })
//
//
// });
