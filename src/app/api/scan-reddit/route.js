import { fetchNewPosts } from '@/lib/reddit';
import { supabase } from '@/lib/supabase';
import { SUBREDDITS, scorePost, createSnippet } from '@/lib/keywords';
import { sendMatchAlert } from '@/lib/email';

export const maxDuration = 60; // Vercel serverless timeout — needs time for 8 subreddits with rate limit delays

export async function GET(request) {
  // Authenticate the cron request
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    scannedAt: new Date().toISOString(),
    subredditsScanned: [],
    postsChecked: 0,
    matchesFound: 0,
    newMatches: [],
    errors: [],
  };

  try {
    for (const subreddit of SUBREDDITS) {
      try {
        const posts = await fetchNewPosts(subreddit, 25);
        results.subredditsScanned.push(subreddit);
        results.postsChecked += posts.length;

        for (const post of posts) {
          // Skip posts older than 48 hours
          const postAge = Date.now() - new Date(post.reddit_created_at).getTime();
          const maxAge = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
          if (postAge > maxAge) continue;

          // Score the post against keywords
          const { score, matchedKeywords, categories } = scorePost(
            post.title,
            post.selftext
          );

          // Skip if no keywords matched
          if (score === 0) continue;

          // Check if we already have this post
          const { data: existing } = await supabase
            .from('matches')
            .select('id')
            .eq('reddit_post_id', post.reddit_post_id)
            .maybeSingle();

          if (existing) continue;

          // Insert new match
          const matchData = {
            reddit_post_id: post.reddit_post_id,
            subreddit: post.subreddit,
            title: post.title,
            selftext_snippet: createSnippet(post.selftext),
            url: post.url,
            permalink: post.permalink,
            author: post.author,
            score: post.score,
            num_comments: post.num_comments,
            matched_keywords: matchedKeywords,
            keyword_categories: categories,
            relevance_score: score,
            reddit_created_at: post.reddit_created_at,
          };

          const { data: inserted, error } = await supabase
            .from('matches')
            .insert(matchData)
            .select()
            .single();

          if (error) {
            results.errors.push(`Insert error for ${post.reddit_post_id}: ${error.message}`);
          } else {
            results.matchesFound++;
            results.newMatches.push(inserted);
          }
        }

        // Delay between subreddits to respect unauthenticated rate limits
        // ~10 requests per minute allowed, so 2 seconds between each is safe
        await new Promise((resolve) => setTimeout(resolve, 2000));

      } catch (subError) {
        results.errors.push(`Error scanning r/${subreddit}: ${subError.message}`);
      }
    }

    // Send email alert if we found new matches
    if (results.newMatches.length > 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const emailSent = await sendMatchAlert(results.newMatches, appUrl);

      if (emailSent) {
        // Mark matches as notified
        const ids = results.newMatches.map((m) => m.id);
        await supabase
          .from('matches')
          .update({ notified_at: new Date().toISOString() })
          .in('id', ids);
      }
    }

    // Log the scan
    await supabase.from('scan_log').insert({
      subreddits_scanned: results.subredditsScanned,
      posts_checked: results.postsChecked,
      matches_found: results.matchesFound,
      errors: results.errors.length > 0 ? results.errors.join('; ') : null,
    });

  } catch (error) {
    results.errors.push(`Global error: ${error.message}`);
  }

  return Response.json({
    success: true,
    scannedAt: results.scannedAt,
    subredditsScanned: results.subredditsScanned.length,
    postsChecked: results.postsChecked,
    matchesFound: results.matchesFound,
    errors: results.errors,
  });
}
