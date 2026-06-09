const { fetchJobs } = require('../services/jobs.service');
const { addConnection, removeConnection } = require('../services/sse.service');

async function listJobs(req, res) {
  try {
    const { planSlug, jobLimit } = req.subscription;
    const { page = 1, limit = 20, keyword, location, jobType } = req.query;

    const pageNum  = parseInt(page);
    const limitNum = Math.min(parseInt(limit), jobLimit);
    const skip     = (pageNum - 1) * limitNum;

    const { jobs, total } = await fetchJobs({ limit: limitNum, skip, keyword, location, jobType });

    res.json({ jobs, total, page: pageNum, limit: limitNum, planSlug, jobLimit });
  } catch (err) {
    console.error('[listJobs]', err.message);
    res.status(500).json({ message: err.message });
  }
}

async function getJob(req, res) {
  try {
    const { jobs } = await fetchJobs({ limit: 100 });
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

  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    removeConnection(userId, res);
  });
}

module.exports = { listJobs, getJob, sseStream };
