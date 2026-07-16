/* ============================================
   coverflow.js
   負責封面卡片的排列、3D 視覺效果、滑動手勢與慣性。
   只處理「畫面上封面怎麼動」，不管音樂播放邏輯，
   切歌時透過 onChange callback 通知外部（player.js）。
   ============================================ */

const CoverFlow = (function () {
  let trackEl = null;
  let cards = [];
  let current = 0;
  let total = 0;
  let onChangeCallback = null;

  // 拖曳/慣性用的狀態
  let dragging = false;
  let startX = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;

  function init(containerEl, items, startIndex, onChange) {
    trackEl = containerEl;
    total = items.length;
    current = startIndex || 0;
    onChangeCallback = onChange;

    trackEl.innerHTML = "";
    cards = items.map((item, i) => {
      const card = document.createElement("div");
      card.className = "cf-card";
      card.style.backgroundImage = `url(${item.cover})`;

      // 圖片載入失敗時的友善畫面（用 CSS class 顯示錯誤樣式）
      const testImg = new Image();
      testImg.onerror = () => card.classList.add("cf-card-error");
      testImg.src = item.cover;

      card.addEventListener("click", (e) => {
        if (dragging) return; // 避免拖曳結束時誤觸點擊
        if (i === current) {
          // 點中央封面：交給外部處理播放/暫停
          onChangeCallback && onChangeCallback(current, "toggle");
        } else {
          goTo(i);
        }
      });

      trackEl.appendChild(card);
      return card;
    });

    attachGestures();
    render();
  }

  function render() {
    cards.forEach((card, i) => {
      const offset = i - current;
      const abs = Math.abs(offset);

      if (abs > 3) {
        card.style.opacity = "0";
        card.style.pointerEvents = "none";
        return;
      }

      card.style.opacity = "1";
      card.style.pointerEvents = "auto";

      const translateX = offset * 76; // 百分比
      const scale = offset === 0 ? 1 : Math.max(0.68, 0.86 - abs * 0.08);
      const rotateY = offset === 0 ? 0 : (offset > 0 ? -28 : 28);
      const blur = offset === 0 ? 0 : Math.min(3, abs * 1.4);
      const brightness = offset === 0 ? 1 : Math.max(0.4, 1 - abs * 0.25);
      const z = 100 - abs;

      card.style.zIndex = z;
      card.style.filter = `brightness(${brightness}) blur(${blur}px)`;
      card.style.transform =
        `translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`;
    });
  }

  function goTo(index, silent) {
    if (index < 0) index = total - 1;
    if (index >= total) index = 0;
    current = index;
    render();
    if (!silent) {
      onChangeCallback && onChangeCallback(current, "change");
    }
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }
  function getCurrent() { return current; }

  /* ------- 手勢與慣性滑動 -------
     做法：拖曳過程即時跟著手指移動（乘上阻尼），
     放開時依「拖曳距離」與「放開瞬間速度」估算要
     切過幾張卡片，再交給 CSS transition 做 easing 動畫，
     達到「有慣性感」但不需要自己寫物理動畫迴圈。
  */
  function attachGestures() {
    trackEl.addEventListener("touchstart", onStart, { passive: true });
    trackEl.addEventListener("touchmove", onMove, { passive: true });
    trackEl.addEventListener("touchend", onEnd);

    trackEl.addEventListener("mousedown", onStart);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
  }

  function getX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function onStart(e) {
    dragging = true;
    startX = lastX = getX(e);
    lastT = Date.now();
    velocity = 0;
    trackEl.classList.add("cf-dragging");
  }

  function onMove(e) {
    if (!dragging) return;
    const x = getX(e);
    const now = Date.now();
    const dt = Math.max(1, now - lastT);
    velocity = (x - lastX) / dt; // px per ms
    lastX = x;
    lastT = now;
  }

  function onEnd(e) {
    if (!dragging) return;
    dragging = false;
    trackEl.classList.remove("cf-dragging");

    const totalDx = lastX - startX;
    const threshold = 40; // px，超過這個距離才算滑動而非點擊

    if (Math.abs(totalDx) < threshold && Math.abs(velocity) < 0.3) {
      // 幾乎沒移動，當作點擊處理（click 事件會自己觸發）
      return;
    }

    // 依距離 + 放開瞬間速度估算要跳幾張（模擬慣性）
    let steps = Math.round(Math.abs(totalDx) / 90);
    if (Math.abs(velocity) > 0.6) steps += 1; // 甩得快，多滑一張
    steps = Math.max(1, Math.min(steps, total - 1));

    if (totalDx < 0) {
      goTo(current + steps);
    } else {
      goTo(current - steps);
    }
  }

  return { init, goTo, next, prev, getCurrent, render };
})();
