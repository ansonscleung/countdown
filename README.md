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

運作原理：

- Netlify 只會發佈靜態檔案，唔會執行 `server.mjs`。`netlify.toml` 因此會喺部署時執行 `npm run build`，將 build environment 入面嘅 `COUNTDOWN_TARGET` 寫入瀏覽器會載入嘅 `countdown-config.js`。
- 本機用 `npm start` 時，`server.mjs` 亦會讀取 `COUNTDOWN_TARGET`（或者 `.env`）並注入設定。
- `countdown.js` 讀取呢個 global，讀唔到就 fallback 返預設值。頁面上嘅 "Until ..." 字樣會自動跟住新目標生成，時區顯示自訂目標會變成 `UTC±HH:MM` 格式。

Netlify 改完環境變數後要重新 deploy；deploy log 應該會見到 `Generated countdown-config.js for ...`。如果 Netlify UI 有自訂 Build command 或 Publish directory，請分別設成 `npm run build` 同專案根目錄（`.`），或者清除 override 等佢使用 `netlify.toml`。

想永久改預設值（連 env 都唔使設），就編輯 `countdown.js` 頂部嘅 `DEFAULT_TARGET`。

## 檔案結構

| 檔案 | 內容 |
| --- | --- |
| `index.html` | 版面骨架 |
| `styles.css` | Pixel 字體排版（Google Fonts：Press Start 2P + VT323） |
| `countdown.js` | 倒數邏輯（純函數，有測試） |
| `countdown-config.js` | Build 時產生、供靜態 host 瀏覽器讀取嘅設定 |
| `build-config.mjs` | 將 `COUNTDOWN_TARGET` 轉成瀏覽器設定 |
| `sprites.js` | Pixel-art 角色系統：字元地圖 → offscreen canvas → nearest-neighbour 放大 |
| `app.js` | Canvas 冬夜場景：分層雪地、星空、巡遊人物、破曉動畫 |
| `server.mjs` | 零依賴 static server（`node:http`） |

## 一句講晒啲角色

全部 sprite 都係自創 pixel 詮釋（唔係官方美術），靈感嚟自小說登場人物：Moomintroll、Little My、Too-ticky（提燈籠）、The Ancestor（攞蠟燭）、Groke（黑影慢行、地上留霜痕）。版權方面自用 OK，唔好攞去商用。
