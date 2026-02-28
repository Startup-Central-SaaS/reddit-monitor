// Reddit client for WorkCentral Monitor
// Plan B: Uses Reddit RSS feeds instead of JSON endpoints
// RSS feeds are often served from different infrastructure
// and aren't blocked as aggressively as JSON API endpoints

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  DNT: '1',
};

// Try RSS feed first, then JSON endpoints as fallback
async function fetchSubredditPosts(subreddit, limit = 25) {
  // Attempt 1: RSS feed (Atom XML)
  try {
    const posts = await fetchViaRSS(subreddit);
    if (posts.length > 0) return posts;
  } catch (err) {
    console.log(`RSS failed for r/${subreddit}: ${err.message}`);
  }

  // Attempt 2: old.reddit.com JSON
  try {
    const posts = await fetchViaJSON('https://old.reddit.com', subreddit, limit);
    if (posts.length > 0) return posts;
  } catch (err) {
    console.log(`old.reddit.com JSON failed for r/${subreddit}: ${err.message}`);
  }

  // Attempt 3: www.reddit.com JSON
  try {
    const posts = await fetchViaJSON('https://www.reddit.com', subreddit, limit);
    if (posts.length > 0) return posts;
  } catch (err) {
    console.log(`www.reddit.com JSON failed for r/${subreddit}: ${err.message}`);
  }

  throw new Error(`All methods failed for r/${subreddit}`);
}

// Fetch via RSS/Atom feed
async function fetchViaRSS(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/new/.rss?limit=25`;

  const response = await fetch(url, { headers: BROWSER_HEADERS });

  if (!response.ok) {
    throw new Error(`RSS ${response.status}`);
  }

  const xml = await response.text();
  return parseAtomFeed(xml, subreddit);
}

// Parse Atom XML feed into post objects
function parseAtomFeed(xml, subreddit) {
  const posts = [];
  // Match each <entry> block
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];

  for (const entry of entries) {
    const id = extractTag(entry, 'id') || '';
    // Reddit Atom IDs look like: t3_xxxxx
    const redditId = id.replace(/.*t3_/, '').replace(/[^a-zA-Z0-9]/g, '');

    const title = extractTag(entry, 'title') || '';
    const link = extractAttr(entry, 'link', 'href') || '';
    const author = extractTag(entry, 'name') || '';
    const updated = extractTag(entry, 'updated') || '';

    // Extract selftext from <content> — it's HTML encoded in the feed
    const content = extractTag(entry, 'content') || '';
    // Strip HTML tags and comments to get plain text
    const selftext = content
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (redditId) {
      posts.push({
        reddit_post_id: redditId,
        subreddit: subreddit,
        title: decodeEntities(title),
        selftext: selftext.substring(0, 5000), // Cap length
        url: link || `https://www.reddit.com/r/${subreddit}/comments/${redditId}/`,
        permalink: `/r/${subreddit}/comments/${redditId}/`,
        author: author.replace(/\/u\//, ''),
        score: 0, // Not available in RSS
        num_comments: 0, // Not available in RSS
        reddit_created_at: updated ? new Date(updated).toISOString() : new Date().toISOString(),
      });
    }
  }

  return posts;
}

// Helper: extract text content of an XML tag
function extractTag(xml, tag) {
  // Handle CDATA sections
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`));
  if (cdataMatch) return cdataMatch[1];

  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : null;
}

// Helper: extract attribute from a self-closing or open tag
function extractAttr(xml, tag, attr) {
  const match = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*/?>`, 's'));
  return match ? match[1] : null;
}

// Decode HTML entities in titles
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Fetch via JSON endpoint (fallback)
async function fetchViaJSON(domain, subreddit, limit) {
  const url = `${domain}/r/${subreddit}/new.json?limit=${limit}&raw_json=1`;
  const response = await fetch(url, { headers: BROWSER_HEADERS });

  if (!response.ok) {
    throw new Error(`JSON ${response.status}`);
  }

  const data = await response.json();
  return normalizeJSONPosts(data);
}

function normalizeJSONPosts(data) {
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

// Main export — used by the scan endpoint
export async function fetchNewPosts(subreddit, limit = 25) {
  return fetchSubredditPosts(subreddit, limit);
}

// Search export — kept for compatibility
export async function searchSubreddit(subreddit, query, limit = 25) {
  // RSS doesn't support search, so use JSON with fallback
  try {
    return await fetchViaJSON(
      'https://old.reddit.com',
      `${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=on&sort=new&limit=${limit}&t=week&raw_json=1`,
      limit
    );
  } catch {
    // Fall back to fetching new posts and filtering client-side
    const posts = await fetchSubredditPosts(subreddit, limit);
    const q = query.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.selftext.toLowerCase().includes(q)
    );
  }
}
