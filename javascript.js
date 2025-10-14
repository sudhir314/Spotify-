// Log a welcome message to console
console.log("Welcome to Spotify");

// --- Initialize Variables ---
let songIndex = 0; // Tracks the currently playing song index
let audioElement = new Audio(); // Create a new Audio object
let masterPlay = document.getElementById('masterPlay'); // Play/Pause button
let myProgressBar = document.getElementById('myProgressBar'); // Progress slider
let gif = document.getElementById('gif'); // Animated GIF when music plays
let songInfoText = document.querySelector(".songinfo span"); // Song title at the bottom
const songItemContainer = document.querySelector(".songitemcontainer"); // Container for song list
const serverUrl = 'https://spotify-backend-sudhir314.onrender.com/';
 // Backend server URL

// Timer displays
const currentTimeDisplay = document.getElementById('current-time'); // Current time
const totalDurationDisplay = document.getElementById('total-duration'); // Total duration

let songs = []; // Array to store songs fetched from server

// --- Format seconds into MM:SS format ---
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00"; // Handle invalid numbers
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// --- Fetch songs from server ---
async function getSongs() {
    try {
        const response = await fetch(`${serverUrl}api/songs`); // GET request to backend
        songs = await response.json(); // Store songs in array
        renderSongList(); // Render songs in UI
        loadInitialSong(); // Load first song in player
        updateAllSongDurations(); // Update durations for each song
    } catch (error) {
        console.error("Failed to fetch songs:", error);
        songItemContainer.innerHTML = "<p style='color: white;'>Could not load songs. Is the server running?</p>";
    }
}

// --- Render songs in the song list container ---
function renderSongList() {
    songItemContainer.innerHTML = ''; // Clear container
    songs.forEach((song, index) => {
        // Add each song's HTML
        songItemContainer.innerHTML += `
        <div class="songitem">
            <img src="${serverUrl}${song.coverPath}" alt="${song.songName}">
            <span class="songName">${song.songName}</span>
            <span class="timestamp">
                <span class="song-duration">00:00</span> 
                <i id="${index}" class="fa-solid fa-circle-play songItemPlay"></i>
            </span>
        </div>`;
    });
    addPlayButtonListeners(); // Add click listeners for each play button
}

// --- Update duration for each song dynamically ---
function updateAllSongDurations() {
    const durationElements = document.querySelectorAll('.song-duration'); // All duration spans
    songs.forEach((song, index) => {
        const tempAudio = new Audio(); // Temporary audio to load metadata
        tempAudio.src = `${serverUrl}${song.filePath}`; // Set source
        tempAudio.addEventListener('loadedmetadata', () => {
            if (durationElements[index]) {
                durationElements[index].innerText = formatTime(tempAudio.duration); // Update UI
            }
        });
    });
}

// --- Load first song on page load ---
function loadInitialSong() {
    if (songs.length > 0) {
        audioElement.src = `${serverUrl}${songs[0].filePath}`; // First song source
        songInfoText.innerText = songs[0].songName; // Show title
        gif.style.opacity = 0; // Hide GIF initially
        
        // Update total duration display once metadata is loaded
        audioElement.addEventListener('loadedmetadata', () => {
            totalDurationDisplay.innerText = formatTime(audioElement.duration);
        });
    }
}

// --- Handle main play/pause button ---
masterPlay.addEventListener('click', () => {
    if (!audioElement.src) return; // No song loaded
    if (audioElement.paused || audioElement.currentTime <= 0) {
        audioElement.play(); // Play song
        masterPlay.classList.replace("fa-circle-play", "fa-circle-pause"); // Update icon
        gif.style.opacity = 1; // Show GIF
        document.getElementById(songIndex).classList.replace("fa-circle-play", "fa-circle-pause"); // Update list button
    } else {
        audioElement.pause(); // Pause song
        masterPlay.classList.replace("fa-circle-pause", "fa-circle-play"); // Update icon
        gif.style.opacity = 0; // Hide GIF
        makeAllPlays(); // Reset all list play buttons
    }
});

// --- Update progress bar and timers as song plays ---
audioElement.addEventListener('timeupdate', () => {
    if (audioElement.duration) {
        const progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
        myProgressBar.value = progressPercent; // Update slider

        // Update timer text
        currentTimeDisplay.innerText = formatTime(audioElement.currentTime);
        totalDurationDisplay.innerText = formatTime(audioElement.duration);

        // Move current-time text along slider
        currentTimeDisplay.style.left = `${progressPercent}%`;
    }
});

// --- Seek functionality ---
myProgressBar.addEventListener('input', () => {
    if (audioElement.duration) {
        audioElement.currentTime = (myProgressBar.value * audioElement.duration) / 100; // Set current time
    }
});

// --- Play a specific song by index ---
function playSong(index) {
    if (songs.length === 0) return;
    songIndex = index;
    audioElement.src = `${serverUrl}${songs[songIndex].filePath}`; // Set new source
    songInfoText.innerText = songs[songIndex].songName; // Update title
    audioElement.currentTime = 0; // Reset time
    audioElement.play(); // Play
    gif.style.opacity = 1; // Show GIF
    masterPlay.classList.replace("fa-circle-play", "fa-circle-pause"); // Update master button
    makeAllPlays(); // Reset all other buttons
    document.getElementById(songIndex).classList.replace("fa-circle-play", "fa-circle-pause"); // Update clicked button
}

// --- Next & Previous buttons ---
document.getElementById("next").addEventListener("click", () => {
    if (songs.length === 0) return;
    const newIndex = (songIndex + 1) % songs.length; // Loop forward
    playSong(newIndex);
});
document.getElementById("previous").addEventListener("click", () => {
    if (songs.length === 0) return;
    const newIndex = (songIndex - 1 + songs.length) % songs.length; // Loop backward
    playSong(newIndex);
});

// --- Reset all list play buttons to play icon ---
function makeAllPlays() {
    Array.from(document.getElementsByClassName("songItemPlay")).forEach((element) => {
        element.classList.replace("fa-circle-pause", "fa-circle-play");
    });
}

// --- Add click listeners to each song play button ---
function addPlayButtonListeners() {
    Array.from(document.getElementsByClassName("songItemPlay")).forEach((element) => {
        element.addEventListener("click", (e) => {
            const clickedIndex = parseInt(e.target.id); // Get index
            if (songIndex === clickedIndex && !audioElement.paused) {
                audioElement.pause(); // Pause if already playing
                e.target.classList.replace("fa-circle-pause", "fa-circle-play"); // Update icon
                masterPlay.classList.replace("fa-circle-pause", "fa-circle-play"); // Update master button
                gif.style.opacity = 0; // Hide GIF
            } else {
                playSong(clickedIndex); // Play selected song
            }
        });
    });
}

// --- Volume control ---
let volumeControl = document.getElementById('volumeControl');
volumeControl.addEventListener('input', () => {
    audioElement.volume = volumeControl.value; // Set audio volume
});

// --- Initialize player when DOM is ready ---
document.addEventListener('DOMContentLoaded', getSongs);
