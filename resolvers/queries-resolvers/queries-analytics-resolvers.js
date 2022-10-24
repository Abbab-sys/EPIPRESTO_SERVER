const queriesAnalyticsResolvers = {
  getAnalytics: async (
    _,
    args,
    { dataSources: { stores, orders, productsVariants, products } }
  ) => {
    const {idStore,dateFrom, dateTo } = args;
    const store = await stores.findOneById(idStore);

    if (store) {
      const store_orders_ids = store.orders;
      const store_orders_objects = await orders.getOrdersByIds(
        store_orders_ids
      );

      const orders_in_date_range = store_orders_objects.filter(
        (order) => {
          const order_date = new Date(order.logs[0].time);
          return order_date >= dateFrom && order_date <= dateTo;
        }
      );

        const total_sum = await calculateTotalSum(idStore,orders_in_date_range, productsVariants,products);

        const total_orders=orders_in_date_range.length;

        const topProducts = await getTopProducts(idStore,orders_in_date_range, productsVariants,products);

        return {
            code: 200,
            message: "Analytics succesfully retrieved",
            topProducts: topProducts,
            totalSales: total_sum, 
            totalOrders: total_orders,
          };
    }
    else {
        return {
          code: 404,
          message: "Store not found",
        };
      }

    
     
  },
};


async function calculateTotalSum(storeId,store_orders_objects, productsVariants,products) {
    let total_sum=0;

    for (const order of store_orders_objects) {
        await  order.productsVariantsOrdered.filter(
           async ({ relatedProductVariantId }) => {
             const productVariant = await productsVariants.findOneById(
               relatedProductVariantId
             );
             if (!productVariant || !productVariant.relatedProductId)
               return false;
             const product = await products.findOneById(
               productVariant.relatedProductId
             );
             return product.relatedStoreId.toString() === storeId;
           }
         );
 
         for (const orderProductVariants of order.productsVariantsOrdered) {
             const productVariant = await productsVariants.findOneById(
                 orderProductVariants.relatedProductVariantId );
                 
           total_sum += productVariant.price * orderProductVariants.quantity;
         }
       }
         return total_sum;
  }

async function getTopProducts(storeId,store_orders_objects, productsVariants,products) {
    for (const order of store_orders_objects) {
        await  order.productsVariantsOrdered.filter(
           async ({ relatedProductVariantId }) => {
             const productVariant = await productsVariants.findOneById(
               relatedProductVariantId
             );
             if (!productVariant || !productVariant.relatedProductId)
               return false;
             const product = await products.findOneById(
               productVariant.relatedProductId
             );
             return product.relatedStoreId.toString() === storeId;
           }
         );

    }

    const topProducts=mostBoughtProducts(store_orders_objects, 5);    
    return topProducts.map(async (productVariantId) => {
        const productVariant = await productsVariants.findOneById(productVariantId);
        return productVariant;
    });


    
    
}

function mostBoughtProducts(orders, k) {
  const freqMap = new Map();
  const bucket = [];
  const result = [];

  
  for(const order of orders) {
    
    for(const productVariantOrder of order.productsVariantsOrdered) {
      freqMap.set(productVariantOrder.relatedProductVariantId, (freqMap.get(productVariantOrder.relatedProductVariantId) || 0) + 1);
    }
  }
  
  for(let [productId, freq] of freqMap) {
    bucket[freq] = (bucket[freq] || new Set()).add(productId);
  }
  
  for(let i = bucket.length-1; i >= 0; i--) {
      if(bucket[i]) result.push(...bucket[i]);
      if(result.length === k) break;
  }
  return result;
};




export { queriesAnalyticsResolvers };
