const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Video {
    id: ID!
    name: String!
    url: String!
    description: String
    userId: ID!
  }

  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    phone: String!
    country: String
    status: String!
  }

  type RestrictedUser {
    id: ID!
    name: String!
    avatar: String
    parentUser: ID!
  }

  type Playlist {
    id: ID!
    name: String!
    profiles: [ID]!
    videos: [Video]
    parentUser: ID!
  }
  
  type AuthPayload {
    token: String
    userId: ID
    requiresVerification: Boolean
    isNewUser: Boolean
    message: String!
    user: User
  }

  type Country {
    code: String!
    name: String!
    dialCode: String!
    flag: String
  }

  # YouTube search result type
  type YouTubeSearchResult {
    id: String!
    title: String!
    description: String
    thumbnailUrl: String
    channelTitle: String
    publishedAt: String
  }

  type Query {
    # Video queries (protected, require authentication)
    videos(userId: ID, search: String): [Video]
    video(id: ID!): Video
    
    # Playlist queries (protected)
    playlists(userId: ID): [Playlist]
    playlist(id: ID!): Playlist
    playlistsByUser(userId: ID!): [Playlist]
    
    # User queries (protected)
    restrictedUsers(parentUserId: ID): [RestrictedUser]
    restrictedUser(id: ID!): RestrictedUser
    
    # Current user info (from token)
    me: User
    
    # Utility queries (some can be public)
    countries: [Country]
    
    # YouTube search query
    youtubeSearch(query: String!): [YouTubeSearchResult]
  }
`;

module.exports = typeDefs;
