/* ============================================
   player.js
   整個網頁的「總指揮」：
   - 開場輕點畫面 → 觸發第一次播放（滿足瀏覽器手勢要求）
   - 串接 CoverFlow（畫面）與 AudioPlayer（聲音）
   - 更新歌名/演唱者/時間/進度條
   - 背景漸變、Loading 動畫、錯誤畫面
   - 鍵盤左右鍵切歌
   - 註冊離線快取（Service Worker）
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  const els = {
    startOverlay: document.getElementById("startOverlay"),
    track: document.getElementById("track"),
    songTitle: document.getElementById("songTitle"),
    songArtist: document.getElementById("songArtist"),
    currentTime: document.getElementById("currentTime"),
    duration: document.getElementById("duration"),
    progressBar: document.getElementById("progressBar"),
    progressFill: document.getElementById("progressFill"),
    progressHandle: document.getElementById("progressHandle"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    playPauseBtn: document.getElementById("playPauseBtn"),
    background: document.getElementById("background"),
    spinner: document.getElementById("spinner"),
    errorMsg: document.getElementById("errorMsg"),
    lyricsLineText: document.getElementById("lyricsLineText"),
  };

  let currentLyrics = [];
  let activeLyricsIndex = -1;
  let rollTimeout = null;

  let started = false;
  let seeking = false;

  setBackground(SONGS[0].cover);

  // ---------- 初始化 CoverFlow（畫面） ----------
  CoverFlow.init(els.track, SONGS, 0, (index, type) => {
    if (type === "toggle") {
      AudioPlayer.togglePlay();
    } else {
      // 滑動/點側邊封面切歌：自動播放該首
      AudioPlayer.loadIndex(index, true);
      updateNowPlaying(index);
      setBackground(SONGS[index].cover);
    }
  });

  // ---------- 初始化 AudioPlayer（聲音） ----------
  AudioPlayer.init(SONGS, {
    onTimeUpdate: (current, duration) => {
      if (seeking) return;
      els.currentTime.textContent = AudioPlayer.formatTime(current);
      els.duration.textContent = AudioPlayer.formatTime(duration);
      const pct = duration ? (current / duration) * 100 : 0;
      els.progressFill.style.width = pct + "%";
      els.progressHandle.style.left = pct + "%";
      updateLyricsHighlight(current);
    },
    onStateChange: (isPlaying, isLoading, isError) => {
      els.playPauseBtn.querySelector(".icon-play").style.display = isPlaying ? "none" : "";
      els.playPauseBtn.querySelector(".icon-pause").style.display = isPlaying ? "" : "none";
      els.spinner.classList.toggle("show", !!isLoading);
      els.errorMsg.classList.toggle("show", !!isError);
    },
  });

  updateNowPlaying(0);

  // ---------- 開場：輕點畫面開始播放 ----------
  els.startOverlay.addEventListener("click", () => {
    if (started) return;
    started = true;
    els.startOverlay.classList.add("hidden");
    AudioPlayer.loadIndex(0, true);
  }, { once: true });

  // ---------- 上一首 / 下一首按鈕 ----------
  els.prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    AudioPlayer.prev();
    syncAfterTrackChange();
  });
  els.nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    AudioPlayer.next();
    syncAfterTrackChange();
  });
  els.playPauseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    AudioPlayer.togglePlay();
  });

  // 歌曲自然播完自動切下一首時，畫面也要同步移動封面
  document.addEventListener("visibilitychange", () => {}); // 保留擴充點
  setInterval(() => {
    const idx = AudioPlayer.getCurrentIndex();
    if (idx !== CoverFlow.getCurrent()) {
      CoverFlow.goTo(idx, true);
      updateNowPlaying(idx);
      setBackground(SONGS[idx].cover);
    }
  }, 400);

  // ---------- 進度條拖曳 ----------
  els.progressBar.addEventListener("pointerdown", (e) => {
    seeking = true;
    seekFromEvent(e);
  });
  window.addEventListener("pointermove", (e) => {
    if (seeking) seekFromEvent(e, true);
  });
  window.addEventListener("pointerup", (e) => {
    if (!seeking) return;
    seeking = false;
    seekFromEvent(e);
  });

  function seekFromEvent(e, previewOnly) {
    const rect = els.progressBar.getBoundingClientRect();
    let pct = (e.clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    els.progressFill.style.width = pct * 100 + "%";
    els.progressHandle.style.left = pct * 100 + "%";
    if (!previewOnly) {
      AudioPlayer.seekTo(pct * AudioPlayer.getDuration());
    }
  }

  // ---------- 鍵盤左右鍵 ----------
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { AudioPlayer.prev(); syncAfterTrackChange(); }
    if (e.key === "ArrowRight") { AudioPlayer.next(); syncAfterTrackChange(); }
    if (e.key === " ") { e.preventDefault(); AudioPlayer.togglePlay(); }
  });

  function syncAfterTrackChange() {
    const idx = AudioPlayer.getCurrentIndex();
    CoverFlow.goTo(idx, true);
    updateNowPlaying(idx);
    setBackground(SONGS[idx].cover);
  }

  function updateNowPlaying(index) {
    els.songTitle.textContent = SONGS[index].title;
    els.songArtist.textContent = SONGS[index].artist;
    loadLyricsForSong(index);
  }

  function loadLyricsForSong(index) {
    const song = SONGS[index];
    currentLyrics = Lyrics.parse(song.lyrics || "");
    activeLyricsIndex = -1;
    // 換歌時立刻清空、不做滾動動畫
    if (rollTimeout) { clearTimeout(rollTimeout); rollTimeout = null; }
    els.lyricsLineText.classList.remove("roll-out", "roll-in-prep");
    els.lyricsLineText.textContent = "";
  }

  function updateLyricsHighlight(currentTime) {
    if (currentLyrics.length === 0) return;
    const idx = Lyrics.getActiveIndex(currentLyrics, currentTime);
    if (idx === activeLyricsIndex || idx < 0) return;
    activeLyricsIndex = idx;
    rollToLine(currentLyrics[idx].text);
  }

  // 滾動式切換：目前這句往上滑出淡出，下一句從下方滑入
  function rollToLine(text) {
    const el = els.lyricsLineText;
    if (rollTimeout) clearTimeout(rollTimeout);

    el.classList.add("roll-out");
    rollTimeout = setTimeout(() => {
      el.textContent = text;
      el.classList.remove("roll-out");
      el.classList.add("roll-in-prep");
      void el.offsetWidth; // 強制重排，讓下一行 class 變化能觸發 transition
      el.classList.remove("roll-in-prep");
    }, 380);
  }

  function setBackground(coverUrl) {
    els.background.style.backgroundImage = `url(${coverUrl})`;
  }

  // ---------- 離線快取已停用 ----------
  // 網站還在頻繁修改階段，離線快取容易造成「卡在舊版本」的困擾，
  // 目前不再主動註冊。sw.js 保留一份「自我解除」版本，
  // 讓先前已經裝上舊版離線快取的手機能自動清除、恢復正常。
});
