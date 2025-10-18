// javascript.js (FINAL VERSION with Home Page, Search, and Enhanced Controls)

console.log("Welcome to Spotify");

// --- Initialize Variables ---
let currentSongIndex = -1;
let allSongs = []; // Holds all songs for searching and playing
let audioElement = new Audio();
const serverUrl = 'https://spotify-backend-sudhir314.onrender.com/';

// --- UI Elements ---
const searchInput = document.getElementById('searchInput');
const homeSections = document.getElementById('home-sections');
const searchResultsSection = document.getElementById('search-results-section');
const searchResultsContainer = document.getElementById('search-results-container');
const featuredContainer = document.getElementById('featured-songs');
const recentContainer = document.getElementById('recent-songs');

// Player UI Elements
const masterPlay = document.getElementById('masterPlay');
const myProgressBar = document.getElementById('myProgressBar');
const gif = document.getElementById('gif');
const songInfoText = document.querySelector(".songinfo span");
const currentTimeDisplay = document.getElementById('current-time');
const totalDurationDisplay = document.getElementById('total-duration');

// --- HELPER FUNCTION: Format Time ---
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) { return "00:00"; }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// --- DATA FETCHING & RENDERING ---
async function loadHomePage() {
  try {
    // We fetch all songs at once for the search, and also the specific categories
    const [recentRes, featuredRes, allRes] = await Promise.all([
      fetch(`${serverUrl}api/songs/recent`),
      fetch(`${serverUrl}api/songs/featured`),
      fetch(`${serverUrl}api/songs`) // This gets all songs for the search functionality
    ]);

    if (!recentRes.ok || !featuredRes.ok || !allRes.ok) {
        throw new Error('Failed to fetch song data');
    }

    const recentSongs = await recentRes.json();
    const featuredSongs = await featuredRes.json();
    allSongs = await allRes.json(); // Store all songs in our main global array

    // Render the home page sections
    renderSection(featuredSongs, featuredContainer);
    renderSection(recentSongs, recentContainer);
    
    // Load the first song into the player if available
    if (allSongs.length > 0) {
        loadInitialSong(allSongs[0]);
    } else {
        songInfoText.innerText = "No songs in library"; // Handle empty library
    }
  } catch (error) {
    console.error("Failed to load home page:", error);
    // Display error message in relevant containers
    if(featuredContainer) featuredContainer.innerHTML = "<p style='color: white;'>Could not load featured songs.</p>";
    if(recentContainer) recentContainer.innerHTML = "<p style='color: white;'>Could not load recent songs.</p>";
  }
}

// Renders a list of songs into a specified container using song cards
function renderSection(songs, container) {
  if (!container) {
      console.error("Target container not found for rendering");
      return; // Exit if the container doesn't exist
  }
  container.innerHTML = ''; // Clear previous content
  if (!songs || songs.length === 0) {
      container.innerHTML = "<p style='color: #b3b3b3; font-style: italic;'>No songs found.</p>"; // More generic message
      return;
  }
  songs.forEach(song => {
    // Ensure coverPath exists and is a full URL (Cloudinary URLs start with http)
    const coverArt = song.coverPath && song.coverPath.startsWith('http') ? song.coverPath : 'logo.png'; // Fallback image
    container.innerHTML += `
      <div class="song-card" data-song-id="${song._id}">
        <img src="${coverArt}" alt="${song.songName}">
        <div class="song-card-title">${song.songName}</div>
        <div class="song-card-artist">${song.artist || 'Unknown Artist'}</div>
      </div>
    `;
  });
  addCardClickListeners(); // Make sure new cards are clickable
}

// --- SEARCH LOGIC ---
if (searchInput) { // Check if search input exists before adding listener
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (query.length > 0) {
            if(homeSections) homeSections.classList.add('hidden'); // Hide the home categories
            if(searchResultsSection) searchResultsSection.classList.remove('hidden'); // Show the search results section

            // Filter all songs based on query
            const searchResults = allSongs.filter(song =>
                song.songName.toLowerCase().includes(query) ||
                (song.artist && song.artist.toLowerCase().includes(query))
            );

            // Display the filtered songs
            renderSection(searchResults, searchResultsContainer);
        } else {
            if(homeSections) homeSections.classList.remove('hidden'); // Show the home categories again
            if(searchResultsSection) searchResultsSection.classList.add('hidden'); // Hide the search results
        }
    });
}

// --- PLAYER LOGIC ---
function addCardClickListeners() {
  document.querySelectorAll('.song-card').forEach(card => {
    card.addEventListener('click', () => {
      const songId = card.getAttribute('data-song-id');
      const songIndex = allSongs.findIndex(song => song._id === songId);
      if (songIndex !== -1) playSong(songIndex);
    });
  });
}

function playSong(index) {
  if (index < 0 || index >= allSongs.length) return; // Basic validation
  currentSongIndex = index;
  const song = allSongs[currentSongIndex];

  audioElement.src = song.filePath; // Set the audio source (should be full Cloudinary URL)
  songInfoText.innerText = song.songName; // Update song title in player
  audioElement.currentTime = 0; // Reset playback time
  
  // Attempt to play, handle potential errors
  audioElement.play().catch(error => console.error("Error playing audio:", error)); 

  gif.style.opacity = 1; // Show playing animation
  masterPlay.classList.replace("fa-circle-play", "fa-circle-pause"); // Update play/pause button icon
}

