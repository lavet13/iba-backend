import { mergeTypeDefs } from '@graphql-tools/merge';
import userTypes from './user/user.types';
import wbOrderTypes from './wb-order/wb-order.types';
import scalarTypes from './scalar/scalar.types';

export default mergeTypeDefs([scalarTypes, userTypes, wbOrderTypes]);
