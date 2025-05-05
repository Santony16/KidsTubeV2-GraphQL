const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  description: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { collection: 'videos' });

const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  profiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RestrictedUser' }],
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  parentUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { collection: 'playlists' });

const restrictedUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: String,
  parentUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pin: String
}, { collection: 'restrictedusers' });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: String,
  password: String,
  pin: String,
  status: String,
  country: String
}, { collection: 'users' });

const Video = mongoose.model('Video', videoSchema);
const Playlist = mongoose.model('Playlist', playlistSchema);
const RestrictedUser = mongoose.model('RestrictedUser', restrictedUserSchema);
const User = mongoose.model('User', userSchema);

module.exports = {
  Video,
  Playlist,
  RestrictedUser,
  User
};
