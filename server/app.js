import config from './config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { sequelize } from './models';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
require("babel-polyfill"); // Important for the Build **Do not touch**

// Import the root schema
import rootSchema from './data/root';

// Import schemas and resolvers
import userSchema from './data/user/schema';
import userResolvers from './data/user/resolvers';
import accessSchema from './data/access/schema';
import accessResolvers from './data/access/resolvers';
import allierhSchema from './data/allierh/schema';
import allierhResolvers from './data/allierh/resolvers';
import configSchema from './data/option/schema';
import configResolvers from './data/option/resolvers';
import contentsSchema from './data/contents/schema';
import contentsResolvers from './data/contents/resolvers';
import menuSchema from './data/admin/menu/schema';
import menuResolvers from './data/admin/menu/resolvers';
import dashboardSchema from "./data/dashboard/schema";
import dashboardResolvers from "./data/dashboard/resolvers";

// Import helpers
import accessHelpers from './data/access/helpers';
import menuHelpers from './data/admin/menu/helpers';

console.log('\nWelcome to Origin Backend Server\n');

console.log('[OriginServer] All imports are good, let\'s connect to the DB');

console.log('[DB] Name: '+sequelize.config.database+'\n[DB] Host: '+sequelize.config.host);
console.log('[DB] Connecting...');

// Check for the DB connection
sequelize
  .authenticate()
  .then(async () => {
    console.log('[DB] Connected.');
    // Loading resolvers
    console.log('[OriginServer] Loading the resolvers and schemas.');
    const resolvers = [
      userResolvers,
      accessResolvers,
      configResolvers,
      allierhResolvers,
      contentsResolvers,
      menuResolvers,
      dashboardResolvers,
    ];
    const typeDefs = [
      rootSchema,
      userSchema,
      accessSchema,
      configSchema,
      allierhSchema,
      contentsSchema,
      menuSchema,
      dashboardSchema,
    ];
    const helpers = [accessHelpers, menuHelpers];
    // Cleaning before start
    if (config.cleanOnStart) {
      console.log('\n[OriginServer] DB cleaning actions.');
      let cleaningOps = 0;
      for (let helper of helpers) {
        if (typeof helper.cleanOnServerStart === 'function') {
          if (await helper.cleanOnServerStart()) {
            cleaningOps++;
            console.log(`[OriginServer] ${helper.name} is cleaned.`);
          }
        }
      }
      if (cleaningOps > 0) {
        console.log(`[OriginServer] ${cleaningOps} cleaning operation executed.`);
        console.log(`[OriginServer] DB cleaning is over.\n`);
      } else {
        console.log(`[OriginServer] No DB cleaning is required.\n`);
      }
    } else {
      console.log(`[OriginServer] DB cleaning is marked FALSE for [ ${config.env} ].`);
    }

    console.log('[OriginServer] Creating the ExpressJS server');
    const PORT =5000
    const app = express();

    // JWT requirements
    const jwt = require('express-jwt')
    const auth = jwt({
      secret: config.jwt_secret,
      credentialsRequired: false
    });

    // Creat Apollo Server
    console.log('[OriginServer] Creating the ApolloServer');
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: !config.frontend.serve,
      playground: !config.frontend.serve,
      uploads: {
        maxFileSize: 10000000, // 10 MB
        maxFiles: 20
      },
      context: ({
        req
      }) => ({
        user: req.user
      })
    });
    app.use(server.graphqlPath, auth);

    // CORS Policy
    var corsOptions = {
        origin: false
    };
    app.use(cors(corsOptions));
    console.log('[CORS] Origin policy: ' + corsOptions.origin);

    // Upload limits
    // TODO Set an ENV var
    app.use(bodyParser.json({
      limit: '50mb'
    }));
    app.use(bodyParser.urlencoded({
      limit: '10mb',
      extended: true
    }))

    // Make the upload folder public
    console.log(`[OriginServer] Serving static server folder at: ${path.join(__dirname, '../public')}`)
    app.use('/public', express.static(path.join(__dirname, '../public')));
    
    // Serve staticly the frondend
    console.log(`[OriginServer] Serving the front-end...`);
    if (config.frontend.serve) {
      console.log(`[OriginServer] Verify if the frond-end folder exists...`);
      const frontend_folder = path.join(__dirname, '../', config.frontend.folder);
      // Verify if the user folder exists
      if (!fs.existsSync(frontend_folder)) {
        console.log(`[OriginServer] The frond-end folder don't exist, we creat it.`);
        fs.mkdirSync(frontend_folder); // Creat the folder
        fs.closeSync(fs.openSync(path.join(frontend_folder, 'index.html'), 'a')); // Creat an index.html file
      }
      // Serve the static folder
      app.use('/', express.static(frontend_folder));
      app.get('/*', function (req, res) {
        res.sendFile(path.join(frontend_folder, 'index.html'));
      });
    } else {
      console.log(`[OriginServer] Config.frontend.serve is false. No front-end will be served.`);
    }
    

    // Apply Middleware
    server.applyMiddleware({
      app
    });

    // Listen to PORT
    app.listen({
        port: PORT,
        host: '0.0.0.0'
      }, () =>
      console.log(`[OriginServer] Server ready at PORT: ${PORT} | Endpoint: ${server.graphqlPath}\n`)
    )
  })
  .catch(err => {
    console.error('[DB] Unable to connect to the database:', err);
    console.log('[OriginServer] About to exit with code: 1');
    process.exit(1);
  });
