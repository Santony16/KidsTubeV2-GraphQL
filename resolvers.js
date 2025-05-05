const { Video, Playlist, RestrictedUser, User } = require('./models');
const fetch = require('node-fetch');
const mongoose = require('mongoose'); 
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
// Auth check helper
const checkAuth = (context) => {
  if (!context.user) {
    throw new Error('Authentication required. Please log in.');
  }
  return context.user;
};

const resolvers = {
  Query: {
    // Video queries
    videos: async (_, { userId, search }, context) => {
      // Only verify authentication if userId is provided
      if (userId) {
        checkAuth(context);
      }
      
      try {
        let query = {};
        
        // Filter by userId if provided
        if (userId) {
          query.userId = userId;
        }
        
        // Add search filter if provided
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ];
        }
        
        console.log('Executing Video.find() with query:', query);
        const videos = await Video.find(query).lean();
        console.log(`Found ${videos.length} videos`);
        
        return videos.map(video => ({
          id: video._id.toString(),
          name: video.name || '',
          url: video.url || '',
          description: video.description || '',
          userId: video.userId ? video.userId.toString() : ''
        }));
      } catch (error) {
        console.error('Error fetching videos:', error);
        throw new Error('Failed to fetch videos: ' + error.message);
      }
    },
    
    // Other protected queries - check authentication before proceeding
    video: async (_, { id }, context) => {
      checkAuth(context);
      try {
        const video = await Video.findById(id);
        
        if (!video) {
          throw new Error('Video not found');
        }
        
        return {
          id: video._id,
          name: video.name,
          url: video.url,
          description: video.description,
          userId: video.userId
        };
      } catch (error) {
        console.error('Error fetching video:', error);
        throw new Error('Failed to fetch video');
      }
    },
    
    playlists: async (_, { userId }, context) => {
      checkAuth(context);
      try {
        let query = {};
        
        if (userId) {
          query.parentUser = userId;
        }
        
        console.log('Executing Playlist.find() with query:', query);
        const playlists = await Playlist.find(query).lean();
        
        return playlists.map(playlist => ({
          id: playlist._id.toString(),
          name: playlist.name || '',
          profiles: playlist.profiles ? playlist.profiles.map(id => id.toString()) : [],
          parentUser: playlist.parentUser ? playlist.parentUser.toString() : ''
        })); 
      } catch (error) {
        console.error('Error fetching playlists:', error);
        throw new Error('Failed to fetch playlists: ' + error.message);
      }
    },
    
    playlist: async (_, { id }, context) => {
      checkAuth(context);
      try {
        const playlist = await Playlist.findById(id);
        
        if (!playlist) {
          throw new Error('Playlist not found');
        }
        
        return {
          id: playlist._id,
          name: playlist.name,
          profiles: playlist.profiles,
          parentUser: playlist.parentUser
        };
      } catch (error) {
        console.error('Error fetching playlist:', error);
        throw new Error('Failed to fetch playlist');
      }
    },
    
    playlistsByUser: async (_, { userId }, context) => {
      checkAuth(context);
      try {
        const playlists = await Playlist.find({ profiles: userId });
        
        return playlists.map(playlist => ({
          id: playlist._id,
          name: playlist.name,
          profiles: playlist.profiles,
          parentUser: playlist.parentUser
        }));
      } catch (error) {
        console.error('Error fetching user playlists:', error);
        throw new Error('Failed to fetch user playlists');
      }
    },
    
    restrictedUsers: async (_, { parentUserId }, context) => {
      console.log('Starting restrictedUsers query with parentUserId:', parentUserId);
      
      try {
        let userId = parentUserId;
        
        // If no parentUserId provided, try to get it from context
        if (!userId && context.user) {
          userId = context.user.id;
          console.log('Using user ID from context:', userId);
        }
        
        if (!userId) {
          throw new Error('Parent user ID is required');
        }
        
        console.log(`Fetching restricted users for parent ID: ${userId}`);
        
        // Use the imported RestrictedUser model directly without mongoose reference
        const restrictedUsers = await RestrictedUser.find({ 
          parentUser: userId 
        }).lean().exec();
        
        console.log(`Found ${restrictedUsers.length} restricted users`);
        
        // Format the response to match the schema
        return restrictedUsers.map(user => ({
          id: user._id.toString(),
          name: user.name || '',
          avatar: user.avatar || 'default.png',
          parentUser: user.parentUser ? user.parentUser.toString() : ''
        }));
      } catch (error) {
        console.error('Error in restrictedUsers resolver:', error);
        throw new Error(`Error al obtener usuarios restringidos: ${error.message}`);
      }
    },
    
    restrictedUser: async (_, { id }, context) => {
      checkAuth(context);
      try {
        const user = await RestrictedUser.findById(id);
        
        if (!user) {
          throw new Error('User not found');
        }
        
        return {
          id: user._id,
          name: user.name,
          avatar: user.avatar,
          parentUser: user.parentUser
        };
      } catch (error) {
        console.error('Error fetching restricted user:', error);
        throw new Error('Failed to fetch restricted user');
      }
    },
    
    // Get current user info from token
    me: (_, __, context) => {
      const user = checkAuth(context);
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      };
    },
    
    countries: async () => {
      try {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/countries`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch countries: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching countries:', error);
        throw new Error('Failed to fetch countries');
      }
    },

    // YouTube search resolver
    youtubeSearch: async (_, { query }, context) => {
      try {
        if (!query || query.trim() === '') {
          throw new Error('Search query is required');
        }
        
        console.log(`Searching YouTube for: "${query}"`);
        
        // Ensure environment variable is loaded correctly
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        
        // Validate API key existence
        if (!YOUTUBE_API_KEY) {
          console.error('CRITICAL ERROR: YouTube API key not found in environment variables');
          throw new Error('YouTube API configuration error');
        }
        
        console.log(`API Key verification: ${YOUTUBE_API_KEY ? 'Present' : 'Missing'}`);
        
        // Properly encode query parameters to prevent URL formatting issues
        const encodedQuery = encodeURIComponent(query.trim());
        
        // Build API URL with all required parameters
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=9&q=${encodedQuery}&type=video&key=${YOUTUBE_API_KEY}`;
        
        console.log(`Requesting YouTube API at: ${apiUrl.replace(YOUTUBE_API_KEY, 'KEY_HIDDEN')}`);
        
        // Make request with proper error handling
        const response = await fetch(apiUrl);
        
        // If error, try to get detailed error message
        if (!response.ok) {
          const errorText = await response.text();
          let parsedError;
          
          try {
            parsedError = JSON.parse(errorText);
            console.error('YouTube API detailed error:', parsedError);
            
            // Check for common error codes
            if (parsedError.error && parsedError.error.code === 403) {
              throw new Error('YouTube API key unauthorized or quota exceeded');
            } else if (parsedError.error && parsedError.error.code === 400) {
              throw new Error(`YouTube API request error: ${parsedError.error.message || 'Invalid request parameters'}`);
            }
            
            throw new Error(`YouTube API error (${response.status}): ${parsedError.error?.message || 'Unknown error'}`);
          } catch (jsonError) {
            console.error('Non-JSON YouTube API error response:', errorText);
            throw new Error(`YouTube API error: ${response.status}`);
          }
        }
        
        const data = await response.json();
        console.log(`YouTube search returned ${data.items?.length || 0} results`);
        
        // Validate response structure before transforming
        if (!data.items || !Array.isArray(data.items)) {
          console.error('Unexpected YouTube API response format:', data);
          throw new Error('Invalid YouTube API response format');
        }
        
        // Transform YouTube API response to match our GraphQL schema
        return data.items.map(item => ({
          id: item.id?.videoId || '',
          title: item.snippet?.title || '',
          description: item.snippet?.description || '',
          thumbnailUrl: item.snippet?.thumbnails?.medium?.url || '',
          channelTitle: item.snippet?.channelTitle || '',
          publishedAt: item.snippet?.publishedAt || ''
        }));
      } catch (error) {
        console.error('Error in YouTube search resolver:', error);
        throw new Error(`Failed to search YouTube: ${error.message}`);
      }
    }
  },
  
  // Playlist resolver for videos field
  Playlist: {
    videos: async (parent, _, context) => {
      // Check authentication
      checkAuth(context);
      
      try {
        if (!parent.id) return [];
        
        console.log(`Fetching videos for playlist: ${parent.id}`);
        const playlist = await Playlist.findById(parent.id).lean();
        
        if (!playlist || !playlist.videos || !playlist.videos.length) {
          return [];
        }
        
        const videos = await Video.find({
          _id: { $in: playlist.videos }
        }).lean();
        
        return videos.map(video => ({
          id: video._id.toString(),
          name: video.name || '',
          url: video.url || '',
          description: video.description || '',
          userId: video.userId ? video.userId.toString() : ''
        }));
      } catch (error) {
        console.error('Error fetching playlist videos:', error);
        return [];
      }
    }
  }
};

module.exports = resolvers;
