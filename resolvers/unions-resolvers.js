const unionsResolvers = {
    ProductResponse: {
        __resolveType(obj, context, info){
            if(obj.code){
                return 'HttpResponse';
            }
            if(obj._id){
                return 'Product';
            }
            return null; // GraphQLError is thrown
        },
    },
    ProductVariantResponse: {
        __resolveType(obj, context, info){
            if(obj.code){
                return 'HttpResponse';
            }
            if(obj._id){
                return 'ProductVariant';
            }
            return null; // GraphQLError is thrown
        }
    },
    StoreResponse: {
        __resolveType(obj, context, info){
            if(obj.code){
                return 'HttpResponse';
            }
            if(obj._id){
                return 'Store';
            }
            return null; // GraphQLError is thrown
        }
    },
    VendorAccountResponse: {
        __resolveType(obj, context, info){
            if(obj.code){
                return 'HttpResponse';
            }
            if(obj._id){
                return 'VendorAccount';
            }
            return null; // GraphQLError is thrown
        }
    }
};
export {unionsResolvers}
