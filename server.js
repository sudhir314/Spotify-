// server.js (FINAL CORRECTED VERSION)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Song = require('./models/Song');

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- MongoDB Connection ---
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});
mongoose.connection.once('open', () => {
  console.log('MongoDB connected successfully.');
});

// --- File Upload Setup (Multer) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'songFile') {
      cb(null, 'public/songs/');
    } else if (file.fieldname === 'coverFile') {
      cb(null, 'public/covers/');
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// --- API Routes ---

// GET all songs
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await Song.find();
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new song
app.post('/api/upload', upload.fields([{ name: 'songFile' }, { name: 'coverFile' }]), async (req, res) => {
  const { songName, artist } = req.body;
  const filePath = `songs/${req.files.songFile[0].filename}`;
  const coverPath = `covers/${req.files.coverFile[0].filename}`;

  const newSong = new Song({ songName, artist, filePath, coverPath });

  try {
    const savedSong = await newSong.save();
    res.status(201).json(savedSong);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a song by its ID (CORRECTED LOGIC)
app.delete('/api/songs/:id', async (req, res) => {
  try {
    const songId = req.params.id;
    const deletedSong = await Song.findByIdAndDelete(songId); // Find and delete from MongoDB

    if (!deletedSong) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // The code that tried to delete physical files (and caused the crash) is removed.
    // This is the correct fix for Render's temporary file system.

    res.json({ message: 'Song deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});