const axios = require('axios');

const MARKETPLACE_URL = process.env.MARKETPLACE_API_URL || '';
const PUBLIC_JOBS_URL = `${MARKETPLACE_URL}/api/v1/marketplace/jobs/public`;
const COUNTS_URL      = `${MARKETPLACE_URL}/api/v1/marketplace/jobs/public/counts`;

const PAGE_SIZE  = 200;
const CACHE_TTL  = 2 * 60 * 1000; // 2 min per-page cache

// ─── per-page cache ────────────────────────────────────────────────────────
const _cache   = new Map(); // key → { data, time }
const _jobById = new Map(); // id  → job  (for single-job lookup)

function cacheGet(key) {
  const entry = _cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  return null;
}

function cacheSet(key, data) {
  _cache.set(key, { data, time: Date.now() });
  if (_cache.size > 600) {
    const now = Date.now();
    for (const [k, v] of _cache) {
      if (now - v.time > CACHE_TTL) _cache.delete(k);
    }
  }
}

// ─── helpers ───────────────────────────────────────────────────────────────

const JOB_TYPE_TO_API = {
  'full-time':  'fulltime',
  'part-time':  'parttime',
  'contract':   'contract',
  'freelance':  'contract',
  'internship': 'internship',
};

function normalizeJobType(raw) {
  if (!raw) return 'full-time';
  const r = raw.toLowerCase().replace(/[-_\s]/g, '');
  if (r.includes('part'))     return 'part-time';
  if (r.includes('contract')) return 'contract';
  if (r.includes('freelance'))return 'freelance';
  if (r.includes('intern'))   return 'internship';
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
    description:    (sj.description  || '').slice(0, 500),
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
    fulltime: 'full-time', parttime: 'part-time',
    contract: 'contract', contract_to_hire: 'contract',
    internship: 'internship', temporary: 'contract',
    freelance: 'freelance', perdiem: 'part-time',
  };
  const out = {};
  for (const [k, v] of Object.entries(byType)) {
    const key = map[k] || k;
    out[key] = (out[key] || 0) + v;
  }
  return out;
}

// ─── counts (fast, cached 5 min) ──────────────────────────────────────────
let _countsCache = null, _countsCacheTime = 0;
const COUNTS_TTL = 5 * 60 * 1000;

async function fetchCounts({ keyword, location, job_type } = {}) {
  const key = `counts:${JSON.stringify({ keyword, location, job_type })}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const params = {};
  if (keyword)  params.keyword  = keyword;
  if (location) params.location = location;
  if (job_type) params.job_type = JOB_TYPE_TO_API[job_type] || job_type;

  const { data } = await axios.get(COUNTS_URL, { params, timeout: 10000 });
  const result = {
    total:       data.total ?? 0,
    by_site:     data.by_site     || {},
    by_job_type: remapByJobType(data.by_job_type),
  };
  cacheSet(key, result);
  return result;
}

// ─── jobs (per-page proxy, newest-first via page reversal) ────────────────
async function fetchJobs({ page = 1, keyword, location, job_type } = {}) {
  // Get total pages so we can reverse page order (API is oldest-first)
  const counts     = await fetchCounts({ keyword, location, job_type });
  const totalPages = Math.ceil(counts.total / PAGE_SIZE) || 1;
  const safePage   = Math.min(Math.max(1, page), totalPages);

  // client page 1 → last API page (newest jobs), page 2 → second-last, etc.
  const apiPage = Math.max(1, totalPages - safePage + 1);

  const cacheKey = JSON.stringify({ apiPage, keyword, location, job_type });
  const cached   = cacheGet(cacheKey);
  if (cached) return { ...cached, page: safePage, totalPages, hasMore: safePage < totalPages };

  const params = { page: apiPage };
  if (keyword)  params.keyword  = keyword;
  if (location) params.location = location;
  if (job_type) params.job_type = JOB_TYPE_TO_API[job_type] || job_type;

  const { data } = await axios.get(PUBLIC_JOBS_URL, { params, timeout: 30000 });

  const jobs = sortNewestFirst((data.jobs || []).map(mapJob));

  const result = {
    jobs,
    total:      counts.total,
    page:       safePage,
    limit:      PAGE_SIZE,
    totalPages,
    hasMore:    safePage < totalPages,
    isFullyLoaded: true,
  };

  cacheSet(cacheKey, { jobs, total: counts.total, limit: PAGE_SIZE });
  return result;
}

async function fetchJobById(id) {
  return _jobById.get(id) || null;
}

module.exports = { fetchJobs, fetchCounts, fetchJobById };
