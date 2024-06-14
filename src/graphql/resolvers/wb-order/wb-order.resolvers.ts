import { Resolvers } from '../../__generated__/types';
import fs from 'fs';
import path from 'path';

import {
  ResolversComposerMapping,
  composeResolvers,
} from '@graphql-tools/resolvers-composition';
import { GraphQLError } from 'graphql';

const resolvers: Resolvers = {
  Query: {
  },
  Mutation: {
    async saveQR(_, args, ctx) {
      const file: File = args.file;
      console.log({ file });

      if(!file) return false;

      try {
        console.log({ cwd: process.cwd() });
        const folderPath = path.join(process.cwd(), '../wb-order');
        const fileToWrite = path.join(folderPath, file.name);
        const fileArrayBuffer = await file.arrayBuffer();

        console.log({ fileName: file.name, fileToWrite });

        await fs.promises.writeFile(fileToWrite, Buffer.from(fileArrayBuffer));
      } catch(err) {
        return false;
      }
      return true;
    },
  },
};

const resolversComposition: ResolversComposerMapping<any> = {
};

export default composeResolvers(resolvers, resolversComposition);
