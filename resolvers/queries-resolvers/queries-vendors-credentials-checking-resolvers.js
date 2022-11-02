const queriesVendorsCredentialsCheckingResolvers = {
    isVendorUsernameUsed: async (_, args, {dataSources: {vendors}}) => {
        const accountsFound = await vendors.findVendorByUsername(args.username)
        return !!accountsFound
    },
    isVendorEmailUsed: async (_, args, {dataSources: {vendors}}) => {
        const accountsFound = await vendors.findVendorByEmail(args.email.toLowerCase())
        return !!accountsFound
    },
};
export {queriesVendorsCredentialsCheckingResolvers}
