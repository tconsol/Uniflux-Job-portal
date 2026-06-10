const axios = require('axios');

const MARKETPLACE_URL = process.env.MARKETPLACE_API_URL || 'https://uniflux-marketplace-64307221061.asia-south1.run.app';
const PUBLIC_JOBS_URL = `${MARKETPLACE_URL}/api/v1/marketplace/jobs/public`;

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
    _id:            sj.id,
    title:          sj.title         || '',
    company:        sj.company_name  || '',
    location:       mapLocation(sj.location),
    jobType:        normalizeJobType(sj.job_type),
    salaryMin:      sj.salary?.min   ?? null,
    salaryMax:      sj.salary?.max   ?? null,
    salaryCurrency: sj.salary?.currency ?? null,
    skills:         sj.skills        || [],
    description:    sj.description   || '',
    applyUrl:       sj.url           || '',
    postedAt:       sj.posted_at     || sj.scraped_at,
    source:         sj.source_site   || '',
  };
}

async function fetchAllJobs({ limit = 100, skip = 0, keyword, location, jobType, source, salaryMin, salaryMax } = {}) {
  const params = { limit, skip };
  if (keyword)   params.keyword    = keyword;
  if (location)  params.location   = location;
  if (jobType)   params.job_type   = jobType;
  if (source)    params.site       = source;
  if (salaryMin) params.salary_min = salaryMin;
  if (salaryMax) params.salary_max = salaryMax;

  const { data } = await axios.get(PUBLIC_JOBS_URL, { params, timeout: 20000 });
  return {
    total: data.total ?? 0,
    jobs:  (data.jobs || []).map(mapJob),
  };
}

module.exports = { fetchAllJobs };
