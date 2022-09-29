const queriesVendorsCredentialsCheckingResolvers = {
    isVendorUsernameUsed: async (_, args, {dataSources: {vendors}}) => {
        const accountsFound = await vendors.findVendorByUsername(args.username)
        return accountsFound.length !== 0
    },
    isVendorEmailUsed: async (_, args, {dataSources: {vendors}}) => {
        const accountsFound = await vendors.findVendorByEmail(args.email)
        return accountsFound.length !== 0
    },
};
export {queriesVendorsCredentialsCheckingResolvers}
