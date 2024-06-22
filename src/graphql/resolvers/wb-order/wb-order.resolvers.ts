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
import { applyConstraints } from '../../../helpers/apply-constraints';

const resolvers: Resolvers = {
  Query: {
    async wbOrders(_, args, ctx) {
      enum PaginationDirection {
        NONE = 'NONE',
        FORWARD = 'FORWARD',
        BACKWARD = 'BACKWARD',
      }

      const direction: PaginationDirection = args.input.after
        ? PaginationDirection.FORWARD
        : args.input.before
          ? PaginationDirection.BACKWARD
          : PaginationDirection.NONE;
      console.log({ before: args.input.before, after: args.input.after });

      const take = Math.abs(
        applyConstraints({
          type: 'take',
          min: 1,
          max: 50,
          value: args.input.take ?? 30,
        }),
      );

      let cursor =
        direction === PaginationDirection.NONE
          ? undefined
          : {
              id:
                direction === PaginationDirection.FORWARD
                  ? args.input.after ?? undefined
                  : args.input.before ?? undefined,
            };

      // in case where we might get cursor which points to nothing
      if (direction !== PaginationDirection.NONE) {
        // checking if the cursor pointing to the wbOrder doesn't exist,
        // otherwise skip
        const cursorOrder = await ctx.prisma.wbOrder.findUnique({
          where: { id: cursor?.id },
        });

        if (!cursorOrder) {
          if (direction === PaginationDirection.FORWARD) {
            // this shit is shit and isn't work for me,
            // or because perhaps I am retard ☺️💕
            //
            // const previousValidPost = await ctx.prisma.wbOrder.findFirst({
            //   where: { id: { lt: args.input.after } },
            //   orderBy: { id: 'desc' },
            // });
            // console.log({ previousValidPost });
            // cursor = previousValidPost ? { id: previousValidPost.id } : undefined;

            cursor = { id: -1 }; // we guarantee credits are empty
          } else if (direction === PaginationDirection.BACKWARD) {
            const nextValidOrder = await ctx.prisma.wbOrder.findFirst({
              where: {
                id: {
                  gt: args.input.before,
                },
              },
              orderBy: {
                id: 'asc',
              },
            });
            console.log({ nextValidOrder });

            cursor = nextValidOrder ? { id: nextValidOrder.id } : undefined;
          }
        }
      }

      // fetching credits with extra one, so to determine if there's more to fetch
      const credits = await ctx.prisma.wbOrder.findMany({
        take:
          direction === PaginationDirection.BACKWARD ? -(take + 1) : take + 1, // Fetch one extra wbOrder for determining `hasNextPage`
        cursor,
        skip: cursor ? 1 : undefined, // Skip the cursor wbOrder for the next/previous page
        orderBy: { id: 'desc' }, // Order by id for consistent pagination
      });

      // If no results are retrieved, it means we've reached the end of the
      // pagination or because we stumble upon invalid cursor, so on the
      // client we just clearing `before` and `after` cursors to get first credits
      // forward pagination could have no credits at all,
      // or because cursor is set to `{ id: -1 }`, for backward pagination
      // the only thing would happen if only credits are empty!
      if (credits.length === 0) {
        return {
          edges: [],
          pageInfo: {
            endCursor: null,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }

      // If the number of credits fetched is less than or equal to the
      // `take` value, you include all the credits in the `edges` array.
      // However, if the number of credits fetched is greater than
      // the `take` value, you exclude the extra wbOrder from
      // the `edges` array by slicing the credits array.
      const edges =
        credits.length <= take
          ? credits
          : direction === PaginationDirection.BACKWARD
            ? credits.slice(1, credits.length)
            : credits.slice(0, -1);
      console.log({ edges });

      const hasMore = credits.length > take;

      const startCursor = edges.length === 0 ? null : edges[0]?.id;
      const endCursor = edges.length === 0 ? null : edges.at(-1)?.id;

      // This is where the condition `edges.length < credits.length` comes into
      // play. If the length of the `edges` array is less than the length
      // of the `credits` array, it means that the extra wbOrder was fetched and
      // excluded from the `edges` array. That implies that there are more
      // credits available to fetch in the current pagination direction.
      const hasNextPage =
        direction === PaginationDirection.BACKWARD ||
        (direction === PaginationDirection.FORWARD && hasMore) ||
        (direction === PaginationDirection.NONE &&
          edges.length < credits.length);
      // /\
      // |
      // |
      // NOTE: This condition `edges.length < credits.length` is essentially
      // checking the same thing as `hasMore`, which is whether there are more
      // credits available to fetch. Therefore, you can safely replace
      // `edges.length < credits.length` with hasMore in the condition for
      // determining hasNextPage. Both conditions are equivalent and will
      // produce the same result.

      const hasPreviousPage =
        direction === PaginationDirection.FORWARD ||
        (direction === PaginationDirection.BACKWARD && hasMore);

      return {
        edges,
        pageInfo: {
          startCursor,
          endCursor,
          hasNextPage,
          hasPreviousPage,
        },
      };
    },
    async wbOrderById(_, args, ctx) {
      const id = args.id;

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
        const folderPath = path.join(process.cwd(), 'assets', 'qr-codes');
        const fileToWrite = path.join(folderPath, fileName);

        console.log({ fileName: file.name, fileToWrite });
        fs.mkdirSync(folderPath, { recursive: true });
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }

        try {
          const objSharp = await _sharp
            .resize({ width: 177 })
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
