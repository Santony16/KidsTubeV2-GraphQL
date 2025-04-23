const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
require('dotenv').config();

// Configurar variables de entorno explícitamente
process.env.JWT_SECRET = process.env.JWT_SECRET || 'kidstube-secret-key';
process.env.BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8081'; // Updated frontend port

// Import models from your existing backend
const Video = require('../KidsTubeV2-Backend/models/Video');
const Playlist = require('../KidsTubeV2-Backend/models/Playlist');
const RestrictedUser = require('../KidsTubeV2-Backend/models/RestrictedUser');
const User = require('../KidsTubeV2-Backend/models/User');

// JWT Secret - should match the one in REST API
const JWT_SECRET = process.env.JWT_SECRET;

// Connect to MongoDB (same connection string as your REST API)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://anthonysancho41:Josuesb2004@workshops711.bu5kg.mongodb.net/");
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

async function startServer() {
  const app = express();
  
  // Apply CORS middleware
  app.use(cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Create Apollo Server with auth context
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Get the user token from the headers
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      // Try to verify the token and get user info
      let user = null;
      if (token) {
        try {
          user = jwt.verify(token, JWT_SECRET);
        } catch (error) {
          console.error('JWT verification failed:', error.message);
        }
      }
      
      // Add the user and token to the context
      return { 
        user,
        token,
        req
      };
    },
  });
  
  await server.start();
  
  // Apply Apollo middleware to Express
  server.applyMiddleware({ app });
  
  // Connect to database
  await connectDB();
  
  // Start server
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`KidsTube GraphQL API running on port ${PORT}`);
    console.log(`GraphQL endpoint available at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer().catch(err => {
  console.error('Error starting server:', err);
});
