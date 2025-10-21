// javascript.js (WITH BACKEND SEARCH + PLAYER FIXES)

console.log("Welcome to Spotify");

// --- Initialize Variables ---
let songIndex = 0;
let audioElement = new Audio();
let masterPlay = document.getElementById('masterPlay');
let myProgressBar = document.getElementById('myProgressBar');
let gif = document.getElementById('gif');
let songInfoText = document.querySelector(".songinfo span");
const songItemContainer = document.querySelector(".songitemcontainer");
const serverUrl = 'https://spotify-backend-sudhir314.onrender.com/';

const currentTimeDisplay = document.getElementById('current-time');
const totalDurationDisplay = document.getElementById('total-duration');

let songs = []; // This will hold ALL songs from the database
let currentPlaylist = []; // This will hold the songs CURRENTLY being shown (all songs, or search results)

// --- HELPER FUNCTION: Format Time ---
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) { return "00:00"; }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// --- DATA FETCHING & RENDERING ---
async function getSongs() {
    try {
        const response = await fetch(`${serverUrl}api/songs`);
        songs = await response.json(); // Store all songs
        currentPlaylist = songs; // Initially, the playlist is ALL songs
        
        renderSongList(currentPlaylist); // Render the full list
        loadInitialSong();
        updateAllSongDurations();
    } catch (error) {
        console.error("Failed to fetch songs:", error);
        songItemContainer.innerHTML = "<p style='color: white;'>Could not load songs. Is the server running?</p>";
    }
}

// **MODIFIED** - Now renders any list of songs you give it
function renderSongList(songsToRender) { 
    songItemContainer.innerHTML = '';
    songsToRender.forEach((song, index) => {
        songItemContainer.innerHTML += `
        <div class="songitem">
            <img src="${song.coverPath}" alt="${song.songName}">
            <span class="songName">${song.songName}</span>
            <span class="timestamp">
                <span class="song-duration">00:00</span>
                <i id="${index}" class="fa-solid fa-circle-play songItemPlay"></i>
            </span>
        </div>`;
    });
    addPlayButtonListeners(); // Re-add listeners for these new buttons
}

// This function is now smart enough to read from the current filtered list
function updateAllSongDurations() {
    // 1. Get all the duration elements *currently* on the page
    const durationElements = document.querySelectorAll('.song-duration');

    // 2. Loop over those elements
    durationElements.forEach((element, index) => {
        // 3. Get the matching song from the 'currentPlaylist'
        const song = currentPlaylist[index];

        // 4. Check if the song exists (it always should)
        if (song) {
            const tempAudio = new Audio();
            tempAudio.src = song.filePath;
            // 5. When the song data is loaded, update its text
            tempAudio.addEventListener('loadedmetadata', () => {
                element.innerText = formatTime(tempAudio.duration);
            });
        }
    });
}

// --- PLAYER LOGIC ---
// **MODIFIED** - Now uses currentPlaylist
function loadInitialSong() {
    if (songs.length > 0) {
        currentPlaylist = songs; // Set playlist on load
        audioElement.src = currentPlaylist[0].filePath;
        songInfoText.innerText = currentPlaylist[0].songName;
        gif.style.opacity = 0;
    } else {
        songInfoText.innerText = "No songs in library";
    }
}

// **MODIFIED** - Now uses currentPlaylist
function playSong(index) {
    if (currentPlaylist.length === 0 || index < 0 || index >= currentPlaylist.length) return;
    songIndex = index;
    audioElement.src = currentPlaylist[songIndex].filePath;
    songInfoText.innerText = currentPlaylist[songIndex].songName;
    audioElement.currentTime = 0;
    audioElement.play();
    gif.style.opacity = 1;
    masterPlay.classList.replace("fa-circle-play", "fa-circle-pause");
    makeAllPlays();
    
    // Check if the element exists before trying to change it
    const playButton = document.getElementById(songIndex);
    if(playButton) {
        playButton.classList.replace("fa-circle-play", "fa-circle-pause");
    }
}

function makeAllPlays() {
    Array.from(document.getElementsByClassName("songItemPlay")).forEach((element) => {
        element.classList.replace("fa-circle-pause", "fa-circle-play");
    });
}

// --- EVENT LISTENERS ---

