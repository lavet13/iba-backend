import { Application, NextFunction, Response, Request } from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import api from '@/routers/api';
import assets from '@/routers/assets';
import { YogaServerInstance } from 'graphql-yoga';
import { ContextValue } from '@/context';

export default function configure(
  app: Application,
  yoga: YogaServerInstance<{}, ContextValue>,
) {
  app
    .use('/graphql', yoga)
    .use(
      cors({
        credentials: true,
      }),
    )
    .use(bodyParser.json())
    .use(compression())
    .get('/', (_, res) => {
      return res.json({ message: 'Welcome to the root source of evil!', statusCode: 201 });
    })
    .use('/api', api())
    .use('/assets', assets())

    // 404 handler
    .use((_, res, __) => {
      res.status(404).json({ message: 'Route not found', statusCode: 404 });
    })

    // error handling middleware
    .use((error: Error, _: Request, res: Response, __: NextFunction) => {
      console.error('Error: ', error);
      res
        .status(500)
        .json({ message: 'Internal Server Error', statusCode: 500 });
    });
}
