# 🎛 DJM-2BT // Dual Bluetooth Headphone DJ Mixer Console

> **Zero-Install, Single-File Web Audio DJ Console for Sharing Music & Video across Two Arbitrary Bluetooth (or Wired) Headphones on macOS, Windows & Linux.**
>
> **免安裝、單一 HTML 檔案的雙藍牙耳機混音與延遲同步控制台** —— 專為解決 macOS 無法直覺共享音訊至兩隻「非 Apple 廠牌」藍牙耳機（如 Sony、Bose、Soundcore、Sennheiser 與 AirPods 混搭）而設計。

---

## 📖 為什麼要做這個專案？ (Why This Exists)

在 iPhone / iPad 上，Apple 原生的「共享音訊（Audio Sharing）」**只限定配備自家 H1 / H2 / W1 晶片的 AirPods 或 Beats 耳機**；只要其中一人戴的是 Sony、Soundcore、Bose 等第三方藍牙耳機，就無法一起聽歌。

而在 **macOS（Mac mini / MacBook / iMac）** 上，雖然系統內建了「音訊 MIDI 設定（Audio MIDI Setup）」可以建立「多重輸出裝置（Multi-Output Device）」，但實際操作有三大痛點：
1. **設定繁瑣且鎖死音量鍵**：一旦切換至多重輸出裝置，Mac 鍵盤上的實體音量鍵就會完全失效，調整兩隻耳機的獨立音量必須層層點開系統工具。
2. **無法補償不同廠牌耳機的「藍牙解碼時間差（50ms–150ms）」**：macOS 內建的「漂移修正（Drift Correction）」只能對齊取樣時脈（Sample Clock），**無法針對快慢不同的兩隻耳機（例如延遲較低的 AirPods 搭配延遲較高的 Sony XM5）手動加入毫秒級延遲補償（Delay Offset）**。
3. **點歌與調整音量需要不斷切換視窗**。

**`DJM-2BT`** 透過瀏覽器原生的 **Web Audio API + `HTMLMediaElement.setSinkId()` + `getDisplayMedia()`**，用**單一靜態 HTML 檔案（0 安裝、0 後端、0 外部相依套件）**建構出雙軌 DJ 混音與延遲補償控制台，一次解決上述所有問題！

---

## 🔍 與現有開源專案 / 解決方案比較 (Comparison with Existing Solutions)

