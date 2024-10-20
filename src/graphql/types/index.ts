import { mergeTypeDefs } from '@graphql-tools/merge';
import userTypes from '@/graphql/types/user/user.types';
import wbOrderTypes from '@/graphql/types/wb-order/wb-order.types';
import scalarTypes from '@/graphql/types/scalar/scalar.types';

export default mergeTypeDefs([scalarTypes, userTypes, wbOrderTypes]);
