import {
  Resolvers,
  ResolverTypeWrapper,
  SearchTypeWbOrders,
} from '@/graphql/__generated__/types';
import { Prisma, Role, WbOrder } from '@prisma/client';
import fs from 'fs';
import path from 'path';

import {
  ResolversComposerMapping,
  composeResolvers,
} from '@graphql-tools/resolvers-composition';
import { GraphQLError } from 'graphql';
import sharp from 'sharp';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { applyConstraints } from '@/helpers/apply-constraints';
import { getMimeTypeImage } from '@/helpers/get-mime-type';
import { hasRoles, isAuthenticated } from '@/graphql/composition/authorization';

const resolvers: Resolvers = {
  Query: {
    async wbOrders(_, args, ctx) {
      const query = args.input.query?.trim();

      const status = args.input.status;
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

            cursor = { id: -1 }; // we guarantee wbOrders are empty
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

            cursor = nextValidOrder ? { id: nextValidOrder.id } : undefined;
          }
        }
      }

      const searchType = Object.values(SearchTypeWbOrders);
      const conditions: Prisma.WbOrderWhereInput[] = [];

      if (searchType.includes(SearchTypeWbOrders.Id)) {
        // Number.isFinite isn't a solution, something
        let queryAsBigInt = undefined;
        try {
          queryAsBigInt =
            query && BigInt(query)
              ? BigInt(query)
              : undefined;
        } catch(err) {
          queryAsBigInt = undefined;
        }

        conditions.push({ id: { equals: queryAsBigInt } });
      }
      if (searchType.includes(SearchTypeWbOrders.WbPhone)) {
        conditions.push({ wbPhone: { contains: query } });
      }
      if (searchType.includes(SearchTypeWbOrders.Phone)) {
        conditions.push({ phone: { contains: query } });
      }
      if (searchType.includes(SearchTypeWbOrders.Name)) {
        conditions.push({ name: { contains: query, mode: 'insensitive' } });
      }

      const sorting = args.input.sorting;
      const orderBy = sorting[0] ? { [sorting[0].id]: sorting[0].desc ? 'desc' : 'asc' } : [];

      // fetching wbOrders with extra one, so to determine if there's more to fetch
      const wbOrders = await ctx.prisma.wbOrder.findMany({
        take:
          direction === PaginationDirection.BACKWARD ? -(take + 1) : take + 1, // Fetch one extra wbOrder for determining `hasNextPage`
        cursor,
        skip: cursor ? 1 : undefined, // Skip the cursor wbOrder for the next/previous page
        orderBy,
        where: {
          OR:
            query.length !== 0 && conditions.length > 0
              ? conditions
              : undefined,
          status,
        },
      });

      // If no results are retrieved, it means we've reached the end of the
      // pagination or because we stumble upon invalid cursor, so on the
      // client we just clearing `before` and `after` cursors to get first wbOrders
      // forward pagination could have no wbOrders at all,
      // or because cursor is set to `{ id: -1 }`, for backward pagination
      // the only thing would happen if only wbOrders are empty!
      if (wbOrders.length === 0) {
        return {
          edges: [],
          pageInfo: {
            endCursor: null,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }

      // Fix: Properly handle edge slicing based on direction and take value
      const edges =
        direction === PaginationDirection.BACKWARD
          ? wbOrders.slice(1).reverse().slice(0, take) // For backward pagination, remove first item and take requested amount
          : wbOrders.slice(0, take); // For forward/none pagination, just take requested amount

      const hasMore = wbOrders.length > take;

      const startCursor = edges.length === 0 ? null : edges[0]?.id;
      const endCursor = edges.length === 0 ? null : edges.at(-1)?.id;

      // This is where the condition `edges.length < wbOrders.length` comes into
      // play. If the length of the `edges` array is less than the length
      // of the `wbOrders` array, it means that the extra wbOrder was fetched and
      // excluded from the `edges` array. That implies that there are more
      // wbOrders available to fetch in the current pagination direction.
      const hasNextPage =
        direction === PaginationDirection.BACKWARD ||
        (direction === PaginationDirection.FORWARD && hasMore) ||
        (direction === PaginationDirection.NONE &&
          edges.length < wbOrders.length);
      // /\
      // |
      // |
      // NOTE: This condition `edges.length < wbOrders.length` is essentially
      // checking the same thing as `hasMore`, which is whether there are more
      // wbOrders available to fetch. Therefore, you can safely replace
      // `edges.length < wbOrders.length` with hasMore in the condition for
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
      const file: File | null = args.input.QR;
      console.log({ file });

      if (!file) {
        const newWbOrder = await ctx.prisma.wbOrder
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

        ctx.pubSub.publish('newWbOrder', { newWbOrder });

        return newWbOrder;
      }

      const { randomBytes } = await import('node:crypto');

      const hash = randomBytes(16).toString('hex');
      const extension = path.extname(file.name);
      const fileName = `${hash}${extension}`;
      const originalBuffer = Buffer.from(await file.arrayBuffer());

      const folderPath = path.join(process.cwd(), 'assets', 'qr-codes');
      const fileToWrite = path.join(folderPath, fileName);

      if (!fs.existsSync(folderPath)) {
        try {
          await fs.promises.mkdir(folderPath, { recursive: true });
        } catch (err) {
          console.error('Unable to make a directory: ', err);
          throw new GraphQLError('Directory creation failed!');
        }
      }

      const _sharp = sharp(originalBuffer);
      const metadata = await _sharp.metadata();
      let bufferToSend: Buffer;

      try {
        let optimizedImage: Buffer;
        if (metadata.format === 'png') {
          optimizedImage = await _sharp
            .resize({
              width: 500,
              height: 500,
              fit: 'inside',
              withoutEnlargement: true,
            })
            .png({ quality: 80, palette: true })
            .toBuffer();
        } else {
          optimizedImage = await _sharp
            .resize({
              width: 500,
              height: 500,
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality: 80 })
            .toBuffer();
        }
        // Check if the optimized image is significantly larger than the original
        if (optimizedImage.length > originalBuffer.length * 1.1) {
          // If it's more than 10% larger, save the original instead
          bufferToSend = originalBuffer;
          await fs.promises.writeFile(fileToWrite, originalBuffer);
        } else {
          bufferToSend = optimizedImage;
          await fs.promises.writeFile(fileToWrite, optimizedImage);
        }
      } catch (err: any) {
        try {
          await fs.promises.unlink(fileToWrite);
        } catch (unlinkErr) {
          console.error('Failed to delete file: ', unlinkErr);
        }

        console.error('Optimization error: ', err);
        throw new GraphQLError('Unexpected error during image optimization!');
      }

      const newWbOrder = await ctx.prisma.wbOrder
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

      type FileObject = {
        buffer: Buffer;
        type: string;
      };

      const processedFile: FileObject = {
        buffer: bufferToSend,
        type: getMimeTypeImage(file.name),
      };

      const newWbOrderWithFile: ResolverTypeWrapper<WbOrder> & {
        qrCodeFile: FileObject | null;
      } = { ...newWbOrder, qrCodeFile: processedFile };

      ctx.pubSub.publish('newWbOrder', { newWbOrder: newWbOrderWithFile });

      return newWbOrderWithFile;
    },
    async updateWbOrder(_, args, ctx) {
      const { id, status } = args.input;

      const orderWb = await ctx.prisma.wbOrder.update({
        where: {
          id,
        },
        data: {
          status,
        },
      });

      return orderWb;
    },
  },
  Subscription: {
    newWbOrder: {
      subscribe: (_, args, ctx) => ctx.pubSub.subscribe('newWbOrder'),
    },
  },
};

const resolversComposition: ResolversComposerMapping<any> = {
  'Query.wbOrders': [isAuthenticated(), hasRoles([Role.MANAGER, Role.ADMIN])],
  'Query.wbOrderById': [
    isAuthenticated(),
    hasRoles([Role.MANAGER, Role.ADMIN]),
  ],
  'Mutation.updateWbOrder': [
    isAuthenticated(),
    hasRoles([Role.MANAGER, Role.ADMIN]),
  ],
  // 'Subscription.newWbOrder': [
  //   isAuthenticated(),
  //   hasRoles([Role.MANAGER, Role.ADMIN]),
  // ],
};

export default composeResolvers(resolvers, resolversComposition);
