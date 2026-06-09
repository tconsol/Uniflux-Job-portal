const { getDailyJobSet, fetchJobsByIds, fetchJobsFromService } = require('../services/jobs.service');
const { addConnection, removeConnection } = require('../services/sse.service');
const Plan = require('../models/Plan');

async function listJobs(req, res) {
  try {
    const { planSlug, jobLimit } = req.subscription;
    const { page = 1, limit = 20, location, jobType, salaryMin, company, skills } = req.query;

    const jobIds = await getDailyJobSet(planSlug, jobLimit);
    if (!jobIds.length) {
      return res.json({ jobs: [], total: 0, page: 1, limit: parseInt(limit), planSlug, jobLimit });
    }

    const filters = {};
    if (location) filters.location = location;
    if (jobType) filters.jobType = jobType;
    if (salaryMin) filters.salaryMin = parseInt(salaryMin);
    if (company) filters.company = company;
    if (skills) filters.skills = skills.split(',');

    let allJobs = await fetchJobsByIds(jobIds);

    if (Object.keys(filters).length > 0) {
      allJobs = allJobs.filter((job) => {
        if (filters.location && !job.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
        if (filters.jobType && job.jobType !== filters.jobType) return false;
        if (filters.salaryMin && job.salaryMin < filters.salaryMin) return false;
        if (filters.company && !job.company?.toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.skills?.length && !filters.skills.some((s) => job.skills?.includes(s))) return false;
        return true;
      });
    }

    const total = allJobs.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const paginated = allJobs.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({ jobs: paginated, total, page: pageNum, limit: limitNum, planSlug, jobLimit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getJob(req, res) {
  try {
    const jobs = await fetchJobsByIds([req.params.id]);
    if (!jobs.length) return res.status(404).json({ message: 'Job not found' });
    res.json({ job: jobs[0] });
  } catch (err) {
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
