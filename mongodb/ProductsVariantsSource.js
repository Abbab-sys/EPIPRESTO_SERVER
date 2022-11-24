import {MongoDataSource} from "apollo-datasource-mongodb";
import {ObjectId} from "mongodb";
import sanitize from 'mongo-sanitize';
import {MongoClient} from "mongodb";
import ProductsSource from "../mongodb/ProductsSource.js";

// import {PRODUCTS_SOURCE} from "../index.js";

export default class ProductsVariantsSource extends MongoDataSource {

  productsSource =null

  async initProductSource() {
      const username = encodeURIComponent(process.env.DATABASE_USERNAME);
      const password = encodeURIComponent(process.env.DATABASE_PASSWORD);
      const clusterUrl = process.env.DATABASE_CLUSTER_URL;
      const authMechanism = process.env.DATABASE_AUTH_MECHANISM;

      const uri =
          `mongodb+srv://${username}:${password}@${clusterUrl}/?authMechanism=${authMechanism}`;
      const client = new MongoClient(uri, {useUnifiedTopology: true});
      await client.connect();
      const db = client.db("Epipresto-dev");
      this.productsSource = new ProductsSource(db.collection(process.env.DATABASE_PRODUCTS_COLLECTION))
      console.log("products source initialized")
  }


  async findOneById(id) {
    id = sanitize(id);
    return await this.collection.findOne({_id: new ObjectId(id)})
  }

  async getProductsVariantsByIds(variantsIds) {
    variantsIds = sanitize(variantsIds);
    if (!variantsIds || variantsIds.length === 0) return []
    return await this.collection.find({
      _id: {"$in": variantsIds}
    }).toArray();
  }

  async findProductVariantsByProductId(productId) {
    productId = sanitize(productId);
    return await this.collection.find({
      relatedProductId: productId
    }).toArray();
  }

  // async getRelatedStoreId(variantId) {
  //   const relatedProductId = await this.getRelatedProductId(variantId);
  //   return await PRODUCTS_SOURCE.getRelatedStoreId(relatedProductId);
  // }

  async getRelatedStoreId(variantId) {
    this.initProductSource().then(async () => {
        const relatedProductId = await this.getRelatedProductId(variantId);
        return await this.productsSource.getRelatedStoreId(relatedProductId);
    }).then((result) => {
        return result;
    })
  }

  async getRelatedProductId(variantId) {
    variantId = sanitize(variantId);
    let variant = await this.findOneById(variantId);
    return variant.relatedProductId;
  }

  async createProductVariant(productVariant) {
    const {insertedId} = await this.collection.insertOne(productVariant);
    return insertedId;
  }

  async updateProductVariantById(idProductVariant, fieldsToUpdate) {
    idProductVariant = sanitize(idProductVariant);
    const query = {_id: new ObjectId(idProductVariant)};
    const updateValues = {$set: fieldsToUpdate};
    return await this.collection.updateOne(query, updateValues);
  }

  async deleteProductVariantById(idProductVariant) {
    idProductVariant = sanitize(idProductVariant);
    const query = {_id: new ObjectId(idProductVariant)};
    return await this.collection.deleteOne(query);
  }

  async deleteProductVariantsByProductId(productId) {
    productId = sanitize(productId);
    const query = {relatedProductId: productId};
    return await this.collection.deleteMany(query);
  }

  async getProductVariantByShopifyId(shopifyProductVariantId) {
    shopifyProductVariantId = sanitize(shopifyProductVariantId);
    return await this.collection.findOne({
      shopifyVariantId: shopifyProductVariantId
    });
  }

  async getTotalPriceOfProductVariants(variantsToOrder) {
    variantsToOrder = sanitize(variantsToOrder);
    let totalPrice = 0;
    for (let i = 0; i < variantsToOrder.length; i++) {
      let variant = variantsToOrder[i];
      let price = await this.getVariantPriceById(variant.variantId);
      totalPrice += price * variant.quantity;
    }
    return totalPrice;
  }

  async getTaxsOfProductVariants(variantsToOrder) {
    variantsToOrder = sanitize(variantsToOrder);
    let totalTax = 0;
    const quebecTaxes = 0.14975
    for (let i = 0; i < variantsToOrder.length; i++) {
      let variant = variantsToOrder[i];
      const {taxable} = await this.findOneById(variant.variantId);
      if (taxable) {
        let price = await this.getVariantPriceById(variant.variantId);
        totalTax += price * variant.quantity * quebecTaxes;
      }
    }
    return totalTax;
  }

  async getDeliveryCostOfProductVariants(variantsToOrder) {
    const stores = new Set();
    let totalDeliveryCost = 0;
    for (let i = 0; i < variantsToOrder.length; i++) {
      stores.add(await this.getRelatedStoreId(variantsToOrder[i].variantId))
    }
    const basicDeliveryFee = 9.99
    const additionalStoreDeliveryFee = 2.99
    if (stores.size > 0) {
      totalDeliveryCost = basicDeliveryFee + (stores.size - 1) * additionalStoreDeliveryFee;
    }
    return totalDeliveryCost;

  }

  async getVariantStoreId(id) {
    id = sanitize(id);
    let variant = await this.findOneById(id);
    return variant.relatedStoreId;
  }

  async getVariantPriceById(id) {
    id = sanitize(id);
    let variant = await this.findOneById(id);
    return variant.price;
  }

  async findAllByStoreId(storeId) {
    let allVariants = await this.collection.find({}).toArray();
    allVariants = Promise.all(allVariants.map(async (variant) => {
          return {
            ...variant,
            relatedStoreId: await this.getVariantStoreId(variant._id)
          }
        }
    ))
    return allVariants.filter(variant => variant.relatedStoreId === storeId);
  }
}
