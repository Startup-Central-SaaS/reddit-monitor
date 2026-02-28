// Reddit client for WorkCentral Monitor
// Uses public JSON endpoints with browser-like headers
// Falls back to old.reddit.com if www.reddit.com returns 403
// Reddit blocks many datacenter IPs — browser headers help bypass this

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Browser-like headers to avoid datacenter IP blocking
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  DNT: '1',
  Connection: 'keep-alive',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

// Try multiple Reddit domains — some block datacenter IPs differently
const REDDIT_DOMAINS = [
  'https://old.reddit.com',
  'https://www.reddit.com',
];

// Attempt fetch from each domain until one works
async function fetchWithFallback(path) {
  let lastError = null;

  for (const domain of REDDIT_DOMAINS) {
    const url = `${domain}${path}`;
    try {
      const response = await fetch(url, { headers: BROWSER_HEADERS });

      if (response.status === 429) {
        // Rate limited — wait and retry this domain once
        await delay(5000);
        const retry = await fetch(url, { headers: BROWSER_HEADERS });
        if (retry.ok) {
          return await retry.json();
        }
        lastError = new Error(`Rate limited at ${domain}: ${retry.status}`);
        continue;
      }

      if (response.status === 403) {
        // Blocked — try next domain
        lastError = new Error(`Blocked at ${domain}: 403`);
        continue;
      }

      if (!response.ok) {
        lastError = new Error(`Failed at ${domain}: ${response.status}`);
        continue;
      }

      return await response.json();
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error(`All Reddit domains failed for ${path}`);
}

// Fetch new posts from a subreddit
export async function fetchNewPosts(subreddit, limit = 25) {
  const data = await fetchWithFallback(
    `/r/${subreddit}/new.json?limit=${limit}&raw_json=1`
  );
  return normalizePosts(data);
}

// Search a subreddit for specific terms
export async function searchSubreddit(subreddit, query, limit = 25) {
  const data = await fetchWithFallback(
    `/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=on&sort=new&limit=${limit}&t=week&raw_json=1`
  );
  return normalizePosts(data);
}

// Normalize Reddit JSON response into clean post objects
function normalizePosts(data) {
  if (!data?.data?.children) return [];

  return data.data.children
    .filter((child) => child.kind === 't3')
    .map((child) => {
      const post = child.data;
      return {
        reddit_post_id: post.id,
        subreddit: post.subreddit,
        title: post.title,
        selftext: post.selftext || '',
        url: `https://www.reddit.com${post.permalink}`,
        permalink: post.permalink,
        author: post.author,
        score: post.score,
        num_comments: post.num_comments,
        reddit_created_at: new Date(post.created_utc * 1000).toISOString(),
      };
    });
}
