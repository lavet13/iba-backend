import { Application } from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import api from './api';
import assets from './assets';
import { YogaServerInstance } from 'graphql-yoga';
import { ContextValue } from '../context';

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
      return res.json({ message: 'Welcome to nothing!' });
    })
    .use('/api', api())
    .use('/assets', assets())
    .use((_, res) => {
      res.json({
        error: 'Invalid route',
      });
    });
}
