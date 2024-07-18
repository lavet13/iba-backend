import { createPubSub } from 'graphql-yoga';
import { WbOrder } from '@prisma/client';

export type PubSubChannels = {
  newWbOrder: [{ newWbOrder: WbOrder }];
};

export const pubSub = createPubSub<PubSubChannels>();
