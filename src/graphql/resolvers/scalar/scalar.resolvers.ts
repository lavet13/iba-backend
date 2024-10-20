import { Resolvers } from '@/graphql/__generated__/types';
import DateScalars from '@/graphql/scalars/date.scalars';
import { BigIntResolver } from 'graphql-scalars';

const resolvers: Resolvers = {
  Date: DateScalars,
  BigInt: BigIntResolver,
};

export default resolvers;
