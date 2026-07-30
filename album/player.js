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
    dots: document.getElementById("dots"),
  };

  let started = false;
  let seeking = false;

  buildDots(SONGS.length);
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
      updateDots(index);
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
    },
    onStateChange: (isPlaying, isLoading, isError) => {
      els.playPauseBtn.textContent = isPlaying ? "❚❚" : "▶";
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
      updateDots(idx);
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
    updateDots(idx);
  }

  function updateNowPlaying(index) {
    els.songTitle.textContent = SONGS[index].title;
    els.songArtist.textContent = SONGS[index].artist;
  }

  function setBackground(coverUrl) {
    els.background.style.backgroundImage = `url(${coverUrl})`;
  }

  function buildDots(count) {
    els.dots.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const d = document.createElement("div");
      d.className = "dot";
      els.dots.appendChild(d);
    }
    updateDots(0);
  }

  function updateDots(activeIndex) {
    [...els.dots.children].forEach((d, i) => {
      d.classList.toggle("active", i === activeIndex);
    });
  }

  // ---------- 離線快取（Service Worker） ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {
        // 註冊失敗不影響主要功能，安靜忽略即可
      });
    });
  }
});