// Main Play/Pause Button
masterPlay.addEventListener('click', () => {
    if (!audioElement.src) return;
    if (audioElement.paused || audioElement.currentTime <= 0) {
        audioElement.play();
        masterPlay.classList.replace("fa-circle-play", "fa-circle-pause");
        gif.style.opacity = 1;
        if(document.getElementById(songIndex)) {
            document.getElementById(songIndex).classList.replace("fa-circle-play", "fa-circle-pause");
        }
    } else {
        audioElement.pause();
        masterPlay.classList.replace("fa-circle-pause", "fa-circle-play");
        gif.style.opacity = 0;
        makeAllPlays();
    }
});

// Progress Bar and Timers
audioElement.addEventListener('timeupdate', () => {
    if (audioElement.duration) {
        const progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
        myProgressBar.value = progressPercent;
        currentTimeDisplay.innerText = formatTime(audioElement.currentTime);
        totalDurationDisplay.innerText = formatTime(audioElement.duration);
    }
});

myProgressBar.addEventListener('input', () => {
    if (audioElement.duration) {
        audioElement.currentTime = (myProgressBar.value / 100) * audioElement.duration;
    }
});

// **MODIFIED** - Next and Previous Buttons now use currentPlaylist
document.getElementById("next").addEventListener("click", () => {
    if (currentPlaylist.length === 0) return;
    const newIndex = (songIndex + 1) % currentPlaylist.length;
    playSong(newIndex);
});

document.getElementById("previous").addEventListener("click", () => {
    if (currentPlaylist.length === 0) return;
    const newIndex = (songIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    playSong(newIndex);
});

// Individual Song Play Buttons
function addPlayButtonListeners() {
    Array.from(document.getElementsByClassName("songItemPlay")).forEach((element) => {
        element.addEventListener("click", (e) => {
            const clickedIndex = parseInt(e.target.id);
            if (songIndex === clickedIndex && !audioElement.paused) {
                audioElement.pause();
            } else {
                playSong(clickedIndex);
            }
        });
    });
}


// --- NEW PLAYER CONTROLS ---
const rewind10Btn = document.getElementById('rewind10');
const forward10Btn = document.getElementById('forward10');
const muteToggleBtn = document.getElementById('muteToggle');
const volumeControl = document.getElementById('volumeControl');

// Rewind 10 seconds
rewind10Btn.addEventListener('click', () => {
    if(audioElement.src) audioElement.currentTime = Math.max(0, audioElement.currentTime - 10);
});

// Forward 10 seconds
forward10Btn.addEventListener('click', () => {
    if(audioElement.src) audioElement.currentTime = Math.min(audioElement.duration || 0, audioElement.currentTime + 10);
});

// Mute/Unmute functionality
muteToggleBtn.addEventListener('click', () => {
    audioElement.muted = !audioElement.muted;
});

// Volume control listener
volumeControl.addEventListener('input', () => {
    audioElement.volume = volumeControl.value;
});

// Update controls when song data loads or changes
audioElement.addEventListener('volumechange', () => {
    volumeControl.value = audioElement.volume;
    if (audioElement.muted || audioElement.volume === 0) {
        muteToggleBtn.classList.replace('fa-volume-high', 'fa-volume-xmark');
    } else {
        muteToggleBtn.classList.replace('fa-volume-xmark', 'fa-volume-high');
    }
});


// --- INITIALIZE THE APP ---
document.addEventListener('DOMContentLoaded', getSongs);


//
// ++++++++++++++++ NEW SEARCH FUNCTIONALITY (BACKEND POWERED) ++++++++++++++++
// This replaces the old code you had at the bottom
//
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (query.length > 0) {
        // If user is typing, fetch search results from backend
        try {
            const response = await fetch(`${serverUrl}api/search?q=${query}`);
            const searchedSongs = await response.json();
            
            currentPlaylist = searchedSongs; // Update the current playlist
            renderSongList(currentPlaylist); // Render *only* the search results
            updateAllSongDurations();
        } catch (err) {
            console.error("Search failed:", err);
        }
    } else {
        // If search bar is empty, show all songs
        currentPlaylist = songs; // Reset playlist to all songs
        renderSongList(currentPlaylist); // Render all songs
        updateAllSongDurations();
    }
});
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//