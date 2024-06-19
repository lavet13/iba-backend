import { Resolvers } from '../../__generated__/types';
import fs from 'fs';
import path from 'path';

import {
  ResolversComposerMapping,
  composeResolvers,
} from '@graphql-tools/resolvers-composition';
import { GraphQLError } from 'graphql';
import sharp from 'sharp';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const resolvers: Resolvers = {
  Query: {
    async wbOrderById(_, args, ctx) {
      const id = +args.id;

      const orderWb = await ctx.prisma.wbOrder
        .findUnique({
          where: {
            id,
          },
        })
        .catch((err: unknown) => {
          if (err instanceof PrismaClientKnownRequestError) {
            if (err.code === 'P2025') {
              throw new GraphQLError(`OrderWb with ID \`${id}\` not found.`);
            }
          }
          console.log({ err });
          throw new GraphQLError('Unknown error!');
        });

      return orderWb;
    },
  },
  Mutation: {
    async saveWbOrder(_, args, ctx) {
      console.log({ input: args.input });
      const file: File | null = args.input.QR;

      if (!file) {
        await ctx.prisma.wbOrder
          .create({
            data: {
              name: args.input.FLP,
              phone: args.input.phone,
              orderCode: args.input.orderCode,
              wbPhone: args.input.wbPhone,
            },
          })
          .catch((err: unknown) => {
            if (err instanceof PrismaClientKnownRequestError) {
              if (err.code === 'P2002') {
                throw new GraphQLError(
                  `Код заказа \`${args.input.orderCode}\` уже существует!`,
                );
              }
            }
            console.log({ err });
            throw new GraphQLError('Unknown error!');
          });

        return false;
      }

      console.log({ name: file.name });

      const { randomBytes } = await import('node:crypto');

      const hash = randomBytes(16).toString('hex');
      const lastDotIndex = file.name.lastIndexOf('.');
      const extension = file.name.slice(lastDotIndex + 1);
      const fileName = `${hash}.${extension}`;

      try {
        console.log({ cwd: process.cwd() });

        const _sharp = sharp(await file.arrayBuffer());
        const folderPath = path.join(process.cwd(), 'assets');
        const fileToWrite = path.join(folderPath, fileName);

        console.log({ fileName: file.name, fileToWrite });
        fs.mkdirSync(folderPath, { recursive: true });
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }

        try {
          const objSharp = await _sharp
            .resize({ width: 500 })
            .jpeg()
            .toFile(fileToWrite);
          console.log({ objSharp });
        } catch (err: any) {
          try {
            fs.unlinkSync(fileToWrite);
          } catch (err) {
            throw new GraphQLError('Failed to delete the image!');
          }
          throw new GraphQLError('Failed to optimize the image!');
        }

        await ctx.prisma.wbOrder
          .create({
            data: {
              name: args.input.FLP,
              phone: args.input.phone,
              orderCode: args.input.orderCode,
              wbPhone: args.input.wbPhone,
              qrCode: fileName,
            },
          })
          .catch((err: unknown) => {
            if (err instanceof PrismaClientKnownRequestError) {
              if (err.code === 'P2002') {
                throw new GraphQLError(
                  `Код заказа \`${args.input.orderCode}\` уже существует!`,
                );
              }
            }
            console.log({ err });
            throw new GraphQLError('Unknown error!');
          });
      } catch (err) {
        console.log({ err });
        throw new GraphQLError('Unable to save file to `wb-order`');
      }
      return true;
    },
  },
};

const resolversComposition: ResolversComposerMapping<any> = {};

export default composeResolvers(resolvers, resolversComposition);
