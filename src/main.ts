import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import 'json-bigint-patch';

import { makeExecutableSchema } from '@graphql-tools/schema';
import { useCookies } from '@whatwg-node/server-plugin-cookies';
import { useJWT } from '@graphql-yoga/plugin-jwt';

import resolvers from './graphql/resolvers';
import typeDefs from './graphql/types';

import { createContext } from './context';
import { createYoga } from 'graphql-yoga';

import routerQrCodeImage from './routes/qr-code-image';

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

async function bootstrap() {
  const app = express();

  // console.log({ endpoint: import.meta.env.VITE_GRAPHQL_ENDPOINT });
  console.log({ importEnv: import.meta.env });
  // console.log({ processEnv: process.env });


  const yoga = createYoga({
    schema,
    context: createContext,
    graphqlEndpoint: import.meta.env.VITE_GRAPHQL_ENDPOINT,
    graphiql: import.meta.env.DEV,
    landingPage: import.meta.env.PROD,
    cors: {
      credentials: true,
    },
    plugins: [
      // useResponseCache({
      //   // global cache
      //   session: () => null,
      // }),
      useCookies(),
    ],
  });

  console.log({ DATABASE_URL: process.env.DATABASE_URL });

  app.use(cors({
    credentials: true,
  }));

  // create endpoints before yoga's endpoint
  app.use('/assets/qr-codes', routerQrCodeImage);

  app.use(yoga);

  if (import.meta.env.PROD) {
    app.listen(import.meta.env.VITE_PORT, () => {
      console.log(
        `🚀 Query endpoint ready at http://0.0.0.0:${
          import.meta.env.VITE_PORT
        }${import.meta.env.VITE_GRAPHQL_ENDPOINT}`
      );
    });
  }

  return app;
}

const app = bootstrap();
export const viteNodeApp = app;
