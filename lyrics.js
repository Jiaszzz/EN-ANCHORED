/* ============================================
   lyrics.js
   負責「同步歌詞」功能：
   - 把 LRC 格式的文字（[00:12.34]歌詞內容）解析成時間陣列
   - 根據目前播放秒數，找出應該反白的那一句
   不處理畫面顯示，畫面渲染交給 player.js。
   ============================================ */

const Lyrics = (function () {

  /* 把一整段 LRC 文字解析成 [{ time: 12.34, text: "歌詞內容" }, ...]
     並依時間排序。格式不符的行會被忽略（不會讓程式壞掉）。 */
  function parse(lrcText) {
    if (!lrcText || typeof lrcText !== "string") return [];

    const lines = lrcText.split("\n");
    const result = [];

    // 支援同一行有多個時間標籤，例如 [00:12.34][00:45.00]副歌歌詞
    const tagPattern = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const tags = [...line.matchAll(tagPattern)];
      if (tags.length === 0) continue;

      const text = line.replace(tagPattern, "").trim();
      if (!text) continue; // 純時間標籤、沒有歌詞內容的行（例如作詞作曲資訊）就跳過

      for (const tag of tags) {
        const minutes = parseInt(tag[1], 10);
        const seconds = parseInt(tag[2], 10);
        const msRaw = tag[3] || "0";
        // 毫秒可能是 2 位數（.34）或 3 位數（.340），統一換算成秒
        const ms = parseInt(msRaw.padEnd(3, "0"), 10);
        const time = minutes * 60 + seconds + ms / 1000;
        result.push({ time, text });
      }
    }

    result.sort((a, b) => a.time - b.time);
    return result;
  }

  /* 根據目前播放秒數，回傳應該反白的那一句的索引值（陣列位置）。
     找不到（例如還沒開始唱）回傳 -1。
     用簡單線性掃描即可，一首歌歌詞行數不多，效能不是問題。 */
  function getActiveIndex(lyricsArray, currentTime) {
    if (!lyricsArray || lyricsArray.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < lyricsArray.length; i++) {
      if (lyricsArray[i].time <= currentTime) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }

  return { parse, getActiveIndex };
})();