| 方案 / 專案 | 類型 | 是否需安裝驅動 / App | 跨廠牌毫秒級延遲補償 (`0–300ms` Delay) | 獨立音量 + DJ Crossfader | 跨平台支援 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **DJM-2BT (本專案)** | **單一 HTML 網頁 (Web Audio)** | ❌ **完全免安裝** (打開瀏覽器即用) | ✅ **支援** (`DelayNode` 1ms 精度微調) | ✅ **支援** (含 `SOLO` / `MUTE` / `150%` 增益) | **macOS / Windows / Linux** (Chrome / Edge / Brave) |
| **macOS 內建 `音訊 MIDI 設定`** | 系統內建工具 | ❌ 免安裝 | ❌ 不支援 (僅支援時脈漂移修正) | ⚠️ 介面藏在深處，且會鎖死鍵盤音量鍵 | 僅 macOS |
| **[PairPods](https://github.com/wozniakpawel/PairPods)** / **[Tutti](https://github.com/BarryBarrywu/tutti)** | 原生 macOS Menu Bar App (Swift) | ⚠️ 需安裝 App / Homebrew Cask | ❌ 不支援手動毫秒級延遲推桿 | ✅ 支援選單列獨立音量 | 僅 macOS |
| **[BlackHole](https://github.com/ExistentialAudio/BlackHole)** / **[BackgroundMusic](https://github.com/kyleneideck/BackgroundMusic)** | macOS 虛擬音效卡驅動 (HAL Driver) | ⚠️ 需安裝核心音訊驅動並重開機 | ❌ 不支援 | ⚠️ 需搭配 DAW 或額外設定 | 僅 macOS |

---

## 💻 支援的作業系統與瀏覽器 (Supported Systems & Browsers)

### 1. 作業系統 (Operating Systems)
* **主要設計目標：macOS**（Mac mini、MacBook Air、MacBook Pro、iMac、Mac Studio）。
* **相容桌面系統：Windows 10 / 11、Linux**（只要作業系統支援同時連接兩隻藍牙音訊輸出裝置，或「1 隻藍牙耳機 + 1 隻有線耳機」皆可運作）。
* ❌ **不支援 iOS / iPadOS / Android 手機瀏覽器**：由於 Apple 在 iOS 底層（`AVAudioSession`）硬體鎖死同時只能啟用單一標準藍牙 A2DP 路由，且行動版瀏覽器不支援 `getDisplayMedia` 分頁音訊擷取與 `setSinkId` 多重輸出。

### 2. 瀏覽器需求 (Browser Requirements)
* ✅ **Google Chrome**（建議 v110 以上）
* ✅ **Microsoft Edge** / **Brave** / **Arc**（Chromium 核心瀏覽器）
* ❌ **不支援 Safari / Firefox**：因 Safari 與 Firefox 尚未完整實作 Web Audio `setSinkId()` 多重硬體輸出路由與分頁音訊擷取 API。

---

## 🎯 適用場景 (Use Cases)

1. **情侶 / 室友 / 朋友在電腦前共用兩隻不同廠牌耳機聽歌或追劇**：
   * 一人戴 Sony、一人戴 AirPods / Soundcore / Bose，一起聽 **YouTube Music、Spotify、YouTube、Netflix**，各自調整最舒適的音量。
2. **深夜宿舍 / 圖書館 / 辦公室靜音共享**：
   * 不能開喇叭外放時，直接將電腦音訊分流給兩副耳機並各自控制音量。
3. **「1 隻有線耳機 + 1 隻藍牙耳機」零時間差同步**：
   * 有線耳機幾乎是 `0ms` 延遲，而藍牙耳機約有 `100ms–200ms` 延遲。透過本工具將有線耳機那一軌的 **`SYNC DELAY`** 往右拉到約 `120ms–180ms`，兩人聽到的節拍就能完美重疊！
4. **本地無損音樂檔（MP3 / FLAC / WAV / M4A）雙耳機直推監聽**：
   * 使用內建的 `載入本地音訊檔` 功能，完全不需開啟分頁共享即可直接雙耳機同步播放。

---

## ⚠️ 已知限制與「非 Apple 藍牙耳機 Buffer 延遲」深度排解指南 (Limitations & Bluetooth Latency Guide)

如果你在 macOS 上同時連接兩隻藍牙耳機（特別是包含 Sony、Bose、Soundcore 等非 Apple 藍牙耳機），偶爾遇到**延遲（Lag）、慢半拍或音質變悶**，這是藍牙底層物理特性所致，請務必參考以下排解方式：

### 1. 為什麼非 Apple 藍牙耳機同時分享會有 Buffer 延遲？
* **單一藍牙天線分時多工（TDM）**：
  Apple 原生共享給兩隻 AirPods 時，是利用 H1/H2 晶片私有協定廣播同一份訊號；但當 Mac 連接兩隻標準藍牙（A2DP）耳機時，Mac 內部的單一藍牙晶片必須把頻寬切半——**第 1 毫秒傳封包給耳機 A、第 2 毫秒傳封包給耳機 B**。
* **macOS 防斷音自動放大緩衝（Jitter Buffer）**：
  一旦周遭有 `2.4GHz` 訊號干擾導致掉封包，macOS 的 `bluetoothd` 為了防止音樂破音，會**自動將受干擾耳機的 Buffer 緩衝區拉大 `50ms ~ 200ms`**，造成該耳機開始慢半拍。
* **👉 解法**：點擊 DJ 台上方的 **`[SYNC] FLUSH BUFFER (重置緩衝)`** 按鈕，程式會在 `0.02 秒` 內抽乾並重置音訊管線，立刻消除累積的緩衝延遲！

### 2. 頭號殺手：請關閉耳機的「一對二多點連線（Multipoint）」！
* 許多高階耳罩耳機（如 **Sony WH-1000XM5 / XM4**、**Bose QC Ultra**）支援同時連著手機與電腦。
* 當你的耳機連著 Mac 進行雙耳機串流，**背景又同時連著你的 iPhone 時**，耳機晶片會不斷分心去跟手機輪詢通訊，導致 Mac 端的藍牙封包嚴重塞車卡頓！
* **👉 解法**：在雙耳機共享期間，**請先將手機的藍牙關閉（或在手機上暫時斷開該耳機）**，讓耳機專心一對一連著 Mac，卡頓感會立刻消失 80% 以上。

### 3. AirPods 與第三方耳機混搭時的「先天解碼速度差」
* AirPods 在 macOS 上有 Apple 晶片最佳化，延遲通常比第三方主動降噪耳機（如 Sony XM5）快約 `80ms ~ 120ms`。
* **👉 解法**：在 DJ 台上，把**比較快的那隻耳機（例如 AirPods）的 `SYNC DELAY` 推桿往右調至 `80ms ~ 120ms`**（讓快的耳機等慢的耳機），兩個人聽到的節拍就會完全同步。

### 4. 音質突然變得像「講電話」一樣悶？（macOS 麥克風輸入陷阱）
* 當藍牙耳機連上 Mac 時，如果 macOS 自動把其中一隻耳機選為「預設麥克風輸入（Input Device）」，該耳機會強制切換成「雙向通話模式（HFP，單聲道 `16kHz / 24kHz`）」，音質會嚴重劣化。
* **👉 解法**：打開 Mac **「系統設定」➔「聲音」➔「輸入（Input）」**，將麥克風改選為 **Mac 內建麥克風** 或 **外接螢幕麥克風**（不要選任何一隻藍牙耳機），音質就會立刻恢復滿血雙聲道立體聲（`44.1kHz / 48kHz`）。

### 5. Mac mini 用戶特別注意：`2.4GHz` 干擾
* Mac mini 的藍牙天線位於機身底部圓蓋處，極易受到背後 USB-A 3.0 外接硬碟/Hub 以及 `2.4GHz` Wi-Fi 干擾。建議 Mac mini 用戶改連 **`5GHz` Wi-Fi**，並避免將未屏蔽的 USB 3.0 裝置緊貼機身底部。

---

## 🚀 快速開始 (Quick Start)

### 方式 A：直接透過 GitHub Pages 線上開啟（0 安裝、最推薦！）
直接使用 **Google Chrome**（或 Edge / Brave / Arc）點開下方公開網址即可立即使用，**完全不需要安裝 Python 或啟動任何本地伺服器**（建議直接加入 Chrome 書籤）：

👉 **Live Demo (GitHub Pages)：[https://lukas19990816.github.io/djm-2bt-dual-headphone-deck/](https://lukas19990816.github.io/djm-2bt-dual-headphone-deck/)**

### 方式 B：在本地端執行 (Local Execution)
由於 Chrome 的 `getDisplayMedia` 與 `setSinkId` 安全限制要求頁面必須在 `https://` 或 `http://localhost` 下執行（直接雙擊 `file://` 會被瀏覽器阻擋分頁擷取）：

1. **macOS 一鍵啟動**：
   直接雙擊專案內的 `launch-mac.command`（若首次執行遇到權限提示，可在終端機執行 `chmod +x launch-mac.command`）。
2. **或是使用一行指令啟動**：
   ```bash
   python3 -m http.server 8765 --bind 127.0.0.1
   ```
   接著使用 Google Chrome 打開 **`http://localhost:8765`**。

### 操作 3 步驟：
1. **連接耳機**：將兩隻藍牙耳機連上電腦，點擊 **`[1] SCAN BLUETOOTH SINKS`**，程式會自動過濾掉內建喇叭並為 `DECK A` 與 `DECK B` 選好兩隻外接耳機。
2. **點歌**：在 **`JUKEBOX DECK`** 輸入歌名按 Enter（或點 `YT MUSIC 點歌窗` / `SPOTIFY 點歌窗`），螢幕右側會彈出並排的迷你點歌窗。
3. **綁定音訊**：點擊 **`[2] LINK TAB AUDIO`**，選擇剛剛彈出的點歌窗分頁並勾選 **「一併分享分頁音訊 (Also share tab audio)」**。之後在 DJ 台搜尋新歌都會固定在同一個小視窗內切換，**換歌永遠不必重新按共享！**

---

## 🎨 歡迎 Fork 並用你的 AI Agent 客製化專屬 DJ 台配色！(Vibe-Coding & AI Agent Friendly)

整個專案刻意設計為 **單一、零外部相依的 `index.html` 檔案**，並在檔案開頭整理好所有的 `:root` CSS 主題變數。

非常歡迎你 **Fork** 這個專案，直接把 `index.html` 丟給你的 AI Coding Agent（例如 **Google Antigravity、Claude Code、Cursor、GitHub Copilot、Windsurf**），用自然語言改成你喜歡的硬體風格！

### 💡 可以直接複製給 AI Agent 的 Prompt 範例：
* **工業風白色合成器（Teenage Engineering OP-1 風格）**：
  > *"請幫我修改 `index.html` 的 `:root` CSS 變數與樣式，把這台 DJ 混音台改成 Teenage Engineering OP-1 的淺灰白工業設計風格，搭配橘色（`#ff5500`）與藍色（`#0066ff`）實體旋鈕推桿點綴。"*
* **80 年代復古 Synthwave / Cyberpunk 霓虹風**：
  > *"請幫我把 `index.html` 改成 80 年代復古 Synthwave 風格，使用深紫黑背景、霓虹洋紅（Deck A）與電光青（Deck B）配色，並幫頻譜儀加上漸層發光效果。"*
* **新增 3 段式 EQ 等化器（Low / Mid / High）**：
  > *"請在 `index.html` 的 Web Audio 圖（`buildLowLatencyGraph`）中，幫 Deck A 跟 Deck B 各自加上 `BiquadFilterNode` 的 BASS / TREBLE 旋鈕或推桿！"*

---

## 🛡 資安與零漏洞架構 (Security & Zero-Vulnerability Architecture)

* **零執行期相依套件（0 npm Dependencies / 0 CVEs）**：不使用任何第三方 JavaScript 框架或外部 CDN 腳本，徹底杜絕供應鏈攻擊（Supply-Chain Attacks）。
* **內嵌靜態復古像素圖示（[`pixelarticons`](https://github.com/halfmage/pixelarticons), MIT License）**：所有 8-bit 復古圖示皆以純靜態 `<svg><path>` 座標內嵌於 HTML 中，無任何外部網路請求。
* **嚴格的 `Content-Security-Policy` (CSP)**：於 HTML Header 鎖死 `connect-src 'none'; object-src 'none'`，確保頁面無法對外發送任何遙測或追蹤連線。
* **防範藍牙名稱 DOM XSS**：全面使用 `replaceChildren()`、`new Option()` 與 `textContent` 渲染周遭藍牙設備名稱，絕不使用 `innerHTML`。

---

## 📄 授權條款 (License)

本專案採用 **[MIT License](./LICENSE)** 開源授權，歡迎自由使用、修改、Fork 與分享！
