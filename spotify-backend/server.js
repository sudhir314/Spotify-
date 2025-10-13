 // Importing all required dependencies
const express = require('express');       // Web framework for handling routes and requests
const mongoose = require('mongoose');     // For connecting and interacting with MongoDB
const cors = require('cors');             // To allow cross-origin requests (important for frontend-backend connection)
const multer = require('multer');         // For handling file uploads (like songs and cover images)
const path = require('path');             // To handle file paths easily
const fs = require('fs');                 // For file system operations (like deleting files)
const Song = require('./models/Song');    // Importing the Song model from the models folder

// Creating an Express app instance
const app = express();

// Defining the port number (you can change it if needed)
const PORT = 3000;

// -------------------------------
// MIDDLEWARE SETUP
// -------------------------------

app.use(cors());                // Enables CORS so frontend can call backend APIs
app.use(express.json());        // Parses incoming JSON request bodies
app.use(express.static('public')); // Serves static files (songs, covers, etc.) from the "public" folder

// -------------------------------
// DATABASE CONNECTION (MONGODB)
// -------------------------------

mongoose.connect('mongodb://localhost:27017/spotifyclone', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected successfully.'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// -------------------------------
// FILE UPLOAD SETUP (MULTER)
// -------------------------------

// Storage configuration for uploaded files
const storage = multer.diskStorage({
  // Destination folder based on the field name
  destination: (req, file, cb) => {
    if (file.fieldname === 'songFile') {
      cb(null, 'public/songs/'); // Save songs inside "public/songs"
    } else if (file.fieldname === 'coverFile') {
      cb(null, 'public/covers/'); // Save cover images inside "public/covers"
    } else {
      cb(new Error('Invalid file field'), null); // Error if unknown field
    }
  },

  // Naming uploaded files (using timestamp to avoid duplicates)
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Initialize multer with the above storage settings
const upload = multer({ storage });

// -------------------------------
// API ROUTES
// -------------------------------

// ✅ Route 1: Get all songs from the database
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await Song.find();     // Fetch all songs
    res.json(songs);                     // Send them as JSON
  } catch (err) {
    res.status(500).json({ message: err.message }); // Send error if something fails
  }
});

// ✅ Route 2: Upload a new song (with cover image)
app.post('/api/upload', upload.fields([{ name: 'songFile' }, { name: 'coverFile' }]), async (req, res) => {
  try {
    // Extract song info from the request body
    const { songName, artist } = req.body;

    // Ensure both song and cover are uploaded
    if (!req.files.songFile || !req.files.coverFile) {
      return res.status(400).json({ message: 'Both song and cover files are required.' });
    }

    // Build file paths to store in MongoDB
    const filePath = `songs/${req.files.songFile[0].filename}`;
    const coverPath = `covers/${req.files.coverFile[0].filename}`;

    // Create a new song document
    const newSong = new Song({
      songName,
      artist,
      filePath,
      coverPath
    });

    // Save song data to MongoDB
    const savedSong = await newSong.save();

    // Send success response
    res.status(201).json(savedSong);
  } catch (err) {
    console.error('Error uploading song:', err);
    res.status(500).json({ message: 'Error uploading song' });
  }
});

// ✅ Route 3: Delete a song by its ID
app.delete('/api/songs/:id', async (req, res) => {
  try {
    // Find the song in MongoDB by ID
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Build full file paths for deletion
    const songPath = path.join(__dirname, 'public', song.filePath);
    const coverPath = path.join(__dirname, 'public', song.coverPath);

    // Delete files safely (won’t crash if file doesn’t exist)
    [songPath, coverPath].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlink(file, (err) => {
          if (err) console.error(`Error deleting file: ${file}`, err.message);
        });
      }
    });

    // Delete song entry from MongoDB
    await Song.findByIdAndDelete(req.params.id);

    // Send success message
    res.json({ message: '✅ Song deleted successfully' });
  } catch (err) {
    console.error('Error deleting song:', err);
    res.status(500).json({ message: '❌ Failed to delete song from server' });
  }
});

// -------------------------------
// START THE SERVER
// -------------------------------

app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});
