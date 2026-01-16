// server.js - PROFESSIONAL & SECURE VERSION
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Song = require('./models/Song');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Configure Cloudinary ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static('public')); 

// --- MongoDB Connection ---
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('✅ MongoDB connected successfully.'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- File Upload Setup ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'spotify_songs',
    allowed_formats: ['mp3', 'jpeg', 'png', 'jpg'],
    resource_type: 'auto'
  }
});
const upload = multer({ storage: storage });

// --- SECURITY MIDDLEWARE (THE FIX) ---
// This function acts as a guard. It checks the password before allowing access.
const verifyAdmin = (req, res, next) => {
    const password = req.headers['x-admin-password'];
    if (password === process.env.ADMIN_PASSWORD) {
        next(); // Password correct, proceed
    } else {
        res.status(403).json({ message: "⛔ Access Denied: Incorrect Password" });
    }
};

// --- API Routes ---

// 1. GET all songs (Public)
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await Song.find();
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. GET Featured (Public)
app.get('/api/songs/featured', async (req, res) => {
    try {
        const songs = await Song.find({isFeatured: true}).limit(6);
        res.json(songs);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. GET Recent (Public)
app.get('/api/songs/recent', async (req, res) => {
    try {
        const songs = await Song.find().sort({ createdAt: -1 }).limit(6);
        res.json(songs);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 4. SEARCH (Public)
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q; 
    if (!query) return res.status(400).json({ message: "No search query" });
    const searchResults = await Song.find({
      $or: [
        { songName: { $regex: query, $options: 'i' } }, 
        { artist: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(searchResults); 
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 5. UPLOAD (LOCKED 🔒)
// We add 'verifyAdmin' here to protect the route
app.post('/api/upload', verifyAdmin, upload.fields([{ name: 'songFile' }, { name: 'coverFile' }]), async (req, res) => {
  try {
    if (!req.files || !req.files.songFile || !req.files.coverFile) {
        return res.status(400).json({ message: "Files missing" });
    }
    const { songName, artist, isFeatured } = req.body;
    
    const newSong = new Song({ 
        songName, 
        artist, 
        filePath: req.files.songFile[0].path, 
        coverPath: req.files.coverFile[0].path,
        isFeatured: isFeatured === 'true' 
    });

    const savedSong = await newSong.save();
    res.status(201).json(savedSong);
  } catch (err) {
     console.error("Error during upload:", err);
     res.status(400).json({ message: "Upload failed" });
  }
});

// 6. DELETE (LOCKED 🔒)
app.delete('/api/songs/:id', verifyAdmin, async (req, res) => {
  try {
    const deletedSong = await Song.findByIdAndDelete(req.params.id);
    if (!deletedSong) return res.status(404).json({ message: 'Song not found' });
    res.json({ message: 'Song deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});