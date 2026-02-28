// WorkCentral Reddit Monitor — Keyword Configuration
// Edit this file to customize what you're monitoring
//
// Strategy: Mix of specific multi-word phrases (high precision)
// and broader single/two-word terms (higher recall, lower weight)
// The scoring system surfaces the best leads automatically

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
      'admin overhead',
      'busywork',
      'spending hours on admin',
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

  // Tool mentions (medium value — discussing competitor tools, might be open to switching)
  tool_mentions: {
    weight: 1,
    keywords: [
      'freshbooks',
      'honeybook',
      'dubsado',
      'bonsai freelance',
      'harvest app',
      'toggl track',
      'proposify',
      'wave accounting',
      'and co freelance',
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

  invoicing_broad: {
    weight: 1,
    keywords: [
      'invoicing',
      'getting paid',
      'unpaid client',
      'late payment',
      'overdue payment',
      'payment link',
      'send invoice',
      'invoice reminder',
      'client owes',
      'net 30',
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
      'proposal software',
      'quoting software',
    ],
  },

  quoting_broad: {
    weight: 1,
    keywords: [
      'pricing projects',
      'how to price',
      'how much to charge',
      'project pricing',
      'hourly vs fixed',
      'hourly vs project',
      'flat rate vs hourly',
      'what to charge',
    ],
  },

  time_tracking: {
    weight: 2,
    keywords: [
      'time tracking freelance',
      'tracking billable',
      'billable hours',
      'time tracking invoicing',
      'timesheet freelance',
    ],
  },

  time_tracking_broad: {
    weight: 1,
    keywords: [
      'time tracking',
      'track hours',
      'log hours',
      'tracking time',
      'billable rate',
      'hourly rate tracking',
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
      'avoid scope creep',
      'scope document',
    ],
  },

  scope_broad: {
    weight: 1,
    keywords: [
      'feature creep',
      'client expectations',
      'project boundaries',
      'extra work',
      'client wants more',
      'keeps changing requirements',
    ],
  },

  client_management: {
    weight: 1,
    keywords: [
      'client management',
      'manage clients',
      'client portal',
      'client communication',
      'onboarding clients',
      'client onboarding',
      'difficult client',
      'client relationship',
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
      'freelance app',
      'business management tool',
      'crm for freelancers',
    ],
  },

  // Freelance business pain (lower weight, but catches general frustration)
  business_pain: {
    weight: 1,
    keywords: [
      'hate admin work',
      'bookkeeping freelance',
      'expense tracking freelance',
      'freelance accounting',
      'freelance finances',
      'tax tracking freelance',
      'running a freelance business',
      'freelance business management',
      'solo business',
      'solopreneur tools',
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
