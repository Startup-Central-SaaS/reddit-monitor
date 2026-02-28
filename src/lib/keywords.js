// WorkCentral Reddit Monitor — Keyword Configuration
// Edit this file to customize what you're monitoring

export const SUBREDDITS = [
  'freelance',
  'smallbusiness',
  'consulting',
  'webdev',
  'SideProject',
  'SaaS',
  'startups',
  'EntrepreneurRideAlong',
];

// Keywords grouped by category
// Each keyword has a weight (1-3) that contributes to relevance scoring
// Higher total score = more relevant match
export const KEYWORD_GROUPS = {
  // Core workflow pain (highest value — these are your ideal users)
  workflow_pain: {
    weight: 3,
    keywords: [
      'juggling apps',
      'juggling tools',
      'too many tools',
      'too many apps',
      'too many subscriptions',
      'moving data between',
      'copy paste between',
      'manually creating invoice',
      'manually transfer',
      'quote to invoice',
      'quote to project',
      'proposal to project',
      'gaps between tools',
      'disconnected tools',
      'freelance workflow',
      'freelance stack',
      'client workflow',
    ],
  },

  // Tool replacement (high value — actively looking for alternatives)
  tool_alternatives: {
    weight: 3,
    keywords: [
      'freshbooks alternative',
      'toggl alternative',
      'proposify alternative',
      'honeybook alternative',
      'dubsado alternative',
      'bonsai alternative',
      'harvest alternative',
      'wave alternative',
      'and-co alternative',
      'quickbooks freelance',
      'replace freshbooks',
      'replace toggl',
      'switch from freshbooks',
      'switch from honeybook',
      'better than freshbooks',
      'better than toggl',
    ],
  },

  // Feature-specific (medium-high value — specific pain points WC solves)
  invoicing: {
    weight: 2,
    keywords: [
      'freelance invoicing',
      'invoice clients',
      'invoicing tool',
      'invoicing software',
      'invoice template',
      'unpaid invoice',
      'late payment freelance',
      'getting paid freelance',
      'client payment',
      'payment reminders',
      'chase payments',
      'overdue invoice',
      'automated invoice',
      'invoice from time',
    ],
  },

  quoting: {
    weight: 2,
    keywords: [
      'freelance quote',
      'freelance proposal',
      'quoting clients',
      'quoting tool',
      'proposal tool',
      'writing proposals',
      'send a quote',
      'estimate for client',
      'project estimate',
      'pricing proposal',
      'scope document',
      'statement of work',
    ],
  },

  time_tracking: {
    weight: 1,
    keywords: [
      'time tracking freelance',
      'track hours',
      'tracking billable',
      'billable hours',
      'time tracking invoicing',
      'log hours',
      'timesheet freelance',
    ],
  },

  scope_management: {
    weight: 2,
    keywords: [
      'scope creep',
      'scope management',
      'project scope',
      'client keeps adding',
      'out of scope',
      'change order',
      'scope document',
      'avoid scope creep',
    ],
  },

  // General tool discovery (medium value — researching options)
  tool_discovery: {
    weight: 1,
    keywords: [
      'freelance tools',
      'tools for freelancers',
      'freelance software',
      'what tools do you use',
      'what app do you use',
      'recommend a tool',
      'best tool for freelance',
      'freelance business tools',
      'run freelance business',
      'freelance tech stack',
      'manage freelance',
      'client management tool',
      'project management freelance',
      'all in one freelance',
      'one tool for everything',
    ],
  },
};

// Flatten all keywords for quick matching
export function getAllKeywords() {
  const all = [];
  for (const [category, group] of Object.entries(KEYWORD_GROUPS)) {
    for (const keyword of group.keywords) {
      all.push({ keyword: keyword.toLowerCase(), category, weight: group.weight });
    }
  }
  return all;
}

// Score a post against all keywords
// Returns { score, matchedKeywords, categories }
export function scorePost(title, selftext) {
  const text = `${title} ${selftext}`.toLowerCase();
  const allKeywords = getAllKeywords();

  let score = 0;
  const matchedKeywords = [];
  const categories = new Set();

  for (const { keyword, category, weight } of allKeywords) {
    if (text.includes(keyword)) {
      score += weight;
      matchedKeywords.push(keyword);
      categories.add(category);
    }
  }

  return {
    score,
    matchedKeywords,
    categories: Array.from(categories),
  };
}

// Generate a snippet from selftext — first ~300 chars, cleaned up
export function createSnippet(selftext, maxLength = 300) {
  if (!selftext) return '';
  // Remove markdown formatting
  const cleaned = selftext
    .replace(/#{1,6}\s/g, '')
    .replace(/\*{1,2}(.*?)\*{1,2}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '\n')
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength).trim() + '...';
}
