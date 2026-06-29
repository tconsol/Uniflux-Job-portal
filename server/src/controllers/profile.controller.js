const User = require('../models/User');

async function getFullProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      profile: {
        name: user.name,
        email: user.email,
        resumeUrl: user.profile?.resumeUrl ?? null,
        skills: user.profile?.skills ?? [],
        phone: user.profile?.phone ?? null,
        location: user.profile?.location ?? null,
        linkedIn: user.profile?.linkedIn ?? null,
        portfolio: user.profile?.portfolio ?? null,
        github: user.profile?.github ?? null,
        title: user.profile?.title ?? null,
        bio: user.profile?.bio ?? null,
        education: user.profile?.education ?? [],
        experience: user.profile?.experience ?? [],
        certifications: user.profile?.certifications ?? [],
        coverLetter: user.profile?.coverLetter ?? null,
        preferences: user.profile?.preferences ?? {
          locations: [],
          jobTypes: [],
          salaryMin: null,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateFullProfile(req, res) {
  try {
    const allowed = [
      'resumeUrl', 'skills', 'phone', 'location', 'linkedIn',
      'portfolio', 'github', 'title', 'bio', 'education',
      'experience', 'certifications', 'coverLetter', 'preferences',
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.profile) user.profile = {};

    for (const [key, val] of Object.entries(updates)) {
      user.profile[key] = val;
    }

    await user.save();

    res.json({ message: 'Profile updated', profile: user.profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getFullProfile, updateFullProfile };
