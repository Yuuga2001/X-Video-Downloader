<a href="https://x-post-downloader.riverapp.jp/" target="_blank">
  <img src="https://img.shields.io/badge/今すぐ利用する-34D399?style=for-the-badge" alt="今すぐ利用する">
</a>
<a href="https://x-post-downloader.riverapp.jp/" target="_blank">
  <img src="https://img.shields.io/badge/Start_App-34D399?style=for-the-badge" alt="Start App">
</a>

# X Video Downloader

X（旧Twitter）のポストURLを貼るだけで、対象ポストの動画を抽出・保存できるWebアプリです。  
Paste a post URL to extract and download the video in seconds.

![App Screenshot](public/screenshot.png)

## Features
- ポストURLから動画を抽出してダウンロード
- 公開ポストに対応（サーバーに動画を保存しない設計）
- FAQ / 使い方ページを同梱（`/faq.html`）
- シンプルなUIで日本語/英語ユーザーにも分かりやすい導線

## Tech Stack
- Vite + React + TypeScript
- Tailwind CSS
- Supabase Edge Functions

## Setup
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

## SEO Assets
- `public/robots.txt`
- `public/sitemap.xml`
- `public/og-image.png`
- `public/screenshot.png`
- `public/faq.html`

## Performance Monitoring (LCP/CLS)
開発環境では `LCP` / `CLS` を `console.log` に出力します。改善や本番計測を行う場合は、`src/vitals.ts` の `reportWebVitals` に送信先を追加してください。

## Deployment (Amplify)
Amplify の環境変数に以下を設定してください。
```bash
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Supabase 側の Edge Function `extract-x-video` も本番にデプロイが必要です。
