-- WorkCentral Reddit Monitor — Supabase Schema
-- Run this in the Supabase SQL Editor

-- Matches table: stores every Reddit post that matches our keywords
CREATE TABLE matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reddit_post_id TEXT UNIQUE NOT NULL,
    subreddit TEXT NOT NULL,
    title TEXT NOT NULL,
    selftext_snippet TEXT,
    url TEXT NOT NULL,
    permalink TEXT NOT NULL,
    author TEXT,
    score INTEGER DEFAULT 0,
    num_comments INTEGER DEFAULT 0,
    matched_keywords TEXT[] DEFAULT '{}',
    keyword_categories TEXT[] DEFAULT '{}',
    relevance_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'drafted', 'sent', 'archived', 'deleted')),
    draft_response TEXT,
    reddit_created_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    notified_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ
);

-- Indexes for fast filtering
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_subreddit ON matches(subreddit);
CREATE INDEX idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX idx_matches_reddit_post_id ON matches(reddit_post_id);

-- Scan log: tracks when the scanner last ran
CREATE TABLE scan_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    subreddits_scanned TEXT[] DEFAULT '{}',
    posts_checked INTEGER DEFAULT 0,
    matches_found INTEGER DEFAULT 0,
    errors TEXT
);

-- Row Level Security (optional but recommended)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anon users (since this is a personal tool)
-- For production, you'd want proper auth — but for a single-user tool this is fine
CREATE POLICY "Allow all on matches" ON matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on scan_log" ON scan_log FOR ALL USING (true) WITH CHECK (true);
