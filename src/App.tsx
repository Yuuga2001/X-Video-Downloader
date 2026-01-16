import { useState } from 'react';
import { Download, AlertCircle, Loader2 } from 'lucide-react';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const handleExtract = async () => {
    if (!url.trim()) {
      setError('URLを入力してください');
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
        setError(data.error || '動画の抽出に失敗しました');
        return;
      }

      setVideoUrl(data.videoUrl);
    } catch (err) {
      setError('エラーが発生しました。もう一度お試しください。');
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
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              X 動画ダウンローダー
            </h1>
            <p className="text-slate-600">
              ポストのURLを入力して動画を保存
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleExtract()}
                placeholder="https://x.com/username/status/..."
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
                  処理中...
                </>
              ) : (
                '動画を抽出'
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
                  動画を見つけました！
                </p>
                <button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  動画を保存
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              公開ポストのみ対応 | 動画データはサーバーに保存されません
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
