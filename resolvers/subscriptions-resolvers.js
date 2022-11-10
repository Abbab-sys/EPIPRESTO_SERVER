import {withFilter} from 'graphql-subscriptions';
import {connect} from 'mqtt';
import {MQTTPubSub} from 'graphql-mqtt-subscriptions';

const client = connect('mqtt://localhost:1883', {
    reconnectPeriod: 1000,
});

export const PUB_SUB = new MQTTPubSub({
    client
});

// Create subscription resolvers
export const subscriptionResolvers = {
    Subscription: {
        messageSent: {
            subscribe: withFilter(
                () => PUB_SUB.asyncIterator('MESSAGE_SENT'),
                (payload, variables,context,info) => {
                    // Only push an update if the comment is on
                    // the correct repository for this operation

                    return (
                        (variables.storeId &&variables.storeId.toString()===payload.messageSent.relatedVendor._id.toString() ) ||
                        (variables.clientId &&variables.clientId.toString()===payload.messageSent.relatedClient._id.toString() )
                    );
                },
            ),
        },
        addressChanged: {
            subscribe: withFilter(
                () => PUB_SUB.asyncIterator('ADDRESS_CHANGED'),
                (payload, variables,context,info) => {
                    // Only push an update if the comment is on
                    // the correct repository for this operation

                    return (
                        (variables.clientId &&variables.clientId.toString()===payload.addressChanged )
                    );
                },
            ),
        },
    },
    // ...other resolvers...
};
