const axios = require('axios');
const jwt = require('jsonwebtoken');

const MARKETPLACE_API_URL = process.env.MARKETPLACE_API_URL || 'https://uniflux-apigateway-64307221061.asia-south1.run.app';
const MARKETPLACE_BASE = `${MARKETPLACE_API_URL}/api/v1/marketplace/jobs`;

function getServiceToken() {
  return jwt.sign(
    { org_id: process.env.MARKETPLACE_ORG_ID || 'uniflux-portal', type: 'service' },
    process.env.MARKETPLACE_JWT_SECRET || 'uniflux-super-secret-key-must-be-32-chars-min',
    { expiresIn: '1h' }
  );
}

function normalizeJobType(raw) {
  if (!raw) return 'full-time';
  const r = raw.toLowerCase().replace(/[-_\s]/g, '');
  if (r.includes('part')) return 'part-time';
  if (r.includes('contract')) return 'contract';
  if (r.includes('freelance')) return 'freelance';
  if (r.includes('intern')) return 'internship';
  return 'full-time';
}

function mapLocation(loc) {
  if (!loc) return '';
  if (loc.is_remote) return 'Remote';
  return loc.raw || [loc.city, loc.state, loc.country].filter(Boolean).join(', ') || '';
}

function mapScrapedJob(sj) {
  return {
    _id: sj.id || sj._id,
    title: sj.title || '',
    company: sj.company_name || '',
    location: mapLocation(sj.location),
    jobType: normalizeJobType(sj.job_type),
    salaryMin: sj.salary?.min ?? null,
    salaryMax: sj.salary?.max ?? null,
    salaryCurrency: sj.salary?.currency ?? null,
    skills: sj.skills || [],
    description: sj.description || '',
    applyUrl: sj.url || '',
    postedAt: sj.posted_at || sj.scraped_at,
    source: sj.source_site || '',
  };
}

async function fetchJobsFromMarketplace({ limit = 20, skip = 0, keyword, location, job_type, site, skills } = {}) {
  const token = getServiceToken();
  const params = {};
  if (limit)    params.limit = limit;
  if (skip)     params.skip = skip;
  if (keyword)  params.keyword = keyword;
  if (location) params.location = location;
  if (job_type) params.job_type = job_type;
  if (site)     params.site = site;
  if (skills)   params.skills = skills;

  const response = await axios.get(`${MARKETPLACE_BASE}/`, {
    params,
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15000,
  });

  const data = response.data;
  return {
    total: data.total ?? 0,
    jobs: (data.jobs || []).map(mapScrapedJob),
  };
}

async function fetchJobById(id) {
  const token = getServiceToken();
  const response = await axios.get(`${MARKETPLACE_BASE}/`, {
    params: { limit: 100, skip: 0 },
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000,
  });
  const jobs = (response.data.jobs || []).map(mapScrapedJob);
  return jobs.find((j) => j._id === id) || null;
}

module.exports = { fetchJobsFromMarketplace, fetchJobById, mapScrapedJob };
