// models/Song.js

const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  songName: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    default: 'Unknown Artist'
  },
  filePath: {
    type: String,
    required: true
  },
  coverPath: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Song', songSchema);