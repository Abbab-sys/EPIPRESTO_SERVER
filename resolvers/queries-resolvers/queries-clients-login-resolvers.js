const queriesClientsLoginResolvers = {

    loginClientByUsername: async (_, args, {dataSources: {clients}}) => {
        const accountsFound = await clients.loginByUsername(args.username, args.password)
        if (!accountsFound) return {
            code: 404,
            message: "Invalids credentials"
        }
        if (!accountsFound.verified) return {
            code: 401,
            message: "Account not verified"
        }
        return {
            code: 200,
            message: "Client logged in",
            clientAccount: accountsFound
        }
    },
    loginClientByEmail: async (_, args, {dataSources: {clients}}) => {
        const accountsFound = await clients.loginByEmail(args.email, args.password)
        if (!accountsFound) return {
            code: 404,
            message: "Invalids credentials"
        }
        if (!accountsFound.verified) return {
            code: 401,
            message: "Account not verified"
        }
        return {
            code: 200,
            message: "Client logged in",
            clientAccount: accountsFound
        }
    }
};
export {queriesClientsLoginResolvers}
