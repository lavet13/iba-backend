import { mergeResolvers } from '@graphql-tools/merge';
import userResolvers from '@/graphql/resolvers/user/user.resolvers';
import wbOrderResolvers from '@/graphql/resolvers/wb-order/wb-order.resolvers';
import scalarResolvers from '@/graphql/resolvers/scalar/scalar.resolvers';

export default mergeResolvers([userResolvers, wbOrderResolvers, scalarResolvers]);
