const axios = require('axios');
const { broadcastToAll } = require('./sse.service');

const MARKETPLACE_URL  = process.env.MARKETPLACE_API_URL || '';
const PUBLIC_JOBS_URL  = `${MARKETPLACE_URL}/api/v1/marketplace/jobs/public`;
const COUNTS_URL       = `${MARKETPLACE_URL}/api/v1/marketplace/jobs/public/counts`;
const PAGE_LIMIT = 1000;
const CACHE_TTL  = 5 * 60 * 1000; // 5 min

// ─── in-memory cache ───────────────────────────────────────────────────────
let _cache       = null; // { jobs: [], total: number }
let _cacheTime   = 0;
let _fetching    = false; // background fetch in progress

function isCacheValid() {
  return _cache && (Date.now() - _cacheTime) < CACHE_TTL;
}

// ─── helpers ───────────────────────────────────────────────────────────────

function normalizeJobType(raw) {
  if (!raw) return 'full-time';
  const r = raw.toLowerCase().replace(/[-_\s]/g, '');
  if (r.includes('part'))      return 'part-time';
  if (r.includes('contract'))  return 'contract';
  if (r.includes('freelance')) return 'freelance';
  if (r.includes('intern'))    return 'internship';
  return 'full-time';
}

function mapLocation(loc) {
  if (!loc) return '';
  if (loc.is_remote) return 'Remote';
  return loc.raw || [loc.city, loc.state, loc.country].filter(Boolean).join(', ') || '';
}

function mapJob(sj) {
  return {
    _id:            sj.id            || '',
    title:          sj.title         || '',
    company:        sj.company_name  || '',
    location:       mapLocation(sj.location),
    jobType:        normalizeJobType(sj.job_type),
    salaryMin:      sj.salary?.min   ?? null,
    salaryMax:      sj.salary?.max   ?? null,
    salaryCurrency: sj.salary?.currency ?? null,
    skills:         Array.isArray(sj.skills) ? sj.skills : [],
    description:    sj.description   || '',
    applyUrl:       sj.url           || '',
    postedAt:       sj.posted_at     || sj.scraped_at || null,
    source:         sj.source_site   || '',
  };
}

async function fetchPage(skip) {
  const { data } = await axios.get(PUBLIC_JOBS_URL, {
    params: { date_posted: 'week', limit: PAGE_LIMIT, skip },
    timeout: 30000,
  });
  return data.jobs || [];
}

// ─── background: fetch all remaining pages after the first ─────────────────
async function fetchAllInBackground(firstPageJobs) {
  if (_fetching) return;
  _fetching = true;

  try {
    const allJobs = [...firstPageJobs];
    let skip = PAGE_LIMIT;

    while (true) {
      const page = await fetchPage(skip);
      allJobs.push(...page.map(mapJob));
      if (page.length < PAGE_LIMIT) break;
      skip += PAGE_LIMIT;
    }

    _cache     = { jobs: allJobs, total: allJobs.length };
    _cacheTime = Date.now();
    console.log(`[jobs] full fetch complete — ${allJobs.length} jobs cached`);

    // Tell all connected clients to refetch
    broadcastToAll('job_updated', { reason: 'full_load_complete' });
  } catch (err) {
    console.error('[jobs] background fetch error:', err.message);
  } finally {
    _fetching = false;
  }
}

// ─── main export ───────────────────────────────────────────────────────────
async function fetchJobs() {
  // Cache hit → return immediately
  if (isCacheValid()) {
    return _cache;
  }

  // Fetch first page synchronously so the client gets data fast
  const firstRaw  = await fetchPage(0);
  const firstJobs = firstRaw.map(mapJob);

  // If first page is already less than PAGE_LIMIT, that's everything — cache and return
  if (firstRaw.length < PAGE_LIMIT) {
    _cache     = { jobs: firstJobs, total: firstJobs.length };
    _cacheTime = Date.now();
    return _cache;
  }

  // Otherwise return first 1000 immediately and fetch the rest in background
  fetchAllInBackground(firstJobs); // intentionally not awaited

  return { jobs: firstJobs, total: firstJobs.length };
}

async function fetchJobCount() {
  const { data } = await axios.get(COUNTS_URL, { timeout: 10000 });
  return data.total ?? 0;
}

module.exports = { fetchJobs, fetchJobCount };
