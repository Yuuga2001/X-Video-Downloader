const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface RequestBody {
  url: string;
}

const extractTweetId = (postUrl: string): string | null => {
  const match = postUrl.match(/status\/(\d+)/);
  return match ? match[1] : null;
};

const pickBestMp4Variant = (
  variants: Array<{ url?: string; content_type?: string; bitrate?: number }>
) => {
  const mp4s = variants
    .filter((variant) => variant.url && variant.content_type === "video/mp4")
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
  return mp4s[0]?.url ?? null;
};

const collectMediaCandidates = (data: unknown) => {
  const results: Array<Record<string, unknown>> = [];
  const seen = new Set<object>();
  const queue: unknown[] = [data];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") {
      continue;
    }
    if (seen.has(current as object)) {
      continue;
    }
    seen.add(current as object);

    if (Array.isArray(current)) {
      for (const item of current) {
        queue.push(item);
      }
      continue;
    }

    const obj = current as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if ((key === "mediaDetails" || key === "media") && Array.isArray(value)) {
        results.push(...(value as Array<Record<string, unknown>>));
        continue;
      }
      queue.push(value);
    }
  }

  return results;
};

const collectMp4Urls = (data: unknown) => {
  const results: string[] = [];
  const seen = new Set<object>();
  const queue: unknown[] = [data];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") {
      if (typeof current === "string" && current.includes(".mp4")) {
        results.push(current);
      }
      continue;
    }
    if (seen.has(current as object)) {
      continue;
    }
    seen.add(current as object);

    if (Array.isArray(current)) {
      for (const item of current) {
        queue.push(item);
      }
      continue;
    }

    const obj = current as Record<string, unknown>;
    for (const value of Object.values(obj)) {
      queue.push(value);
    }
  }

  return results;
};

const decodeUrl = (url: string) =>
  url.replace(/\\u0026/g, "&").replace(/\\\//g, "/");

const fetchJson = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });

  if (!response.ok) {
    return null;
  }

  try {
    const json = await response.json();
    if (json && typeof json === "object") {
      return json;
    }
  } catch {
    return null;
  }

  return null;
};

const fetchThirdPartyData = async (tweetId: string) => {
  const endpoints = [
    `https://api.vxtwitter.com/Twitter/status/${tweetId}`,
    `https://api.vxtwitter.com/status/${tweetId}`,
    `https://api.fxtwitter.com/status/${tweetId}`,
    `https://api.fxtwitter.com/Twitter/status/${tweetId}`,
  ];

  for (const endpoint of endpoints) {
    const data = await fetchJson(endpoint);
    if (data && Object.keys(data as Record<string, unknown>).length > 0) {
      return data;
    }
  }

  return null;
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleDownload(url: URL): Promise<Response> {
  const videoUrl = url.searchParams.get("videoUrl");

  if (!videoUrl) {
    return jsonResponse({ error: "Missing videoUrl parameter" }, 400);
  }

  const fetchVideo = async (headers: Record<string, string>) => {
    return await fetch(videoUrl, { headers });
  };

  const baseHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "video/*,*/*;q=0.8",
    Referer: "https://x.com/",
    Origin: "https://x.com",
  };

  let videoResponse = await fetchVideo(baseHeaders);
  if (!videoResponse.ok) {
    videoResponse = await fetchVideo({
      ...baseHeaders,
      Referer: "https://twitter.com/",
      Origin: "https://twitter.com",
    });
  }
  if (!videoResponse.ok) {
    videoResponse = await fetchVideo({
      "User-Agent": baseHeaders["User-Agent"],
      Accept: baseHeaders["Accept"],
    });
  }

  if (!videoResponse.ok) {
    return jsonResponse(
      { error: `Failed to fetch video (${videoResponse.status})` },
      videoResponse.status
    );
  }

  return new Response(videoResponse.body, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type":
        videoResponse.headers.get("Content-Type") || "video/mp4",
      "Content-Disposition": "attachment; filename=video.mp4",
      "Content-Length": videoResponse.headers.get("Content-Length") || "",
    },
  });
}

async function handleExtract(request: Request): Promise<Response> {
  const { url: postUrl }: RequestBody = await request.json();

  if (
    !postUrl ||
    (!postUrl.includes("x.com") && !postUrl.includes("twitter.com"))
  ) {
    return jsonResponse({ error: "Invalid X/Twitter URL" }, 400);
  }

  const tweetId = extractTweetId(postUrl);
  if (!tweetId) {
    return jsonResponse({ error: "Invalid X/Twitter status URL" }, 400);
  }

  const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en`;
  let data = await fetchJson(syndicationUrl);

  if (!data || Object.keys(data as Record<string, unknown>).length === 0) {
    data = await fetchThirdPartyData(tweetId);
  }

  if (!data) {
    return jsonResponse({ error: "Failed to fetch post metadata" }, 502);
  }

  const mediaCandidates = collectMediaCandidates(data);
  let videoUrl: string | null = null;

  for (const media of mediaCandidates) {
    const mediaType = media?.type;
    if (mediaType && mediaType !== "video" && mediaType !== "animated_gif") {
      continue;
    }

    const variants = Array.isArray(
      (media?.video_info as Record<string, unknown>)?.variants
    )
      ? (
          media.video_info as {
            variants: Array<Record<string, unknown>>;
          }
        ).variants
      : Array.isArray(media?.video_variants)
        ? (media.video_variants as Array<Record<string, unknown>>)
        : Array.isArray(media?.variants)
          ? (media.variants as Array<Record<string, unknown>>)
          : [];

    if (variants.length === 0) {
      continue;
    }

    videoUrl = pickBestMp4Variant(
      variants as Array<{
        url?: string;
        content_type?: string;
        bitrate?: number;
      }>
    );
    if (videoUrl) {
      break;
    }
  }

  if (!videoUrl) {
    const mp4Urls = collectMp4Urls(data).map(decodeUrl);
    if (mp4Urls.length > 0) {
      videoUrl = mp4Urls[0];
    }
  }

  if (!videoUrl) {
    return jsonResponse({ error: "No video found in this post" }, 404);
  }

  return jsonResponse({ videoUrl }, 200);
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      if (request.method === "GET" && pathname === "/download") {
        return await handleDownload(url);
      }

      if (request.method === "POST" && pathname === "/") {
        return await handleExtract(request);
      }

      return jsonResponse({ error: "Not Found" }, 404);
    } catch (error) {
      return jsonResponse(
        {
          error:
            error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  },
};
