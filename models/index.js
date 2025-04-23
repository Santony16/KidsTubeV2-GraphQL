const mongoose = require('mongoose');

// Creating simplified references to existing collections
// This connects to the same MongoDB collections without duplicating schema logic
const Video = mongoose.model('Video', new mongoose.Schema({}), 'videos');
const Playlist = mongoose.model('Playlist', new mongoose.Schema({}), 'playlists');
const RestrictedUser = mongoose.model('RestrictedUser', new mongoose.Schema({}), 'restrictedusers');
const User = mongoose.model('User', new mongoose.Schema({}), 'users');

module.exports = {
  Video,
  Playlist,
  RestrictedUser,
  User
};
