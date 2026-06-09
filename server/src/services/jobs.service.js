const axios = require('axios');
const { getServiceUrl } = require('../config/eureka');
const DailyJobSet = require('../models/DailyJobSet');

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function seededShuffle(array, seed) {
  const arr = [...array];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function fetchJobsFromService(query = {}) {
  const serviceUrl = getServiceUrl(process.env.JOB_SERVICE_NAME || 'UNIFLUX-JOB-SERVICE');
  if (!serviceUrl) {
    throw new Error('Job service not available via Eureka');
  }
  const params = new URLSearchParams(query).toString();
  const response = await axios.get(`${serviceUrl}/api/jobs?${params}`, {
    timeout: 10000,
  });
  return response.data;
}

async function fetchJobsByIds(ids) {
  const serviceUrl = getServiceUrl(process.env.JOB_SERVICE_NAME || 'UNIFLUX-JOB-SERVICE');
  if (!serviceUrl) throw new Error('Job service not available');
  const response = await axios.post(
    `${serviceUrl}/api/jobs/batch`,
    { ids },
    { timeout: 10000 }
  );
  return response.data;
}

async function generateDailyJobSet(planSlug, jobLimit) {
  const today = getTodayString();
  const seed = Math.floor(Date.now() / 86400000);

  try {
    const allJobsResponse = await fetchJobsFromService({ limit: 10000, activeOnly: true });
    const allJobs = allJobsResponse.jobs || allJobsResponse;
    const allIds = allJobs.map((j) => j._id || j.id);

    const shuffled = seededShuffle(allIds, seed);
    const limited = jobLimit === -1 ? shuffled : shuffled.slice(0, jobLimit);

    await DailyJobSet.findOneAndUpdate(
      { date: today, planSlug },
      { date: today, planSlug, jobIds: limited, seed },
      { upsert: true, new: true }
    );

    return limited;
  } catch (err) {
    console.error(`Failed to generate daily job set for ${planSlug}:`, err.message);
    return [];
  }
}

async function getDailyJobSet(planSlug, jobLimit) {
  const today = getTodayString();
  let set = await DailyJobSet.findOne({ date: today, planSlug });
  if (!set) {
    const ids = await generateDailyJobSet(planSlug, jobLimit);
    return ids;
  }
  return set.jobIds;
}

module.exports = { fetchJobsFromService, fetchJobsByIds, generateDailyJobSet, getDailyJobSet, getTodayString };
