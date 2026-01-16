const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  url: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (req.method === "GET" && pathname.includes("/download")) {
      const videoUrl = url.searchParams.get("videoUrl");

      if (!videoUrl) {
        return new Response(
          JSON.stringify({ error: "Missing videoUrl parameter" }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const videoResponse = await fetch(videoUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!videoResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch video" }),
          {
            status: videoResponse.status,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(videoResponse.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": videoResponse.headers.get("Content-Type") || "video/mp4",
          "Content-Disposition": "attachment; filename=video.mp4",
          "Content-Length": videoResponse.headers.get("Content-Length") || "",
        },
      });
    }

    const { url: postUrl }: RequestBody = await req.json();

    if (!postUrl || !postUrl.includes("x.com") && !postUrl.includes("twitter.com")) {
      return new Response(
        JSON.stringify({ error: "Invalid X/Twitter URL" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const response = await fetch(postUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch post" }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const html = await response.text();

    let videoUrl: string | null = null;

    // Method 1: Look for MP4 URLs in meta tags (og:video, twitter:player:stream)
    const metaVideoMatch = html.match(/<meta\s+(?:property|name)="(?:og:video|twitter:player:stream)"\s+content="([^"]*\.(?:mp4|m3u8)[^"]*)"/i);
    if (metaVideoMatch) {
      videoUrl = metaVideoMatch[1];
    }

    // Method 2: Search for URLs with common video CDN patterns
    if (!videoUrl) {
      const cdnMatch = html.match(/(https:\/\/[^\s"<>]*(?:pbs\.twimg\.com|video\.twimg\.com|media\.twimg\.com)[^\s"<>]*\.mp4[^\s"<>]*)/i);
      if (cdnMatch) {
        videoUrl = cdnMatch[1];
      }
    }

    // Method 3: Look for video_info or media structure in embedded JSON
    if (!videoUrl) {
      const jsonMatch = html.match(/"video_info":\s*\{([^}]*"variants"[^}]*)\}/s);
      if (jsonMatch) {
        const variantsMatch = html.match(/"variants":\s*\[(.*?)\]\s*(?:,|\})/s);
        if (variantsMatch) {
          const variantsText = variantsMatch[1];
          const mp4Match = variantsText.match(/"url"\s*:\s*"(https:\/\/[^"]*\.mp4[^"]*)"/);
          if (mp4Match) {
            videoUrl = mp4Match[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
          }
        }
      }
    }

    // Method 4: Broader search for any MP4 URLs in the HTML
    if (!videoUrl) {
      const broadMatch = html.match(/(https:\/\/[^\s"<>]*\.mp4[^\s"<>]*)/i);
      if (broadMatch) {
        videoUrl = broadMatch[1];
      }
    }

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "No video found in this post" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ videoUrl }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
