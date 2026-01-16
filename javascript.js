// javascript.js - FINAL ULTIMATE EDITION
// Features: Visualizer, Volume Fix, Shortcuts, Context Menu, Toasts, Redirects
console.log("Spotify Clone Ultimate Loaded");

const serverUrl = window.location.hostname === "localhost" 
    ? "http://localhost:3000/" 
    : "https://spotify-backend-sudhir314.onrender.com/";

let songIndex = 0;
let audioElement = new Audio();
audioElement.crossOrigin = "anonymous"; 
let songs = [];
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || []; 
let searchTimeout = null; 
let rightClickSongId = null;

let audioContext, analyser, source, canvas, ctx;
let isVisualizerInit = false;

const masterPlayBtn = document.getElementById('masterPlay'); 
const masterIcon = masterPlayBtn ? masterPlayBtn.querySelector('i') : null;
const myProgressBar = document.getElementById('myProgressBar');
const gif = document.getElementById('gif');
const masterSongName = document.getElementById('masterSongName');
const songItemContainer = document.querySelector(".songitemcontainer");
const searchInput = document.getElementById('searchInput');
const contextMenu = document.getElementById('contextMenu');
const volumeControl = document.getElementById('volumeControl');
const muteToggleBtn = document.getElementById('muteToggle');

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    setGreeting();
    getSongs(); 
    restorePlayerState();
    setupToast();

    if (localStorage.getItem('openFavorites') === 'true') {
        localStorage.removeItem('openFavorites');
        setTimeout(() => { if (typeof showLikedSongs === 'function') showLikedSongs(); }, 1000);
    }
});

// --- 1. VOLUME MANAGER ---
if (volumeControl) {
    volumeControl.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        audioElement.volume = vol;
        audioElement.muted = false;
        localStorage.setItem('spotify_volume', vol);
        updateVolumeIcon(vol);
    });
}

if (muteToggleBtn) {
    muteToggleBtn.addEventListener('click', () => {
        audioElement.muted = !audioElement.muted;
        if (audioElement.muted) {
            if(volumeControl) volumeControl.value = 0;
            updateVolumeIcon(0);
        } else {
            const savedVol = parseFloat(localStorage.getItem('spotify_volume')) || 1;
            audioElement.volume = savedVol;
            if(volumeControl) volumeControl.value = savedVol;
            updateVolumeIcon(savedVol);
        }
    });
}

function updateVolumeIcon(vol) {
    if(!muteToggleBtn) return;
    muteToggleBtn.classList.remove('fa-volume-xmark', 'fa-volume-low', 'fa-volume-high');
    if(vol === 0 || audioElement.muted) muteToggleBtn.classList.add('fa-volume-xmark');
    else if (vol < 0.5) muteToggleBtn.classList.add('fa-volume-low');
    else muteToggleBtn.classList.add('fa-volume-high');
}

// --- 2. PRO VISUALIZER ENGINE ---
function initVisualizer() {
    if(isVisualizerInit) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        analyser.fftSize = 128; 
        canvas = document.getElementById('visualizerCanvas');
        if(canvas) {
            ctx = canvas.getContext('2d');
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            isVisualizerInit = true;
            animateVisualizer();
        }
    } catch (e) { console.log("Visualizer waiting..."); }
}

function resizeCanvas() {
    if(canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.parentElement.offsetWidth * dpr;
        canvas.height = canvas.parentElement.offsetHeight * dpr;
        ctx.scale(dpr, dpr);
    }
}

function animateVisualizer() {
    if(!isVisualizerInit) return;
    requestAnimationFrame(animateVisualizer);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    const width = canvas.parentElement.offsetWidth;
    const height = canvas.parentElement.offsetHeight;
    ctx.clearRect(0, 0, width, height);
    
    const barWidth = (width / bufferLength) * 0.8; 
    let x = 0;
    
    for(let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.8; 
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, '#1DB954'); 
        gradient.addColorStop(1, 'rgba(29, 185, 84, 0.1)'); 
        ctx.fillStyle = gradient;
        
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, height - barHeight, barWidth, barHeight, [5, 5, 0, 0]);
            ctx.fill();
        } else {
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        }
        x += barWidth + 4; 
    }
}

// --- 3. PLAYER LOGIC ---
window.playSong = function(id) {
    if(!isVisualizerInit) initVisualizer();
    if(audioContext && audioContext.state === 'suspended') audioContext.resume();

    const index = songs.findIndex(s => s._id === id);
    if(index === -1) return;
    songIndex = index;
    const song = songs[songIndex];
    localStorage.setItem('spotify_current_index', songIndex);

    audioElement.src = song.filePath;
    audioElement.currentTime = 0;
    
    if(masterSongName) masterSongName.innerText = song.songName;
    const playerImg = document.querySelector('.player-left img');
    if(playerImg) playerImg.src = song.coverPath || 'logo.png';
    document.title = `🎵 ${song.songName}`;
    
    // Update OS Media Session
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.songName,
            artist: song.artist,
            artwork: [{ src: song.coverPath || 'logo.png', sizes: '512x512', type: 'image/png' }]
        });
        navigator.mediaSession.setActionHandler('play', () => audioElement.play());
        navigator.mediaSession.setActionHandler('pause', () => audioElement.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => document.getElementById('previous').click());
        navigator.mediaSession.setActionHandler('nexttrack', () => document.getElementById('next').click());
    }

    audioElement.play().then(() => {
        updatePlayerUI(true);
        updateLikeButtonUI();
    }).catch(console.error);
    
    updateIcons(id);
}

