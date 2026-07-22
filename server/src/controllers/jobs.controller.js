const { fetchJobs, fetchCounts, fetchJobById } = require('../services/jobs.service');
const UserApply = require('../models/UserApply');
const { addConnection, removeConnection } = require('../services/sse.service');
const { clientIpFrom, regionForIp } = require('../services/geo.service');

// Country ('us'/'in') for the marketplace feed: prefer the logged-in user's
// stored region; else a ?country= override; else geoip on the request IP.
function countryForRequest(req) {
  if (req.user?.region) return req.user.region.toLowerCase();
  const q = String(req.query.country || '').toLowerCase();
  if (q === 'us' || q === 'in') return q;
  return regionForIp(clientIpFrom(req)).toLowerCase();
}

async function listJobs(req, res) {
  try {
    const { page = 1, keyword, location, jobType } = req.query;
    const { planSlug, applyLimit, subscription } = req.subscription;
    const country = countryForRequest(req);

    const [result, applies] = await Promise.all([
      fetchJobs({ page: Number(page), keyword, location, job_type: jobType, country }),
      UserApply.find({ userId: req.user._id }).select('jobId appliedAt').lean(),
    ]);

    const since = subscription?.planActivatedAt ? new Date(subscription.planActivatedAt) : null;
    const periodApplies = since ? applies.filter((a) => new Date(a.appliedAt) >= since) : applies;

    res.json({
      ...result,
      planSlug,
      applyLimit,
      appliesUsed:   periodApplies.length,
      appliedJobIds: applies.map((a) => a.jobId),
    });
  } catch (err) {
    console.error('[listJobs]', err.message);
    res.status(500).json({ message: err.message });
  }
}

async function getJob(req, res) {
  try {
    const job = await fetchJobById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ job });
  } catch (err) {
    console.error('[getJob]', err.message);
    res.status(500).json({ message: err.message });
  }
}

async function sseStream(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const userId = req.user._id.toString();
  addConnection(userId, res);
  res.write(': connected\n\n');

  const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 25000);
  req.on('close', () => { clearInterval(keepAlive); removeConnection(userId, res); });
}

async function getJobCount(req, res) {
  try {
    const { keyword, location, jobType } = req.query;
    const data = await fetchCounts({ keyword, location, job_type: jobType, country: countryForRequest(req) });
    res.json(data);
  } catch (err) {
    console.error('[getJobCount]', err.message);
    res.status(500).json({ message: err.message });
  }
}

// kept for backward compat — same as /counts but returns { total } only
async function getWeekTotal(req, res) {
  try {
    const data = await fetchCounts({ country: countryForRequest(req) });
    res.json({ total: data.total });
  } catch (err) {
    console.error('[getWeekTotal]', err.message);
    res.status(500).json({ message: err.message });
  }
}

module.exports = { listJobs, getJob, sseStream, getJobCount, getWeekTotal, countryForRequest };