// Loads initial song metadata into the player UI but doesn't play
function loadInitialSong(song) {
    if (!song) return; // Exit if no song provided
    audioElement.src = song.filePath;
    songInfoText.innerText = song.songName;
    gif.style.opacity = 0; // Keep GIF hidden initially
    // Update total duration once metadata is loaded
    audioElement.addEventListener('loadedmetadata', () => {
        if(totalDurationDisplay) totalDurationDisplay.innerText = formatTime(audioElement.duration);
    }, { once: true }); // Ensure this listener runs only once per song load
}

// Main Play/Pause Button
if(masterPlay) {
    masterPlay.addEventListener('click', () => {
        if (!audioElement.src || currentSongIndex === -1) return; // Do nothing if no song is loaded
        if (audioElement.paused || audioElement.currentTime <= 0) {
            audioElement.play().catch(error => console.error("Error playing audio:", error));
            masterPlay.classList.replace("fa-circle-play", "fa-circle-pause");
            gif.style.opacity = 1;
        } else {
            audioElement.pause();
            masterPlay.classList.replace("fa-circle-pause", "fa-circle-play");
            gif.style.opacity = 0;
        }
    });
}

// Progress Bar and Timers Update
audioElement.addEventListener('timeupdate', () => {
    if (audioElement.duration) {
        const progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
        if(myProgressBar) myProgressBar.value = progressPercent;
        if(currentTimeDisplay) currentTimeDisplay.innerText = formatTime(audioElement.currentTime);
        // Only update total duration if it hasn't been set yet
        if (totalDurationDisplay && (totalDurationDisplay.innerText === '00:00' || !audioElement.duration)) {
             totalDurationDisplay.innerText = formatTime(audioElement.duration);
        }
    }
});

// Seek Functionality
if(myProgressBar) {
    myProgressBar.addEventListener('input', () => {
        if (audioElement.duration) {
            audioElement.currentTime = (myProgressBar.value / 100) * audioElement.duration;
        }
    });
}

// Next Button
const nextBtn = document.getElementById("next");
if(nextBtn) {
    nextBtn.addEventListener("click", () => {
        if (allSongs.length === 0) return;
        const newIndex = (currentSongIndex + 1) % allSongs.length;
        playSong(newIndex);
    });
}

// Previous Button
const prevBtn = document.getElementById("previous");
if(prevBtn) {
    prevBtn.addEventListener("click", () => {
        if (allSongs.length === 0) return;
        const newIndex = (currentSongIndex - 1 + allSongs.length) % allSongs.length;
        playSong(newIndex);
    });
}

// Enhanced Player Controls
const rewind10Btn = document.getElementById('rewind10');
const forward10Btn = document.getElementById('forward10');
const muteToggleBtn = document.getElementById('muteToggle');
const volumeControl = document.getElementById('volumeControl');

if(rewind10Btn) {
    rewind10Btn.addEventListener('click', () => {
        if(audioElement.src) audioElement.currentTime = Math.max(0, audioElement.currentTime - 10);
    });
}
if(forward10Btn) {
    forward10Btn.addEventListener('click', () => {
        if(audioElement.src) audioElement.currentTime = Math.min(audioElement.duration || 0, audioElement.currentTime + 10);
    });
}
if(muteToggleBtn) {
    muteToggleBtn.addEventListener('click', () => {
        audioElement.muted = !audioElement.muted;
        // Update icon and potentially the slider
        if (audioElement.muted) {
            muteToggleBtn.classList.replace('fa-volume-high', 'fa-volume-xmark');
            if (volumeControl) volumeControl.value = 0; // Visually set slider to 0
        } else {
            muteToggleBtn.classList.replace('fa-volume-xmark', 'fa-volume-high');
            if (volumeControl) volumeControl.value = audioElement.volume; // Restore slider
        }
    });
}
if(volumeControl) {
    volumeControl.addEventListener('input', () => {
        audioElement.volume = volumeControl.value;
        audioElement.muted = (audioElement.volume === 0); // Mute if volume is 0
        // Update mute icon accordingly
        if (audioElement.muted || audioElement.volume === 0) {
            if(muteToggleBtn) muteToggleBtn.classList.replace('fa-volume-high', 'fa-volume-xmark');
        } else {
            if(muteToggleBtn) muteToggleBtn.classList.replace('fa-volume-xmark', 'fa-volume-high');
        }
    });
}
// Sync mute button if volume changes externally or on load
audioElement.addEventListener('volumechange', () => {
    if(volumeControl) volumeControl.value = audioElement.volume; // Keep slider synced
    if (audioElement.muted || audioElement.volume === 0) {
        if(muteToggleBtn) muteToggleBtn.classList.replace('fa-volume-high', 'fa-volume-xmark');
    } else {
        if(muteToggleBtn) muteToggleBtn.classList.replace('fa-volume-xmark', 'fa-volume-high');
    }
});

// --- Start Everything When Page Loads ---
document.addEventListener('DOMContentLoaded', loadHomePage);