function updateIcons(activeId) {
    document.querySelectorAll('.songItemPlay').forEach(el => el.classList.replace("fa-circle-pause", "fa-circle-play"));
    const btn = document.getElementById(`play-icon-${activeId}`);
    if(btn) btn.classList.replace("fa-circle-play", "fa-circle-pause");
}

function updatePlayerUI(isPlaying) {
    if(isPlaying) {
        if(masterIcon) masterIcon.classList.replace("fa-circle-play", "fa-circle-pause");
        if(gif) gif.style.opacity = 1;
    } else {
        if(masterIcon) masterIcon.classList.replace("fa-circle-pause", "fa-circle-play");
        if(gif) gif.style.opacity = 0;
        document.title = "Spotify - Web Player";
    }
}

if(masterPlayBtn) masterPlayBtn.addEventListener('click', () => {
    if(audioElement.paused || audioElement.currentTime <= 0) {
        audioElement.play();
        updatePlayerUI(true);
        if(songs[songIndex]) updateIcons(songs[songIndex]._id);
        if(!isVisualizerInit) initVisualizer();
        if(audioContext && audioContext.state === 'suspended') audioContext.resume();
    } else {
        audioElement.pause();
        updatePlayerUI(false);
        document.querySelectorAll('.songItemPlay').forEach(el => el.classList.replace("fa-circle-pause", "fa-circle-play"));
    }
});

document.getElementById('next').addEventListener('click', () => {
    if(songs.length === 0) return;
    let next = (songIndex + 1) % songs.length;
    playSong(songs[next]._id);
});
document.getElementById('previous').addEventListener('click', () => {
    if(songs.length === 0) return;
    let prev = (songIndex - 1 + songs.length) % songs.length;
    playSong(songs[prev]._id);
});
audioElement.addEventListener('ended', () => document.getElementById('next').click());

// --- 4. SHORTCUTS ---
document.addEventListener('keydown', (e) => {
    if(e.target.tagName === 'INPUT') return;
    switch(e.code) {
        case 'Space': e.preventDefault(); masterPlayBtn.click(); break;
        case 'ArrowRight': audioElement.currentTime += 5; showToast("⏩ +5s"); break;
        case 'ArrowLeft': audioElement.currentTime -= 5; showToast("⏪ -5s"); break;
        case 'KeyM': if(muteToggleBtn) muteToggleBtn.click(); break;
    }
});

// --- 5. CONTEXT MENU ---
document.addEventListener('contextmenu', (e) => {
    const card = e.target.closest('.song-card') || e.target.closest('.songitem');
    if (card) {
        e.preventDefault();
        const onClickAttr = card.getAttribute('onclick');
        if(onClickAttr) {
            const match = onClickAttr.match(/'([^']+)'/);
            if(match) rightClickSongId = match[1];
        }
        if(rightClickSongId) {
            contextMenu.style.top = `${e.clientY}px`;
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.classList.add('visible');
        }
    } else {
        contextMenu.classList.remove('visible');
    }
});
document.addEventListener('click', () => contextMenu.classList.remove('visible'));

document.getElementById('ctxPlay').addEventListener('click', () => {
    if(rightClickSongId) playSong(rightClickSongId);
});
document.getElementById('ctxDownload').addEventListener('click', () => {
    if(rightClickSongId) {
        const song = songs.find(s => s._id === rightClickSongId);
        if(song) {
            const link = document.createElement('a');
            link.href = song.filePath;
            link.download = song.songName;
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Downloading...");
        }
    }
});

// --- 6. SEARCH ---
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.toLowerCase().trim();
        searchTimeout = setTimeout(async () => {
            const searchSec = document.getElementById('search-results-section');
            const sections = document.querySelectorAll('.section-container:not(#search-results-section)');
            if (query.length > 0) {
                try {
                    const res = await fetch(`${serverUrl}api/search?q=${query}`);
                    renderHorizontalCards(await res.json(), 'search-results-container');
                    if(searchSec) searchSec.classList.remove('hidden');
                    sections.forEach(s => s.classList.add('hidden'));
                } catch(err){}
            } else {
                if(searchSec) searchSec.classList.add('hidden');
                sections.forEach(s => s.classList.remove('hidden'));
            }
        }, 400);
    });
}

// --- DATA FETCH ---
function showSkeletons() {
    const skeletonHTML = `
        <div class="skeleton-wrapper">
            <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-text"></div></div>
            <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-text"></div></div>
            <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-text"></div></div>
        </div>`;
    const featured = document.getElementById('featured-songs');
    if(featured) featured.innerHTML = skeletonHTML;
    const recent = document.getElementById('recent-songs');
    if(recent) recent.innerHTML = skeletonHTML;
}

