const queriesVendorsLoginResolvers = {
    loginVendorByEmail: async (_, args, {dataSources: {vendors}}) => {
        const accountsFound = await vendors.loginByEmail(args.email, args.password)
        if (accountsFound.length !== 1) return {
            code: 404,
            message: "Invalids credentials"
        }
        if(!accountsFound[0].verified) return {
            code: 406,
            message: "Account not verified"
        }
        return {
            code: 200,
            message: "Vendor logged in",
            vendorAccount: accountsFound[0]
        }
    },
    loginVendorByUsername: async (_, args, {dataSources: {vendors}}) => {
        const accountsFound = await vendors.loginByUsername(args.username, args.password)
        if (accountsFound.length !== 1) return {
            code: 404,
            message: "Invalids credentials"
        }
        if(!accountsFound[0].verified) return {
            code: 406,
            message: "Account not verified"
        }
        return {
            code: 200,
            message: "Vendor logged in",
            vendorAccount: accountsFound[0]
        }
    },
};
export {queriesVendorsLoginResolvers}
