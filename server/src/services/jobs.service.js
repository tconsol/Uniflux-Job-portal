const axios = require('axios');

const MARKETPLACE_URL = process.env.MARKETPLACE_API_URL || '';
const PUBLIC_JOBS_URL = `${MARKETPLACE_URL}/api/v1/marketplace/jobs/public`;
const COUNTS_URL      = `${MARKETPLACE_URL}/api/v1/marketplace/jobs/public/counts`;
const CACHE_TTL       = 2 * 60 * 1000; // 2 min per-page cache

// ─── per-request cache ─────────────────────────────────────────────────────
const _pageCache = new Map(); // cacheKey → { data, time }

// individual job lookup (populated as pages are fetched)
const _jobById = new Map();

function cacheGet(key) {
  const entry = _pageCache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  return null;
}

function cacheSet(key, data) {
  _pageCache.set(key, { data, time: Date.now() });
  // prune stale entries
  if (_pageCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of _pageCache) {
      if (now - v.time > CACHE_TTL) _pageCache.delete(k);
    }
  }
}

// ─── helpers ───────────────────────────────────────────────────────────────

// Client uses 'full-time'; marketplace API expects 'fulltime'
const JOB_TYPE_TO_API = {
  'full-time':  'fulltime',
  'part-time':  'parttime',
  'contract':   'contract',
  'freelance':  'contract',
  'internship': 'internship',
  'temporary':  'temporary',
};

function buildJobParams({ page = 1, keyword, location, job_type } = {}) {
  const params = { page };
  if (keyword)  params.keyword  = keyword;
  if (location) params.location = location;
  if (job_type) params.job_type = JOB_TYPE_TO_API[job_type] || job_type;
  return params;
}

function buildCountParams({ keyword, location, job_type } = {}) {
  const params = {};
  if (keyword)  params.keyword  = keyword;
  if (location) params.location = location;
  if (job_type) params.job_type = JOB_TYPE_TO_API[job_type] || job_type;
  return params;
}

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
    description:    sj.description   || '',
    applyUrl:       sj.url           || '',
    postedAt:       sj.posted_at     || sj.scraped_at || null,
    source:         sj.source_site   || '',
  };
  // store for getJob lookups
  if (job._id) _jobById.set(job._id, job);
  return job;
}

// Remap marketplace job_type keys to our internal format for counts response
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
    fulltime:          'full-time',
    parttime:          'part-time',
    contract:          'contract',
    contract_to_hire:  'contract',
    internship:        'internship',
    temporary:         'contract',
    freelance:         'freelance',
    perdiem:           'part-time',
  };
  const out = {};
  for (const [k, v] of Object.entries(byType)) {
    const key = map[k] || k;
    out[key] = (out[key] || 0) + v;
  }
  return out;
}

// ─── main exports ──────────────────────────────────────────────────────────

async function fetchJobs({ page = 1, keyword, location, job_type } = {}) {
  // Get total_pages first so we can reverse the page order.
  // API is oldest-first globally; client page 1 → API last page (newest).
  const counts   = await fetchCounts({ keyword, location, job_type });
  const totalPages = Math.ceil(counts.total / 200) || 1;
  const apiPage    = Math.max(1, totalPages - page + 1);

  const cacheKey = JSON.stringify({ apiPage, keyword, location, job_type });
  const cached   = cacheGet(cacheKey);
  if (cached) return { ...cached, page, totalPages, hasMore: page < totalPages };

  const { data } = await axios.get(PUBLIC_JOBS_URL, {
    params:  buildJobParams({ page: apiPage, keyword, location, job_type }),
    timeout: 30000,
  });

  const jobs = sortNewestFirst((data.jobs || []).map(mapJob));

  const result = {
    jobs,
    total:      counts.total,
    page,
    limit:      data.limit || 200,
    totalPages,
    hasMore:    page < totalPages,
  };

  cacheSet(cacheKey, { ...result, page: apiPage });
  return result;
}

async function fetchCounts({ keyword, location, job_type } = {}) {
  const filters = { keyword, location, job_type };
  const key = `counts:${JSON.stringify(filters)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const { data } = await axios.get(COUNTS_URL, {
    params:  buildCountParams(filters),
    timeout: 10000,
  });

  const result = {
    total:       data.total ?? 0,
    by_site:     data.by_site     || {},
    by_job_type: remapByJobType(data.by_job_type),
  };

  cacheSet(key, result);
  return result;
}

async function fetchJobById(id) {
  return _jobById.get(id) || null;
}

module.exports = { fetchJobs, fetchCounts, fetchJobById };
