const UserApply = require('../models/UserApply');

async function recordApply(req, res) {
  try {
    const userId  = req.user._id;
    const jobId   = req.params.id;
    const { applyLimit, subscription } = req.subscription;
    const { jobTitle = '', company = '', location = '', applyUrl = '' } = req.body;

    const existing = await UserApply.findOne({ userId, jobId });
    if (existing) return res.json({ ok: true, alreadyApplied: true });

    const since = subscription?.planActivatedAt ? new Date(subscription.planActivatedAt) : null;
    const query = { userId };
    if (since) query.appliedAt = { $gte: since };
    const used = await UserApply.countDocuments(query);

    if (applyLimit !== -1 && used >= applyLimit) {
      return res.status(403).json({
        message: 'Apply limit reached. Upgrade your plan.',
        appliesUsed: used,
        applyLimit,
        limitReached: true,
      });
    }

    await UserApply.create({ userId, jobId, jobTitle, company, location, applyUrl });
    res.json({ ok: true, appliesUsed: used + 1, applyLimit });
  } catch (err) {
    if (err.code === 11000) return res.json({ ok: true, alreadyApplied: true });
    console.error('[recordApply]', err.message);
    res.status(500).json({ message: err.message });
  }
}

async function getApplied(req, res) {
  try {
    const applies = await UserApply.find({ userId: req.user._id })
      .sort({ appliedAt: -1 })
      .lean();

    res.json({
      jobs: applies.map((a) => ({
        _id:       a.jobId,
        title:     a.jobTitle,
        company:   a.company,
        location:  a.location,
        applyUrl:  a.applyUrl,
        appliedAt: a.appliedAt,
      })),
      total: applies.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { recordApply, getApplied };
