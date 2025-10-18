// javascript.js (FINAL VERSION with Enhanced Controls)

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

let songs = [];

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
        songs = await response.json();
        renderSongList();
        loadInitialSong();
        updateAllSongDurations();
    } catch (error) {
        console.error("Failed to fetch songs:", error);
        songItemContainer.innerHTML = "<p style='color: white;'>Could not load songs. Is the server running?</p>";
    }
}

function renderSongList() {
    songItemContainer.innerHTML = '';
    songs.forEach((song, index) => {
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
    addPlayButtonListeners();
}

function updateAllSongDurations() {
    const durationElements = document.querySelectorAll('.song-duration');
    songs.forEach((song, index) => {
        const tempAudio = new Audio();
        tempAudio.src = song.filePath;
        tempAudio.addEventListener('loadedmetadata', () => {
            if (durationElements[index]) {
                durationElements[index].innerText = formatTime(tempAudio.duration);
            }
        });
    });
}

// --- PLAYER LOGIC ---
function loadInitialSong() {
    if (songs.length > 0) {
        audioElement.src = songs[0].filePath;
        songInfoText.innerText = songs[0].songName;
        gif.style.opacity = 0;
    } else {
        songInfoText.innerText = "No songs in library";
    }
}

function playSong(index) {
    if (songs.length === 0 || index < 0 || index >= songs.length) return;
    songIndex = index;
    audioElement.src = songs[songIndex].filePath;
    songInfoText.innerText = songs[songIndex].songName;
    audioElement.currentTime = 0;
    audioElement.play();
    gif.style.opacity = 1;
    masterPlay.classList.replace("fa-circle-play", "fa-circle-pause");
    makeAllPlays();
    document.getElementById(songIndex).classList.replace("fa-circle-play", "fa-circle-pause");
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

// Next and Previous Buttons
document.getElementById("next").addEventListener("click", () => {
    if (songs.length === 0) return;
    const newIndex = (songIndex + 1) % songs.length;
    playSong(newIndex);
});

document.getElementById("previous").addEventListener("click", () => {
    if (songs.length === 0) return;
    const newIndex = (songIndex - 1 + songs.length) % songs.length;
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
    if (audioElement.muted) {
        muteToggleBtn.classList.replace('fa-volume-high', 'fa-volume-xmark');
        volumeControl.value = 0; // Move slider to 0 when muted
    } else {
        muteToggleBtn.classList.replace('fa-volume-xmark', 'fa-volume-high');
        volumeControl.value = audioElement.volume; // Sync slider to current volume
    }
});

// Volume control listener
volumeControl.addEventListener('input', () => {
    audioElement.volume = volumeControl.value;
    if (audioElement.volume === 0) {
        audioElement.muted = true;
        muteToggleBtn.classList.replace('fa-volume-high', 'fa-volume-xmark');
    } else {
        audioElement.muted = false;
        muteToggleBtn.classList.replace('fa-volume-xmark', 'fa-volume-high');
    }
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