<div align="center">
  <img src="public/apple-touch-icon.png" alt="Icon" width="100" />

  # X Video Downloader

  <p>
    X（旧Twitter）のポストURLを貼るだけで、対象ポストの動画を抽出・保存できるWebアプリです。<br>
    Paste a post URL to extract and download the video in seconds.
  </p>

  <p>
    <a href="https://x-video-downloader.riverapp.jp/" target="_blank">
      <img src="https://img.shields.io/badge/今すぐ利用する-34D399?style=for-the-badge" alt="今すぐ利用する">
    </a>
    <a href="https://x-video-downloader.riverapp.jp/" target="_blank">
      <img src="https://img.shields.io/badge/Start_App-34D399?style=for-the-badge" alt="Start App">
    </a>
  </p>

  <img src="public/screenshot.png" alt="App Screenshot" width="800" />
</div>

## ✨ Features
- ポストURLから動画を抽出してダウンロード
- 公開ポストに対応（サーバーに動画を保存しない設計）
- FAQ / 使い方ページを同梱（`/faq.html`）
- シンプルなUIで日本語/英語ユーザーにも分かりやすい導線

## 🛠 Tech Stack
- Vite + React + TypeScript
- Tailwind CSS
- Supabase Edge Functions

## 🚀 Setup
```bash
npm install
```

` .env.local` を作成し、ローカル環境変数を設定します。
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
```

起動:
```bash
npm run dev
```
