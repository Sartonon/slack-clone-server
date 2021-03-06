/* eslint-disable import/first */
import 'babel-polyfill';
import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import path from 'path';
import { fileLoader, mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';

require('dotenv').config();

import models from './models';
import { refreshTokens } from './auth';

const SECRET = 'asDFAFGQEGQAVASGGSAGF';
const SECRET2 = 'asdasdfDADFJASDGASDGQASDsasfsfdasfad';

const typeDefs = mergeTypes(fileLoader(path.join(__dirname, './schema')));

const resolvers = mergeResolvers(
  fileLoader(path.join(__dirname, './resolvers')),
);

// eslint-disable-next-line import/prefer-default-export
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const { PORT } = process.env;

const app = express();

app.use(cors('*'));

const addUser = async (req, res, next) => {
  const token = req.headers['x-token'];
  if (token) {
    try {
      const { user } = jwt.verify(token, SECRET);
      req.user = user;
    } catch (err) {
      const refreshToken = req.headers['x-refresh-token'];
      const newTokens = await refreshTokens(
        token,
        refreshToken,
        models,
        SECRET,
        SECRET2,
      );

      if (newTokens.token && newTokens.refreshToken) {
        res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
        res.set('x-token', newTokens.token);
        res.set('x-refresh-token', newTokens.refreshToken);
      }

      req.user = newTokens.user;
    }
  }
  next();
};

app.use(addUser);

const graphqlEndpoint = '/graphql';

app.use(
  graphqlEndpoint,
  bodyParser.json(),
  graphqlExpress(req => ({
    schema,
    context: {
      models,
      user: req.user,
      SECRET,
      SECRET2,
    },
  })),
);

app.use('/graphiql', graphiqlExpress({ endpointURL: graphqlEndpoint }));

const server = createServer(app);

models.sequelize.sync().then(() => {
  server.listen(PORT || 8080, () => {
    // eslint-disable-next-line no-new
    new SubscriptionServer(
      {
        execute,
        subscribe,
        schema,
        onConnect: async ({ token, refreshToken }) => {
          if (token && refreshToken) {
            let user = null;
            try {
              const payload = jwt.verify(token, SECRET);
              user = payload.user;
            } catch (err) {
              const newTokens = await refreshTokens(
                token,
                refreshToken,
                models,
                SECRET,
                SECRET2,
              );
              user = newTokens.user;
            }
            if (!user) {
              throw new Error('Invalid auth tokens');
            }

            return true;
          }
          throw new Error('Missing auth token!');
        },
      },
      {
        server,
        path: '/subscriptions',
      },
    );
  });
});
