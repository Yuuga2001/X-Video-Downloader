import { useEffect, useMemo, useState } from 'react';
import { Download, AlertCircle, Loader2 } from 'lucide-react';

type Language = 'ja' | 'en';

const translations = {
  ja: {
    title: 'X 動画ダウンローダー',
    subtitle: 'ポストのURLを入力して動画を保存',
    placeholder: 'https://x.com/username/status/...',
    extract: '動画を抽出',
    processing: '処理中...',
    found: '動画を見つけました！',
    download: '動画を保存',
    faq: '使い方・FAQ',
    footer: '公開ポストのみ対応 | 動画データはサーバーに保存されません',
    errors: {
      enterUrl: 'URLを入力してください',
      generic: 'エラーが発生しました。もう一度お試しください。',
      extract: '動画の抽出に失敗しました',
    },
    langLabel: 'English',
    langHref: '?lang=en',
  },
  en: {
    title: 'X Video Downloader',
    subtitle: 'Paste a post URL to extract and download the video',
    placeholder: 'https://x.com/username/status/...',
    extract: 'Extract Video',
    processing: 'Processing...',
    found: 'Video found!',
    download: 'Download Video',
    faq: 'How to Use / FAQ',
    footer: 'Public posts only | Videos are not stored on our server',
    errors: {
      enterUrl: 'Please enter a URL.',
      generic: 'Something went wrong. Please try again.',
      extract: 'Failed to extract video.',
    },
    langLabel: '日本語',
    langHref: '/',
  },
};

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const lang = useMemo<Language>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('lang') === 'en' ? 'en' : 'ja';
  }, []);
  const t = translations[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const handleExtract = async () => {
    if (!url.trim()) {
      setError(t.errors.enterUrl);
      return;
    }

    setLoading(true);
    setError('');
    setVideoUrl('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-x-video`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || t.errors.extract);
        return;
      }

      setVideoUrl(data.videoUrl);
    } catch (err) {
      setError(t.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (videoUrl) {
      const downloadUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-x-video/download?videoUrl=${encodeURIComponent(videoUrl)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'video.mp4';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8 space-y-2">
            <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
              <a className="hover:text-slate-700 underline underline-offset-4" href={t.langHref}>
                {t.langLabel}
              </a>
              <span className="text-slate-300">|</span>
              <a className="hover:text-slate-700 underline underline-offset-4" href="/faq.html">
                {t.faq}
              </a>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-1">
              {t.title}
            </h1>
            <p className="text-slate-600">
              {t.subtitle}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleExtract()}
                placeholder={t.placeholder}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-slate-800"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleExtract}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t.processing}
                </>
              ) : (
                t.extract
              )}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {videoUrl && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
                <p className="text-green-800 font-medium text-center">
                  {t.found}
                </p>
                <button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  {t.download}
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              {t.footer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
