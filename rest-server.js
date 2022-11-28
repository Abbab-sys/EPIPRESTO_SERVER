import express from "express";
import { getAllProducts } from "./sync/shopify/SyncAllProducts.js";
import StoresSource from "./mongodb/StoresSource.js";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import { updateProduct } from "./sync/shopify/updateProduct.js";
import {createProduct} from "./sync/shopify/createProduct.js";
dotenv.config();

const app = express();
const port = 3001;
const username = encodeURIComponent(process.env.DATABASE_USERNAME);
const password = encodeURIComponent(process.env.DATABASE_PASSWORD);
const clusterUrl = process.env.DATABASE_CLUSTER_URL;
const authMechanism = process.env.DATABASE_AUTH_MECHANISM;

const uri = `mongodb+srv://${username}:${password}@${clusterUrl}/?authMechanism=${authMechanism}`;
const client = new MongoClient(uri, { useUnifiedTopology: true });
await client.connect();
const db = client.db("Epipresto-dev");

app.use(express.json());

/**
 *
 *  Endpoint to sync all products from shopify (Only called by Shopify webhook) when the products are ready to be synced
 *  @param {any} req: the request
  * @param {any} res: the response
    @return 200 HTTP code
 */
app.post("/webhooks/shopify/get-all-products/:id", async (req, res) => {
  const store_id = req.params.id;

  console.log("First time sync webhook received from store : ", store_id);

  const { admin_graphql_api_id, status } = req.body;

  const storesSource = new StoresSource(
    client.db("Epipresto-dev").collection("Stores")
  );
  const store = await storesSource.getStoreById(store_id);

  if (admin_graphql_api_id && status === "completed" && store) {
    const result = await getAllProducts(
      store.shopifyShopDomain,
      store.shopifyApiToken,
      admin_graphql_api_id,
      client,
      store
    );
  }

  res.status(200).send("OK");
});

/**
 *
 *  Endpoint to update a product from shopify (Only called by Shopify webhook) when the product is ready to be updated
 *  @param {any} req: the request
  * @param {any} res: the response
    @return 200 HTTP code
 */
app.post("/webhooks/shopify/update-product/:id", async (req, res) => {
  console.log("webhook update product");
  const store_id = req.params.id;
  const storesSource = new StoresSource(
    client.db("Epipresto-dev").collection("Stores")
  );

  const store = await storesSource.getStoreById(store_id);

  if (store) {
    const result = updateProduct(
      client,
      store.shopifyShopDomain,
      store.shopifyApiToken,
      store,
      req.body
    );
  }
  res.status(200).send("OK");
});

//TODO: Webhook pour delete un produit d'un store
app.post("/webhooks/shopify/delete-product/:id", async (req, res) => {
  res.status(200).send("OK");
});

/**
 *
 *  Endpoint to create a product from shopify (Only called by Shopify webhook) when a product has been created
 *  @param {any} req: the request
  * @param {any} res: the response
    @return 200 HTTP code
 */app.post("/webhooks/shopify/create-product/:id", async (req, res) => {

  console.log("webhook create product");
  const store_id = req.params.id;
  const storesSource = new StoresSource(
    client.db("Epipresto-dev").collection("Stores")
  );

  const store = await storesSource.getStoreById(store_id);

  if (store) {
    const result = createProduct(
      client,
      store.shopifyShopDomain,
      store.shopifyApiToken,
      store,
      req.body
    );
  }
  res.status(200).send("OK");
});

app.listen(port, () => {
  console.log(`REST server listening at http://localhost:${port}`);
});
