# Moominland Midwinter — Countdown

用《Moominland Midwinter》冬夜做主題嘅全螢幕倒數頁：Moomintroll 喺雪地中間行嚟行去，Little My、Too-ticky、The Ancestor 同 Groke 會輪流行過，倒數歸零嗰刻天色會漸變破曉。

> "The darkest hour is just before the dawn"

## 運行方法

需要 Node.js 18 或以上。喺專案資料夾入面執行：

```bash
npm start
```

然後打開 <http://localhost:3000>。

想用其他 port：

```bash
PORT=8080 npm start        # macOS / Linux
set PORT=8080 && npm start # Windows cmd
```

### 點解唔可以直接 double-click index.html？

因為個網頁用咗 ES modules（`<script type="module">`），瀏覽器基於 CORS 安全限制唔准 `file://` 協議載入 module script，所以一定要經 HTTP 打開——即係用上面嘅 `npm start`，或者任何 static server（例如 `npx serve .`）都得。

## 操作

- 右下角 **Enter fullscreen**：切換全螢幕
- 右下角 **Motion: on/off**：開關動畫（第一次進場會跟隨系統 prefers-reduced-motion 設定）
- 倒數結束（2026-08-28 18:00 HKT）後：天色轉暖、太陽升起、顯示 "The dawn is here."

## 測試

```bash
npm test
```

## 改倒數目標時間

預設目標係 `2026-08-28T18:00:00+08:00`。想改時間，用環境變數 `COUNTDOWN_TARGET`（ISO 8601 格式，建議帶 UTC offset）：

```bash
COUNTDOWN_TARGET=2026-12-25T20:00:00+08:00 npm start   # macOS / Linux
set COUNTDOWN_TARGET=2026-12-25T20:00:00+08:00 && npm start   # Windows cmd
$env:COUNTDOWN_TARGET = "2026-12-25T20:00:00+08:00"; npm start   # Windows PowerShell
```

運作原理：`server.mjs` 啟動時讀取 `COUNTDOWN_TARGET`，驗證係咪合法日期，然後將 `window.COUNTDOWN_CONFIG` 注入 `index.html`；`countdown.js` 讀取呢個 global，讀唔到（或者 env 無設/無效）就 fallback 返預設值。頁面上嘅 "Until ..." 字樣會自動跟住新目標生成，時區顯示自訂目標會變成 `UTC±HH:MM` 格式。

想永久改預設值（連 env 都唔使設），就編輯 `countdown.js` 頂部嘅 `DEFAULT_TARGET`。

## 檔案結構

| 檔案 | 內容 |
| --- | --- |
| `index.html` | 版面骨架 |
| `styles.css` | Pixel 字體排版（Google Fonts：Press Start 2P + VT323） |
| `countdown.js` | 倒數邏輯（純函數，有測試） |
| `sprites.js` | Pixel-art 角色系統：字元地圖 → offscreen canvas → nearest-neighbour 放大 |
| `app.js` | Canvas 冬夜場景：分層雪地、星空、巡遊人物、破曉動畫 |
| `server.mjs` | 零依賴 static server（`node:http`） |

## 一句講晒啲角色

全部 sprite 都係自創 pixel 詮釋（唔係官方美術），靈感嚟自小說登場人物：Moomintroll、Little My、Too-ticky（提燈籠）、The Ancestor（攞蠟燭）、Groke（黑影慢行、地上留霜痕）。版權方面自用 OK，唔好攞去商用。
