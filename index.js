import {resolvers} from "./resolvers/resolvers.js";
import {ApolloServer} from 'apollo-server';
import {importSchema} from "graphql-import";
import {MongoClient} from "mongodb";
import VendorsSource from "./mongodb/vendors/VendorsSource.js";
import StoresSource from "./mongodb/stores/StoresSource.js";
import {ApolloServerPluginLandingPageLocalDefault} from "apollo-server-core";
import {syncProducts} from "./sync/SyncInventory.js";
import ProductsSource from "./mongodb/products/ProductsSource.js";
import ProductsVariantsSource from "./mongodb/products-variants/ProductsVariantsSource.js";


const typeDefs = importSchema('./graphql/schema.graphql')
const password = "HemyQ1mDUr2xlUc7"
const uri = "mongodb+srv://Epipresto:" + password + "@epipresto.q5xhal9.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
client.connect()

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
        vendors: new VendorsSource(client.db("Epipresto-dev").collection('Vendors')),
        stores: new StoresSource(client.db("Epipresto-dev").collection('Stores')),
        products: new ProductsSource(client.db("Epipresto-dev").collection('Products')),
        productsVariants:new ProductsVariantsSource(client.db("Epipresto-dev").collection('ProductsVariants'))

    }),
    plugins: [
        ApolloServerPluginLandingPageLocalDefault({embed: true}),
    ],
})

server.listen().then(({url}) => {
    console.log(`🚀  Server ready at ${url}`);
    setInterval(syncProducts, 10000, client);

});
