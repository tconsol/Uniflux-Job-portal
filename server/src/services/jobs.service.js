const axios = require('axios');
const { broadcastToAll } = require('./sse.service');

const MARKETPLACE_URL = process.env.MARKETPLACE_API_URL || '';
const PUBLIC_JOBS_URL = `${MARKETPLACE_URL}/api/v1/marketplace/jobs/public`;
const COUNTS_URL      = `${MARKETPLACE_URL}/api/v1/marketplace/jobs/public/counts`;

const PAGE_SIZE    = 200;   // jobs per client page
const FETCH_BATCH  = 10;    // concurrent marketplace API requests per batch
const CACHE_TTL    = 30 * 60 * 1000; // refresh every 30 min

// ─── global in-memory store ────────────────────────────────────────────────
let _allJobs       = [];        // ALL jobs, sorted newest-first globally
let _jobById       = new Map(); // id → job for fast single-job lookup
let _isFullyLoaded = false;
let _isFetching    = false;
let _lastFetchTime = 0;

// simple counts cache
let _countsCache     = null;
let _countsCacheTime = 0;
const COUNTS_TTL = 5 * 60 * 1000;

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
  const job = {
    _id:            sj.id            || '',
    title:          sj.title         || '',
    company:        sj.company_name  || '',
    location:       mapLocation(sj.location),
    jobType:        normalizeJobType(sj.job_type),
    salaryMin:      sj.salary?.min   ?? null,
    salaryMax:      sj.salary?.max   ?? null,
    salaryCurrency: sj.salary?.currency ?? null,
    skills:         Array.isArray(sj.skills) ? sj.skills : [],
    description:    (sj.description || '').slice(0, 500), // cap to save memory
    applyUrl:       sj.url           || '',
    postedAt:       sj.posted_at     || sj.scraped_at || null,
    source:         sj.source_site   || '',
  };
  if (job._id) _jobById.set(job._id, job);
  return job;
}

function sortNewestFirst(jobs) {
  return jobs.slice().sort((a, b) => {
    if (!a.postedAt && !b.postedAt) return 0;
    if (!a.postedAt) return 1;
    if (!b.postedAt) return -1;
    return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
  });
}

function remapByJobType(byType = {}) {
  const map = {
    fulltime:         'full-time',
    parttime:         'part-time',
    contract:         'contract',
    contract_to_hire: 'contract',
    internship:       'internship',
    temporary:        'contract',
    freelance:        'freelance',
    perdiem:          'part-time',
  };
  const out = {};
  for (const [k, v] of Object.entries(byType)) {
    const key = map[k] || k;
    out[key] = (out[key] || 0) + v;
  }
  return out;
}

async function fetchApiPage(page) {
  const { data } = await axios.get(PUBLIC_JOBS_URL, { params: { page }, timeout: 30000 });
  return {
    jobs:       data.jobs        || [],
    totalPages: data.total_pages || 1,
    hasMore:    data.has_more    || false,
  };
}

// ─── background full fetch ─────────────────────────────────────────────────
// Fetches ALL marketplace pages, sorts globally by date (newest → oldest),
// stores in _allJobs so client pagination respects date boundaries.
async function startFullFetch() {
  if (_isFetching) return;
  _isFetching    = true;
  _isFullyLoaded = false;

  console.log('[jobs] starting full fetch…');

  try {
    // Page 1 → learn totalPages
    const first = await fetchApiPage(1);
    const totalApiPages = first.totalPages;
    const collected = first.jobs.map(mapJob);

    // After first page, give clients something to show
    _allJobs = sortNewestFirst(collected);

    // Fetch remaining pages in reverse order (newest → oldest)
    // so _allJobs converges toward correct sort faster
    for (let top = totalApiPages; top >= 2; top -= FETCH_BATCH) {
      const pages = Array.from(
        { length: Math.min(FETCH_BATCH, top - 1) },
        (_, i) => top - i,
      ).filter((p) => p >= 2);

      const results = await Promise.allSettled(
        pages.map((p) => fetchApiPage(p).then((r) => r.jobs.map(mapJob))),
      );

      for (const res of results) {
        if (res.status === 'fulfilled') collected.push(...res.value);
      }

      // Re-sort & publish after every batch so UI updates progressively
      _allJobs = sortNewestFirst(collected);
      _allJobs.forEach((j) => _jobById.set(j._id, j));
    }

    _isFullyLoaded = true;
    _lastFetchTime = Date.now();
    console.log(`[jobs] cache ready — ${_allJobs.length} jobs`);
    broadcastToAll('job_updated', { reason: 'full_load_complete', total: _allJobs.length });
  } catch (err) {
    console.error('[jobs] fetch error:', err.message);
  } finally {
    _isFetching = false;
  }
}

// ─── main exports ──────────────────────────────────────────────────────────

async function fetchJobs({ page = 1, keyword, location, job_type } = {}) {
  // Kick off (or refresh) the full fetch if stale
  const stale = !_isFullyLoaded || (Date.now() - _lastFetchTime) > CACHE_TTL;
  if (stale && !_isFetching) startFullFetch(); // intentionally not awaited

  // Wait up to 8 s for at least the first page to arrive
  const deadline = Date.now() + 8000;
  while (_allJobs.length === 0 && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 200));
  }

  // Filter in-memory (fast — pure JS, no network)
  let jobs = _allJobs;

  if (keyword) {
    const kw = keyword.toLowerCase();
    jobs = jobs.filter((j) =>
      `${j.title} ${j.company} ${j.description}`.toLowerCase().includes(kw),
    );
  }
  if (location) {
    const loc = location.toLowerCase();
    jobs = jobs.filter((j) => j.location.toLowerCase().includes(loc));
  }
  if (job_type) {
    const norm = normalizeJobType(job_type);
    jobs = jobs.filter((j) => j.jobType === norm);
  }

  const total      = jobs.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const safePage   = Math.min(Math.max(1, page), totalPages);
  const start      = (safePage - 1) * PAGE_SIZE;

  return {
    jobs:          jobs.slice(start, start + PAGE_SIZE),
    total,
    page:          safePage,
    limit:         PAGE_SIZE,
    totalPages,
    hasMore:       safePage < totalPages,
    isFullyLoaded: _isFullyLoaded,
  };
}

async function fetchCounts({ keyword, location, job_type } = {}) {
  // Simple 5-min cache for counts
  if (_countsCache && Date.now() - _countsCacheTime < COUNTS_TTL) {
    return _countsCache;
  }

  const params = {};
  if (keyword)  params.keyword  = keyword;
  if (location) params.location = location;
  if (job_type) {
    const m = { 'full-time': 'fulltime', 'part-time': 'parttime', 'contract': 'contract', 'internship': 'internship' };
    params.job_type = m[job_type] || job_type;
  }

  const { data } = await axios.get(COUNTS_URL, { params, timeout: 10000 });
  const result = {
    total:       data.total ?? 0,
    by_site:     data.by_site     || {},
    by_job_type: remapByJobType(data.by_job_type),
  };

  _countsCache     = result;
  _countsCacheTime = Date.now();
  return result;
}

async function fetchJobById(id) {
  return _jobById.get(id) || null;
}

// Kick off fetch when module loads so cache is warm on first request
startFullFetch();

module.exports = { fetchJobs, fetchCounts, fetchJobById };
