/* ============================================
   config.js
   歌曲清單設定檔。
   之後要換歌、改歌名、改演唱者，只需要改這裡，
   不需要動任何其他檔案。
   cover / src 都用「相對路徑」，對應 songs/ 與 covers/ 資料夾。
   ============================================ */

const SONGS = [
  { title: "Song 1", artist: "Artist", cover: "covers/01.jpg", src: "songs/01.mp3" },
  { title: "Song 2", artist: "Artist", cover: "covers/02.jpg", src: "songs/02.mp3" },
  { title: "Song 3", artist: "Artist", cover: "covers/03.jpg", src: "songs/03.mp3" },
  { title: "Song 4", artist: "Artist", cover: "covers/04.jpg", src: "songs/04.mp3" },
  { title: "Song 5", artist: "Artist", cover: "covers/05.jpg", src: "songs/05.mp3" },
  { title: "Song 6", artist: "Artist", cover: "covers/06.jpg", src: "songs/06.mp3" },
  { title: "Song 7", artist: "Artist", cover: "covers/07.jpg", src: "songs/07.mp3" },
];

/* 專輯名稱，會顯示在鎖定畫面 / 通知列（Media Session）*/
const ALBUM_NAME = "Wedding Album";
