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
  },
  // Flag to determine if this song appears in the "Featured" section
  isFeatured: {
    type: Boolean,
    default: false
  }
}, { timestamps: true }); // Automatically adds 'createdAt' and 'updatedAt'

module.exports = mongoose.model('Song', songSchema);