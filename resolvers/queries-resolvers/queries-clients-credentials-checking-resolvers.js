const queriesClientsCredentialsCheckingResolvers = {
    isClientUsernameUsed: async (_, args, {dataSources: {clients}}) => {
        const accountsFound = await clients.findClientByUsername(args.username)
        return accountsFound.length !== 0
    },
    isClientEmailUsed: async (_, args, {dataSources: {clients}}) => {
        const accountsFound = await clients.findClientByEmail(args.email)
        return accountsFound.length !== 0
    }
};
export {queriesClientsCredentialsCheckingResolvers}
