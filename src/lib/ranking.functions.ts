import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  url: z.string().url(),
  keywords: z.array(z.string().min(1)),
  mode: z.enum(["combined", "individual"]).default("combined"),
  provider: z.enum(["google", "serpapi"]).default("google"),
  apiKey: z.string().optional(),
  searchEngineId: z.string().optional(),
});

export interface KeywordRanking {
  keyword: string;
  position: number | null;
  found: boolean;
  page: number | null;
  checked: boolean;
  error?: string;
  googleUrl: string;
}

function googleSearchUrl(keyword: string, domain?: string): string {
  const q = domain ? `${keyword} site:${domain}` : keyword;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

async function fetchRanking(
  keyword: string,
  data: z.infer<typeof InputSchema>,
  hostname: string,
): Promise<KeywordRanking> {
  try {
    let items: { link: string }[] = [];
    if (data.provider === "serpapi") {
      const searchUrl = new URL("https://serpapi.com/search");
      searchUrl.searchParams.set("api_key", data.apiKey!);
      searchUrl.searchParams.set("engine", "google");
      searchUrl.searchParams.set("q", keyword);
      searchUrl.searchParams.set("num", "10");
      searchUrl.searchParams.set("start", "0");
      searchUrl.searchParams.set("google_domain", "google.de");
      const res = await fetch(searchUrl.toString(), { signal: AbortSignal.timeout(20000) });
      if (!res.ok) {
        const text = await res.text();
        return {
          keyword,
          position: null,
          found: false,
          page: null,
          checked: true,
          error: `SerpApi-Fehler ${res.status}: ${text.slice(0, 200)}`,
          googleUrl: googleSearchUrl(keyword, hostname),
        };
      }
      const json = (await res.json()) as { organic_results?: { link: string }[] };
      items = json.organic_results || [];
    } else {
      const searchUrl = new URL("https://www.googleapis.com/customsearch/v1");
      searchUrl.searchParams.set("key", data.apiKey!);
      searchUrl.searchParams.set("cx", data.searchEngineId!);
      searchUrl.searchParams.set("q", keyword);
      searchUrl.searchParams.set("num", "10");
      searchUrl.searchParams.set("start", "1");
      const res = await fetch(searchUrl.toString(), { signal: AbortSignal.timeout(20000) });
      if (!res.ok) {
        const text = await res.text();
        return {
          keyword,
          position: null,
          found: false,
          page: null,
          checked: true,
          error: `Google API-Fehler ${res.status}: ${text.slice(0, 200)}`,
          googleUrl: googleSearchUrl(keyword, hostname),
        };
      }
      const json = (await res.json()) as { items?: { link: string }[] };
      items = json.items || [];
    }

    let position: number | null = null;
    for (let i = 0; i < items.length; i++) {
      const link = items[i].link;
      try {
        const itemHost = new URL(link).hostname.replace(/^www\./, "");
        if (itemHost === hostname || itemHost.endsWith(`.${hostname}`)) {
          position = i + 1;
          break;
        }
      } catch {
        // ignore malformed url
      }
    }

    return {
      keyword,
      position,
      found: position !== null,
      page: position !== null ? 1 : null,
      checked: true,
      googleUrl: googleSearchUrl(keyword, hostname),
    };
  } catch (err) {
    return {
      keyword,
      position: null,
      found: false,
      page: null,
      checked: true,
      error: err instanceof Error ? err.message : "Unbekannter Fehler",
      googleUrl: googleSearchUrl(keyword, hostname),
    };
  }
}

export const checkKeywordRankings = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<KeywordRanking[]> => {
    let hostname = "";
    try {
      hostname = new URL(data.url).hostname.replace(/^www\./, "");
    } catch {
      hostname = "";
    }

    const needsCx = data.provider === "google";
    if (!data.apiKey || (needsCx && !data.searchEngineId)) {
      if (data.mode === "combined") {
        const query = data.keywords.join(" ");
        return [
          {
            keyword: query,
            position: null,
            found: false,
            page: null,
            checked: false,
            googleUrl: googleSearchUrl(query, hostname),
          },
        ];
      }
      return data.keywords.map((keyword) => ({
        keyword,
        position: null,
        found: false,
        page: null,
        checked: false,
        googleUrl: googleSearchUrl(keyword, hostname),
      }));
    }

    if (data.mode === "combined") {
      const query = data.keywords.join(" ");
      return [await fetchRanking(query, data, hostname)];
    }

    return await Promise.all(data.keywords.map((k) => fetchRanking(k, data, hostname)));
  });
