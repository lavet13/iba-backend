import { mergeResolvers } from '@graphql-tools/merge';
import userResolvers from './user/user.resolvers';
import wbOrderResolvers from './wb-order/wb-order.resolvers';
import scalarResolvers from './scalar/scalar.resolvers';

export default mergeResolvers([userResolvers, wbOrderResolvers, scalarResolvers]);
