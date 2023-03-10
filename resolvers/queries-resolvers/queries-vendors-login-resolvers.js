const queriesVendorsLoginResolvers = {
    loginVendorByEmail: async (_, args, {dataSources: {vendors}}) => {
        const accountsFound = await vendors.loginByEmail(args.email.toLowerCase(), args.password)
        if (!accountsFound) return {
            code: 404,
            message: "Invalids credentials"
        }
        if(!accountsFound.verified) return {
            code: 401,
            message: "Account not verified"
        }
        return {
            code: 200,
            message: "Vendor logged in",
            vendorAccount: accountsFound
        }
    },
    loginVendorByUsername: async (_, args, {dataSources: {vendors}}) => {
        const accountsFound = await vendors.loginByUsername(args.username, args.password)
        if (!accountsFound) return {
            code: 404,
            message: "Invalids credentials"
        }
        if(!accountsFound.verified) return {
            code: 401,
            message: "Account not verified"
        }
        return {
            code: 200,
            message: "Vendor logged in",
            vendorAccount: accountsFound
        }
    },
};
export {queriesVendorsLoginResolvers}
