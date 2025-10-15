// javascript.js (FINAL VERSION - NO PUBLIC DELETE)

console.log("Welcome to Spotify");

// --- Initialize Variables ---
let songIndex = 0;
let audioElement = new Audio();
let masterPlay = document.getElementById('masterPlay');
let myProgressBar = document.getElementById('myProgressBar');
let gif = document.getElementById('gif');
let songInfoText = document.querySelector(".songinfo span");
const songItemContainer = document.querySelector(".songitemcontainer");
const serverUrl = 'https://sudhir-spotify-clone.netlify.app/'; // Using Netlify URL as the primary, but API calls go to Render

const currentTimeDisplay = document.getElementById('current-time');
const totalDurationDisplay = document.getElementById('total-duration');

let songs = [];

// --- HELPER FUNCTION: Format seconds into MM:SS format ---
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) { return "00:00"; }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

// --- FETCH SONGS FROM THE SERVER ---
async function getSongs() {
    try {
        const response = await fetch('https://spotify-backend-sudhir314.onrender.com/api/songs'); // API calls still go to Render
        songs = await response.json();
        renderSongList();
        loadInitialSong();
        updateAllSongDurations();
    } catch (error) {
        console.error("Failed to fetch songs:", error);
        songItemContainer.innerHTML = "<p style='color: white;'>Could not load songs. Is the server running?</p>";
    }
}

// --- RENDER THE SONG LIST IN THE UI (DELETE ICON REMOVED) ---
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
    
    // Only add listeners for the play buttons
    addPlayButtonListeners();
}

// --- Get the duration for each song in the list ---
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

// --- Load the very first song into the player UI ---
function loadInitialSong() {
    if (songs.length > 0) {
        audioElement.src = songs[0].filePath;
        songInfoText.innerText = songs[0].songName;
        gif.style.opacity = 0;
        
        audioElement.addEventListener('loadedmetadata', () => {
            totalDurationDisplay.innerText = formatTime(audioElement.duration);
        });
    } else {
        songInfoText.innerText = "No songs in library";
        currentTimeDisplay.innerText = "00:00";
        totalDurationDisplay.innerText = "00:00";
        myProgressBar.value = 0;
    }
}

// --- Handle main play/pause button ---
masterPlay.addEventListener('click', () => {
    if (!audioElement.src) return;
    if (audioElement.paused || audioElement.currentTime <= 0) {
        audioElement.play();
        masterPlay.classList.replace("fa-circle-play", "fa-circle-pause");
        gif.style.opacity = 1;
        document.getElementById(songIndex).classList.replace("fa-circle-play", "fa-circle-pause");
    } else {
        audioElement.pause();
        masterPlay.classList.replace("fa-circle-pause", "fa-circle-play");
        gif.style.opacity = 0;
        makeAllPlays();
    }
});

// --- Update progress bar and timers as song plays ---
audioElement.addEventListener('timeupdate', () => {
    if (audioElement.duration) {
        const progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
        myProgressBar.value = progressPercent;
        currentTimeDisplay.innerText = formatTime(audioElement.currentTime);
        totalDurationDisplay.innerText = formatTime(audioElement.duration);
        currentTimeDisplay.style.left = `${progressPercent}%`;
    }
});

// --- Seek functionality for progress bar ---
myProgressBar.addEventListener('input', () => {
    if (audioElement.duration) {
        audioElement.currentTime = (myProgressBar.value * audioElement.duration) / 100;
    }
});

// --- Play a specific song and update everything ---
function playSong(index) {
    if (songs.length === 0) return;
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

// --- Next and Previous button logic ---
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

// --- Helper functions ---
function makeAllPlays() {
    Array.from(document.getElementsByClassName("songItemPlay")).forEach((element) => {
        element.classList.replace("fa-circle-pause", "fa-circle-play");
    });
}
function addPlayButtonListeners() {
    Array.from(document.getElementsByClassName("songItemPlay")).forEach((element) => {
        element.addEventListener("click", (e) => {
            const clickedIndex = parseInt(e.target.id);
            if (songIndex === clickedIndex && !audioElement.paused) {
                audioElement.pause();
                e.target.classList.replace("fa-circle-pause", "fa-circle-play");
                masterPlay.classList.replace("fa-circle-pause", "fa-circle-play");
                gif.style.opacity = 0;
            } else {
                playSong(clickedIndex);
            }
        });
    });
}

// --- THE addDeleteButtonListeners FUNCTION HAS BEEN COMPLETELY REMOVED ---

// --- Volume Control ---
let volumeControl = document.getElementById('volumeControl');
volumeControl.addEventListener('input', () => {
    audioElement.volume = volumeControl.value;
});

// --- Start everything when the page loads ---
document.addEventListener('DOMContentLoaded', getSongs);