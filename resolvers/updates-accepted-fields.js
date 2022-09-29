import {loadSchema} from "@graphql-tools/load";
import {GraphQLFileLoader} from "@graphql-tools/graphql-file-loader";

const graphQLSchema = await loadSchema('./graphql/updates-inputs.graphql', {
    loaders: [new GraphQLFileLoader()]
})
export const graphqlUpdateStoreFields = graphQLSchema.getTypeMap().UpdateStore.getFields()
export const graphqlUpdateProductFields = graphQLSchema.getTypeMap().UpdateProduct.getFields()
export const graphqlUpdateProductVariantFields = graphQLSchema.getTypeMap().UpdateProductVariant.getFields()
export const graphqlUpdateVendorAccountFields = graphQLSchema.getTypeMap().UpdateVendorAccount.getFields()
