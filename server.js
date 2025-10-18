 // server.js (FINAL VERSION with CLOUDINARY)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Song = require('./models/Song');

const app = express();
const PORT = 3000;

// --- Configure Cloudinary using secret keys from Render ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.connection.on('error', err => console.error('MongoDB connection error:', err));
mongoose.connection.once('open', () => console.log('MongoDB connected successfully.'));

// --- File Upload Setup (Multer with Cloudinary) ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'spotify_songs', // A folder name in your Cloudinary account
    allowed_formats: ['mp3', 'jpeg', 'png', 'jpg'],
    resource_type: 'auto' // Automatically detect if it's an image or audio
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

// POST a new song (sends files to Cloudinary)
app.post('/api/upload', upload.fields([{ name: 'songFile' }, { name: 'coverFile' }]), async (req, res) => {
  try {
    const { songName, artist } = req.body;
    // Get the permanent, secure URLs from Cloudinary's response
    const filePath = req.files.songFile[0].path;
    const coverPath = req.files.coverFile[0].path;

    const newSong = new Song({ songName, artist, filePath, coverPath });
    const savedSong = await newSong.save();
    res.status(201).json(savedSong);
  } catch (err) {
      console.error("Error during upload:", err);
      res.status(400).json({ message: "Upload failed, please check server logs." });
  }
});

// DELETE a song by its ID
app.delete('/api/songs/:id', async (req, res) => {
  try {
    const songId = req.params.id;
    const deletedSong = await Song.findByIdAndDelete(songId);

    if (!deletedSong) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    res.json({ message: 'Song deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});
 