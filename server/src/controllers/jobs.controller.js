const { fetchAllJobs } = require('../services/jobs.service');
const UserApply = require('../models/UserApply');
const { addConnection, removeConnection } = require('../services/sse.service');

async function listJobs(req, res) {
  try {
    const { planSlug, applyLimit, subscription } = req.subscription;
    const { page = 1, limit = 100, keyword, location, jobType, source, salaryMin, salaryMax } = req.query;

    const pageNum  = parseInt(page);
    const limitNum = Math.min(parseInt(limit) || 100, 100);
    const skip     = (pageNum - 1) * limitNum;

    const [{ jobs, total }, applies] = await Promise.all([
      fetchAllJobs({ limit: limitNum, skip, keyword, location, jobType, source, salaryMin, salaryMax }),
      UserApply.find({ userId: req.user._id }).select('jobId appliedAt').lean(),
    ]);

    const since = subscription?.planActivatedAt ? new Date(subscription.planActivatedAt) : null;
    const periodApplies = since ? applies.filter((a) => new Date(a.appliedAt) >= since) : applies;

    res.json({
      jobs,
      total,
      page: pageNum,
      limit: limitNum,
      planSlug,
      applyLimit,
      appliesUsed:  periodApplies.length,
      appliedJobIds: applies.map((a) => a.jobId),
    });
  } catch (err) {
    console.error('[listJobs]', err.message);
    res.status(500).json({ message: err.message });
  }
}

async function getJob(req, res) {
  try {
    const { jobs } = await fetchAllJobs({ limit: 100 });
    const job = jobs.find((j) => j._id === req.params.id);
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

module.exports = { listJobs, getJob, sseStream };
