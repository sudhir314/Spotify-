// Importing all required dependencies
const express = require('express');      // Web framework for handling routes and requests
const mongoose = require('mongoose');    // For connecting and interacting with MongoDB
const cors = require('cors');            // To allow cross-origin requests (important for frontend-backend connection)
const multer = require('multer');        // For handling file uploads (like songs and cover images)
const path = require('path');            // To handle file paths easily
const fs = require('fs');                // For file system operations (like deleting files)
const Song = require('./models/Song');   // Importing the Song model from the models folder

// Creating an Express app instance
const app = express();

// Defining the port number for the server to run on
const PORT = 3000;

// -------------------------------
// MIDDLEWARE SETUP
// -------------------------------

app.use(cors());               // Enables CORS so your frontend can call the backend APIs
app.use(express.json());       // Parses incoming JSON request bodies
app.use(express.static('public')); // Serves static files (songs, covers, etc.) from the "public" folder

// -------------------------------
// DATABASE CONNECTION (MONGODB)
// -------------------------------

mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// A more robust way to listen for database connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});
mongoose.connection.once('open', () => {
  console.log('MongoDB connected successfully.');
});

// -------------------------------
// FILE UPLOAD SETUP (MULTER)
// -------------------------------

// Storage configuration for how to save uploaded files
const storage = multer.diskStorage({
  // Sets the destination folder based on the file type
  destination: (req, file, cb) => {
    if (file.fieldname === 'songFile') {
      cb(null, 'public/songs/'); // Save songs inside "public/songs"
    } else if (file.fieldname === 'coverFile') {
      cb(null, 'public/covers/'); // Save cover images inside "public/covers"
    }
  },

  // Sets the filename to be the original name
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

// Initialize multer with the storage settings
const upload = multer({ storage: storage });

// -------------------------------
// API ROUTES
// -------------------------------

// ✅ Route 1: Get all songs from the database
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await Song.find(); // Fetch all songs from the 'songs' collection
    res.json(songs);                 // Send the list of songs back as JSON
  } catch (err) {
    res.status(500).json({ message: err.message }); // Send an error if something fails
  }
});

// ✅ Route 2: Upload a new song (with a cover image)
app.post('/api/upload', upload.fields([{ name: 'songFile' }, { name: 'coverFile' }]), async (req, res) => {
  const { songName, artist } = req.body;
  const filePath = `songs/${req.files.songFile[0].filename}`;
  const coverPath = `covers/${req.files.coverFile[0].filename}`;

  const newSong = new Song({
    songName,
    artist,
    filePath,
    coverPath
  });

  try {
    const savedSong = await newSong.save(); // Save the new song's data to MongoDB
    res.status(201).json(savedSong);        // Send a success response with the new song's data
  } catch (err) {
    res.status(400).json({ message: err.message }); // Send an error if saving fails
  }
});

// ✅ Route 3: Delete a song by its ID
app.delete('/api/songs/:id', async (req, res) => {
  try {
    const songId = req.params.id;
    const deletedSong = await Song.findByIdAndDelete(songId); // Find and delete the song from MongoDB

    if (!deletedSong) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // This code, which caused crashes on Render, is now removed.
    // The server will no longer try to delete physical files, only the database entry.

    res.json({ message: 'Song deleted successfully' }); // Send a success message
  } catch (err) {
    res.status(500).json({ message: err.message }); // Send an error if something fails
  }
});


// -------------------------------
// START THE SERVER
// -------------------------------

app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});