async function getSongs() {
    try {
        showSkeletons();
        const response = await fetch(`${serverUrl}api/songs`);
        if (!response.ok) throw new Error("Server Error");
        songs = await response.json();
        renderSongList(songs);
        loadHomeSections();
    } catch (error) { 
        if(songItemContainer) songItemContainer.innerHTML = '<p style="color:red; text-align:center;">Server sleeping. Please refresh in 30s.</p>';
    }
}

async function loadHomeSections() {
    try {
        const fRes = await fetch(`${serverUrl}api/songs/featured`);
        renderHorizontalCards(await fRes.json(), 'featured-songs');
        const rRes = await fetch(`${serverUrl}api/songs/recent`);
        renderHorizontalCards(await rRes.json(), 'recent-songs');
        updateLikedSection();
    } catch(e){}
}

window.filterPlaylist = function(type) {
    if(type === 'all') { renderSongList(songs); showToast("All Songs"); }
    else if (type === 'featured') { renderSongList(songs.filter(s => s.isFeatured)); showToast("Top Hits"); }
    else if (type === 'recent') { renderSongList([...songs].reverse()); showToast("Fresh Arrivals"); }
    songItemContainer.scrollIntoView({behavior: 'smooth'});
}

function renderSongList(list) {
    if(!songItemContainer) return;
    songItemContainer.innerHTML = '';
    list.forEach((song) => {
        songItemContainer.innerHTML += `
        <div class="songitem" onclick="playSong('${song._id}')">
            <div style="display:flex; align-items:center;">
                <img src="${song.coverPath}" onerror="this.src='logo.png'">
                <span class="songName">${song.songName}</span>
            </div>
            <span class="timestamp"><i class="fa-solid fa-circle-play songItemPlay" id="play-icon-${song._id}"></i></span>
        </div>`;
    });
}

function renderHorizontalCards(list, containerId) {
    const container = document.getElementById(containerId);
    if(container) {
        container.innerHTML = '';
        list.forEach(song => {
            container.innerHTML += `
                <div class="song-card" onclick="playSong('${song._id}')">
                    <div style="position: relative;">
                        <img src="${song.coverPath}" onerror="this.src='logo.png'">
                        <div class="play-btn-overlay"><i class="fa-solid fa-play"></i></div>
                    </div>
                    <h4>${song.songName}</h4>
                    <p>${song.artist || 'Artist'}</p>
                </div>`;
        });
    }
}

// --- UTILITIES ---
function setupToast() {
    if(!document.getElementById('toast-container')) {
        const div = document.createElement('div');
        div.id = 'toast-container';
        document.body.appendChild(div);
    }
}
function showToast(msg) {
    const cont = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `✅ ${msg}`;
    cont.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

audioElement.addEventListener('timeupdate', () => {
    if(audioElement.duration) {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        if(myProgressBar) myProgressBar.value = progress;
        document.getElementById('current-time').innerText = formatTime(audioElement.currentTime);
        document.getElementById('total-duration').innerText = formatTime(audioElement.duration);
    }
});
if(myProgressBar) myProgressBar.addEventListener('input', () => { audioElement.currentTime = (myProgressBar.value * audioElement.duration) / 100; });

function formatTime(s) {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}
function setGreeting() {
    const h1 = document.querySelector('.hero-overlay h1');
    if (h1) h1.innerText = new Date().getHours() < 12 ? "Good Morning" : (new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening");
}

const likeBtn = document.getElementById('likeBtn');
if(likeBtn) likeBtn.addEventListener('click', () => {
    const s = songs[songIndex];
    if(!s) return;
    const idx = likedSongs.indexOf(s._id);
    if(idx === -1) { likedSongs.push(s._id); showToast("Added Favorites"); }
    else { likedSongs.splice(idx, 1); showToast("Removed Favorites"); }
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    updateLikeButtonUI(); updateLikedSection();
});
function updateLikeButtonUI() {
    const s = songs[songIndex];
    if(s && likedSongs.includes(s._id)) likeBtn.classList.replace("fa-regular", "fa-solid");
    else likeBtn.classList.replace("fa-solid", "fa-regular");
}
function updateLikedSection() {
    const sec = document.getElementById('liked-section');
    const objs = songs.filter(s => likedSongs.includes(s._id));
    if(objs.length > 0) { sec.classList.remove('hidden'); renderHorizontalCards(objs, 'liked-songs-container'); }
    else sec.classList.add('hidden');
}

function restorePlayerState() {
    const vol = localStorage.getItem('spotify_volume');
    if(vol) { 
        const v = parseFloat(vol);
        audioElement.volume = v;
        if(volumeControl) volumeControl.value = v;
        updateVolumeIcon(v);
    }
}

window.showLikedSongs = function() {
    updateLikedSection();
    const section = document.getElementById('liked-section');
    if(section) {
        section.classList.remove('hidden');
        section.scrollIntoView({ behavior: 'smooth' });
    }
};