const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Load environment variables
require('dotenv').config();

// Check critical environment variables
if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI environment variable not defined');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not defined, using insecure default');
  process.env.JWT_SECRET = 'development-jwt-secret-DO-NOT-USE-IN-PRODUCTION';
}

// Set global Mongoose options
mongoose.set('strictQuery', false);

async function startApolloServer() {
  // Create Express app
  const app = express();
  
  // Configure CORS properly
  const corsOptions = {
    origin: ['http://localhost:8081', 'http://127.0.0.1:8081'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin', 
      'X-Requested-With', 
      'Content-Type', 
      'Accept', 
      'Authorization',
      'Cache-Control', 
      'Pragma',
      'Expires'
    ],
    credentials: true,
    optionsSuccessStatus: 200
  };
  
  // Apply CORS before ApolloServer setup
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  
  // Improved MongoDB connection with proper options
  console.log('Connecting to MongoDB using environment variables...');
  
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected successfully');
    
    // Log available collections to verify connection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections available:', collections.map(c => c.name).join(', '));
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit if connection fails
  }
  
  // Create Apollo server after establishing connection
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Get token from header
      const token = req.headers.authorization || '';
      
      if (token.startsWith('Bearer ')) {
        try {
          const jwtToken = token.substring(7);
          const user = jwt.verify(jwtToken, process.env.JWT_SECRET);
          return { user };
        } catch (err) {
          console.error('JWT verification error:', err.message);
        }
      }
      
      return {};
    },
    formatError: (error) => {
      console.error('GraphQL error:', error);
      return error;
    },
    introspection: true,
    playground: true,
  });
  
  await server.start();
  
  server.applyMiddleware({ 
    app,
    path: '/',
    cors: false
  });
  
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`GraphQL server running at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startApolloServer().catch(err => {
  console.error('Error starting GraphQL server:', err);
  process.exit(1);
});
