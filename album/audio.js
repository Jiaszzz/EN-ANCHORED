/* ============================================
   audio.js
   負責所有跟聲音播放相關的邏輯：
   播放/暫停、上一首/下一首、進度條、時間顯示、
   預載下一首（避免切歌等待）、Media Session（鎖定畫面控制）、
   輕微震動回饋。
   不處理封面卡片視覺，那是 coverflow.js 的工作。
   ============================================ */

const AudioPlayer = (function () {
  const audio = new Audio();
  audio.preload = "auto";

  let songs = [];
  let currentIndex = 0;
  let preloadedAudio = null; // 用來預先觸發下一首的下載
  let onTimeUpdateCallback = null;
  let onStateChangeCallback = null; // (isPlaying, isLoading)

  function init(songList, callbacks) {
    songs = songList;
    onTimeUpdateCallback = callbacks.onTimeUpdate;
    onStateChangeCallback = callbacks.onStateChange;

    audio.addEventListener("timeupdate", () => {
      onTimeUpdateCallback && onTimeUpdateCallback(audio.currentTime, audio.duration);
    });

    audio.addEventListener("waiting", () => onStateChangeCallback && onStateChangeCallback(!audio.paused, true));
    audio.addEventListener("canplay", () => onStateChangeCallback && onStateChangeCallback(!audio.paused, false));
    audio.addEventListener("playing", () => onStateChangeCallback && onStateChangeCallback(true, false));
    audio.addEventListener("pause", () => onStateChangeCallback && onStateChangeCallback(false, false));

    audio.addEventListener("ended", () => {
      // 播完自動下一首，最後一首播完循環回第一首
      loadIndex((currentIndex + 1) % songs.length, true);
    });

    audio.addEventListener("error", () => {
      onStateChangeCallback && onStateChangeCallback(false, false, true); // 第三個參數代表載入失敗
    });

    setupMediaSession();
  }

  function loadIndex(index, autoplay) {
    currentIndex = index;
    const song = songs[currentIndex];
    audio.src = song.src;

    if (autoplay) {
      audio.play().catch(() => {
        // 若播放被瀏覽器擋下（理論上開場已取得手勢，這裡是保險）
        onStateChangeCallback && onStateChangeCallback(false, false);
      });
    }

    updateMediaSessionMetadata(song);
    preloadNext();
    vibrate();
  }

  function preloadNext() {
    const nextIndex = (currentIndex + 1) % songs.length;
    const nextSrc = songs[nextIndex].src;
    // 用一個隱藏的 Audio 物件觸發瀏覽器背景下載，
    // 之後真正切到這首時，瀏覽器會從快取直接拿，不用重新下載。
    preloadedAudio = new Audio();
    preloadedAudio.preload = "auto";
    preloadedAudio.src = nextSrc;
  }

  function togglePlay() {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }

  function play() { return audio.play(); }
  function pause() { audio.pause(); }
  function next() { loadIndex((currentIndex + 1) % songs.length, true); }
  function prev() { loadIndex((currentIndex - 1 + songs.length) % songs.length, true); }
  function isPaused() { return audio.paused; }
  function getCurrentIndex() { return currentIndex; }
  function getDuration() { return audio.duration || 0; }

  function seekTo(seconds) {
    if (!isNaN(audio.duration)) {
      audio.currentTime = Math.max(0, Math.min(seconds, audio.duration));
    }
  }

  function formatTime(sec) {
    if (isNaN(sec) || sec === Infinity) return "00:00";
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  /* 裝置若支援 Vibration API，切歌時給一個很短的震動回饋 */
  function vibrate() {
    if (navigator.vibrate) {
      navigator.vibrate(12);
    }
  }

  /* Media Session：讓鎖定畫面 / 通知列可以顯示歌曲資訊並控制播放 */
  function setupMediaSession() {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", () => audio.play());
    navigator.mediaSession.setActionHandler("pause", () => audio.pause());
    navigator.mediaSession.setActionHandler("previoustrack", () => prev());
    navigator.mediaSession.setActionHandler("nexttrack", () => next());
  }

  function updateMediaSessionMetadata(song) {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: typeof ALBUM_NAME !== "undefined" ? ALBUM_NAME : "",
      artwork: [{ src: song.cover, sizes: "800x800", type: "image/jpeg" }],
    });
  }

  return {
    init, loadIndex, togglePlay, play, pause, next, prev,
    isPaused, getCurrentIndex, seekTo, formatTime, getDuration,
  };
})();
