console.log("Welcome to Spotify");

// Initialize variables
let songIndex = 0; // Tracks which song is playing
let audioElement = new Audio('songs/1.mp3'); // Default audio source
let masterPlay = document.getElementById('masterPlay'); // Main play/pause button
let myProgressBar = document.getElementById('myProgressBar'); // Progress bar input
let gif = document.getElementById('gif'); // Playing gif animation
let songItems = Array.from(document.getElementsByClassName("songitem")); // All song elements

// List of all songs
let songs = [
    { songName: "Salam-e-Ishq", filePath: "songs/1.mp3", coverPath: "covers/1.jpg" },
    { songName: "Dil Diyan Gallan", filePath: "songs/2.mp3", coverPath: "covers/2.jpg" },
    { songName: "Tera Ban Jaunga", filePath: "songs/3.mp3", coverPath: "covers/3.jpg" },
    { songName: "Phir Kabhi", filePath: "songs/4.mp3", coverPath: "covers/4.jpg" },
    { songName: "Tum Mile", filePath: "songs/5.mp3", coverPath: "covers/5.jpg" },
    { songName: "Shayad", filePath: "songs/6.mp3", coverPath: "covers/6.jpg" },
    { songName: "Raabta", filePath: "songs/7.mp3", coverPath: "covers/7.jpg" },
    { songName: "Pee Loon", filePath: "songs/8.mp3", coverPath: "covers/8.jpg" },
    { songName: "Kaise Hua", filePath: "songs/9.mp3", coverPath: "covers/9.jpg" },
    { songName: "kon h tu ", filePath: "songs/10.mp3", coverPath: "covers/10.jpg" },
];

// Update song list UI with song name and cover
songItems.forEach((element, i) => {
    element.getElementsByTagName("img")[0].src = songs[i].coverPath;
    element.getElementsByClassName("songName")[0].innerText = songs[i].songName;
});

// Handle main play/pause button
masterPlay.addEventListener('click', () => {
    if (audioElement.paused || audioElement.currentTime <= 0) {
        audioElement.play();
        masterPlay.classList.remove("fa-circle-play");
        masterPlay.classList.add("fa-circle-pause");
        gif.style.opacity = 1;
    } else {
        audioElement.pause();
        masterPlay.classList.remove("fa-circle-pause");
        masterPlay.classList.add("fa-circle-play");
        gif.style.opacity = 0;
    }
});

// Update progress bar as song plays
audioElement.addEventListener('timeupdate', () => {
    let progress = parseInt((audioElement.currentTime / audioElement.duration) * 100);
    myProgressBar.value = progress;
});

// Seek functionality for progress bar
myProgressBar.addEventListener('input', () => {
    audioElement.currentTime = (myProgressBar.value * audioElement.duration) / 100;
});

// Next button logic
document.getElementById("next").addEventListener("click", () => {
    if (songIndex >= songs.length - 1) {
        songIndex = 0;
    } else {
        songIndex++;
    }
    audioElement.src = songs[songIndex].filePath;
    audioElement.currentTime = 0;
    audioElement.play();
    masterPlay.classList.remove("fa-circle-play");
    masterPlay.classList.add("fa-circle-pause");
    document.querySelector(".songinfo").innerHTML = `<img src="playing.gif" width="42px" alt="" id="gif"> ${songs[songIndex].songName}`;
});

// Previous button logic
document.getElementById("previous").addEventListener("click", () => {
    if (songIndex <= 0) {
        songIndex = 0;
    } else {
        songIndex--;
    }
    audioElement.src = songs[songIndex].filePath;
    audioElement.currentTime = 0;
    audioElement.play();
    masterPlay.classList.remove("fa-circle-play");
    masterPlay.classList.add("fa-circle-pause");
    document.querySelector(".songinfo").innerHTML = `<img src="playing.gif" width="42px" alt="" id="gif"> ${songs[songIndex].songName}`;
});

// Helper to reset all play buttons in list
function makeAllPlays() {
    Array.from(document.getElementsByClassName("songItemPlay")).forEach((element) => {
        element.classList.remove("fa-circle-pause");
        element.classList.add("fa-circle-play");
    });
}

// Play a specific song when its play icon is clicked
Array.from(document.getElementsByClassName("songItemPlay")).forEach((element, index) => {
    element.addEventListener("click", (e) => {
        makeAllPlays(); // reset all to play icon
        e.target.classList.remove("fa-circle-play");
        e.target.classList.add("fa-circle-pause");
        songIndex = index;
        audioElement.src = songs[songIndex].filePath;
        audioElement.currentTime = 0;
        audioElement.play();
        masterPlay.classList.remove("fa-circle-play");
        masterPlay.classList.add("fa-circle-pause");
        document.querySelector(".songinfo").innerHTML = `<img src="playing.gif" width="42px" alt="" id="gif"> ${songs[songIndex].songName}`;
    });
});

// Search songs by name
let searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function () {
    let filter = this.value.toLowerCase();
    let allSongs = document.querySelectorAll(".songitem");

    allSongs.forEach(function (song) {
        let title = song.querySelector(".songName").innerText.toLowerCase();
        if (title.includes(filter)) {
            song.style.display = "flex"; // show if match
        } else {
            song.style.display = "none"; // hide if no match
        }
    });
});


// ─── Auto-play on Enter ──────────────────────────────────────────────────────
searchInput.addEventListener("keypress", function (e) {
    if (e.key !== "Enter") return;      // only react to Enter

    const query = this.value.trim().toLowerCase();
    if (!query) return;                 // empty search ⇒ do nothing

    // 1️⃣ Try exact-name match first
    let exactIndex = songs.findIndex(
        s => s.songName.toLowerCase() === query
    );

    // 2️⃣ If no exact match, check how many songs are still visible
    if (exactIndex === -1) {
        const visibleItems = [...document.querySelectorAll(".songitem")]
            .filter(item => item.style.display !== "none");

        // if only one song is visible after filtering, we’ll use that
        if (visibleItems.length === 1) {
            exactIndex = [...document.querySelectorAll(".songitem")]
                .indexOf(visibleItems[0]);
        }
    }

    // 3️⃣ Play if we resolved a target index
    if (exactIndex !== -1) {
        songIndex = exactIndex;
        audioElement.src = songs[songIndex].filePath;
        audioElement.currentTime = 0;
        audioElement.play();

        // update big Play/Pause button
        masterPlay.classList.remove("fa-circle-play");
        masterPlay.classList.add("fa-circle-pause");

        // update the song-info text
        document.querySelector(".songinfo").innerHTML =
            `<img src="playing.gif" width="42px" alt="" id="gif"> ${songs[songIndex].songName}`;

        // update icons inside the list
        makeAllPlays();
        document.querySelectorAll(".songItemPlay")[songIndex]
            .classList.replace("fa-circle-play", "fa-circle-pause");
    }
});
 let volumeControl = document.getElementById('volumeControl'); // Get the volume slider

// Set volume when slider moves
volumeControl.addEventListener('input', () => {
    audioElement.volume = volumeControl.value;
});



let muteBtn = document.getElementById('muteBtn');
let previousVolume = audioElement.volume;

muteBtn.addEventListener('click', () => {
    if (audioElement.muted) {
        audioElement.muted = false;
        volumeControl.value = previousVolume; // restore volume
        muteBtn.textContent = "🔊"; // Or change to a Font Awesome icon
    } else {
        audioElement.muted = true;
        previousVolume = volumeControl.value; // store current volume
        volumeControl.value = 0;
        muteBtn.textContent = "🔇"; // Or change icon accordingly
    }
});
