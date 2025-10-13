# Spotify Clone (Full-Stack)

A functional Spotify clone built with Node.js, Express, MongoDB, and plain HTML/CSS/JS. This project allows users to upload, play, and manage a personal music library.

---

## Features

-   **Dynamic Music Library:** Songs are loaded dynamically from a backend server, not hardcoded.
-   **Admin Dashboard:** A separate admin page allows for uploading new MP3s/cover art and deleting existing songs by name.
-   **Full Audio Controls:** Includes play/pause, next/previous, a draggable progress bar, and volume control.
-   **Live Timers:** Displays the current time and total duration for each playing song.

---

## Technologies Used

-   **Frontend:** HTML5, CSS3, JavaScript (ES6+)
-   **Backend:** Node.js, Express.js
-   **Database:** MongoDB with Mongoose
-   **File Uploads:** Multer

---

## How to Run Locally

1.  Clone the repository: `git clone https://github.com/sudhir314/Spotify-.git`
2.  Navigate to the project directory.
3.  Install dependencies: `npm install`
4.  Make sure your local MongoDB server is running.
5.  Start the server: `node server.js`
6.  Open `html.html` in your browser to use the player and `admin.html` to manage songs.
