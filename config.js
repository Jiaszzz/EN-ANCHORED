/* ============================================
   config.js
   歌曲清單設定檔。
   之後要換歌、改歌名、改演唱者，只需要改這裡，
   不需要動任何其他檔案。
   cover / src 都用「相對路徑」，對應 songs/ 與 covers/ 資料夾。

   lyrics 欄位（選填）：貼上 LRC 格式的歌詞文字就會自動同步反白，
   格式範例：
     lyrics: `[00:12.34]第一句歌詞
[00:15.67]第二句歌詞
[00:19.20]第三句歌詞`
   不需要歌詞的歌曲，lyrics 留空字串 "" 或整個欄位不寫都可以。
   ============================================ */

const SONGS = [
  { title: "特別的人", artist: "方大同", cover: "covers/01.jpg", src: "songs/01.mp3", lyrics: "" },
  { title: "Song 2", artist: "Artist", cover: "covers/02.jpg", src: "songs/02.mp3", lyrics: "" },
  { title: "祝福", artist: "辦桌二人組", cover: "covers/03.jpg", src: "songs/03.mp3", lyrics: "" },
  { title: "漫步人生路", artist: "鄧麗君", cover: "covers/04.jpg", src: "songs/04.mp3", lyrics: "" },
  { title: "要一起", artist: "周深", cover: "covers/05.jpg", src: "songs/05.mp3", lyrics: "" },
  { title: "給你們", artist: "張宇", cover: "covers/06.jpg", src: "songs/06.mp3", lyrics: "" },
  { title: "Until I Found You", artist: "Stephen Sanchez", cover: "covers/07.jpg", src: "songs/07.mp3", lyrics: "" },
];

/* 專輯名稱，會顯示在鎖定畫面 / 通知列（Media Session）*/
const ALBUM_NAME = "Wedding Album";
