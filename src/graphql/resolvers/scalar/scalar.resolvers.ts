import { Resolvers } from '../../__generated__/types';
import DateScalars from '../../scalars/date.scalars';
import { BigIntResolver } from 'graphql-scalars';

const resolvers: Resolvers = {
  Date: DateScalars,
  BigInt: BigIntResolver,
};

export default resolvers;
