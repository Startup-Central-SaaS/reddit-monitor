// Reddit client for WorkCentral Monitor
// Uses public JSON endpoints — no API key or OAuth required
// Reddit allows ~10 unauthenticated requests per minute
// We check 8 subreddits every 15 min = well within limits

// Small delay helper to stay under rate limits
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch new posts from a subreddit using public JSON endpoint
export async function fetchNewPosts(subreddit, limit = 25) {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}&raw_json=1`;

  const response = await fetch(url, {
    headers: {
      // A User-Agent is required even for public endpoints
      // Reddit blocks requests without one
      'User-Agent': 'WorkCentralMonitor/1.0 (personal keyword monitoring tool)',
      Accept: 'application/json',
    },
  });

  if (response.status === 429) {
    // Rate limited — wait and retry once
    await delay(5000);
    const retry = await fetch(url, {
      headers: {
        'User-Agent': 'WorkCentralMonitor/1.0 (personal keyword monitoring tool)',
        Accept: 'application/json',
      },
    });
    if (!retry.ok) {
      throw new Error(`Reddit rate limited for r/${subreddit} after retry: ${retry.status}`);
    }
    const retryData = await retry.json();
    return normalizePosts(retryData);
  }

  if (!response.ok) {
    throw new Error(`Reddit fetch failed for r/${subreddit}: ${response.status}`);
  }

  const data = await response.json();
  return normalizePosts(data);
}

// Search a subreddit using public JSON search endpoint
export async function searchSubreddit(subreddit, query, limit = 25) {
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=on&sort=new&limit=${limit}&t=week&raw_json=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'WorkCentralMonitor/1.0 (personal keyword monitoring tool)',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit search failed for r/${subreddit}: ${response.status}`);
  }

  const data = await response.json();
  return normalizePosts(data);
}

// Normalize Reddit JSON response into clean post objects
function normalizePosts(data) {
  if (!data?.data?.children) return [];

  return data.data.children
    .filter((child) => child.kind === 't3') // t3 = link/post (not comments)
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
