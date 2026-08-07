// GET /api/profile/extension/full — shape must match
// uniflux-autofill-extension/src/types/index.ts ProfileField exactly.
async function getExtensionProfile(req, res) {
  try {
    const u = req.user;
    const p = u.profile || {};

    res.json({
      profile: {
        name: u.name,
        email: u.email,
        resumeUrl: p.resumeUrl ?? null,
        skills: p.skills ?? [],
        phone: p.phone ?? null,
        location: p.location ?? null,
        linkedIn: p.linkedIn ?? null,
        portfolio: p.portfolio ?? null,
        github: p.github ?? null,
        title: p.title ?? null,
        bio: p.bio ?? null,
        education: p.education ?? [],
        experience: p.experience ?? [],
        certifications: p.certifications ?? [],
        coverLetter: p.coverLetter ?? null,
        preferences: {
          locations: p.preferences?.locations ?? [],
          jobTypes: p.preferences?.jobTypes ?? [],
          salaryMin: p.preferences?.salaryMin ?? null,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getExtensionProfile };
