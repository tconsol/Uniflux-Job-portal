// Shape must match uniflux-autofill-extension/src/types/index.ts ProfileField exactly.
function serializeProfile(user) {
  const p = user.profile || {};
  return {
    name: user.name,
    email: user.email,
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
  };
}

// GET /api/profile/extension/full
async function getExtensionProfile(req, res) {
  try {
    res.json({ profile: serializeProfile(req.user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/profile/me — same shape, for the portal client's own profile page.
async function getMyProfile(req, res) {
  try {
    res.json({ profile: serializeProfile(req.user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

const NULLABLE_STRING_FIELDS = [
  'resumeUrl', 'phone', 'location', 'linkedIn', 'portfolio', 'github', 'title', 'bio', 'coverLetter',
];

function isNullableString(v) {
  return v === null || typeof v === 'string';
}

function isStringArray(v) {
  return Array.isArray(v) && v.every((s) => typeof s === 'string');
}

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// education/experience/certifications are stored as loosely-typed subdocument
// arrays (see User model) — we only check the container is an array of plain
// objects here and let mongoose cast/validate individual field types.
function isObjectArray(v) {
  return Array.isArray(v) && v.every(isPlainObject);
}

// PUT /api/profile/me — partial update of the extension-facing profile
// fields. Only keys present in the body are touched; omit a key to leave it
// unchanged, send null to clear a nullable scalar field.
async function updateProfile(req, res) {
  try {
    const user = req.user;
    const body = req.body || {};

    for (const key of NULLABLE_STRING_FIELDS) {
      if (key in body) {
        if (!isNullableString(body[key])) {
          return res.status(400).json({ message: `${key} must be a string or null` });
        }
        user.profile[key] = body[key];
      }
    }

    if ('skills' in body) {
      if (!isStringArray(body.skills)) {
        return res.status(400).json({ message: 'skills must be an array of strings' });
      }
      user.profile.skills = body.skills;
    }

    if ('education' in body) {
      if (!isObjectArray(body.education)) {
        return res.status(400).json({ message: 'education must be an array of objects' });
      }
      user.profile.education = body.education;
    }

    if ('experience' in body) {
      if (!isObjectArray(body.experience)) {
        return res.status(400).json({ message: 'experience must be an array of objects' });
      }
      user.profile.experience = body.experience;
    }

    if ('certifications' in body) {
      if (!isObjectArray(body.certifications)) {
        return res.status(400).json({ message: 'certifications must be an array of objects' });
      }
      user.profile.certifications = body.certifications;
    }

    if ('preferences' in body) {
      const prefs = body.preferences;
      if (!isPlainObject(prefs)) {
        return res.status(400).json({ message: 'preferences must be an object' });
      }
      if ('locations' in prefs) {
        if (!isStringArray(prefs.locations)) {
          return res.status(400).json({ message: 'preferences.locations must be an array of strings' });
        }
        user.profile.preferences.locations = prefs.locations;
      }
      if ('jobTypes' in prefs) {
        if (!isStringArray(prefs.jobTypes)) {
          return res.status(400).json({ message: 'preferences.jobTypes must be an array of strings' });
        }
        user.profile.preferences.jobTypes = prefs.jobTypes;
      }
      if ('salaryMin' in prefs) {
        if (prefs.salaryMin !== null && typeof prefs.salaryMin !== 'number') {
          return res.status(400).json({ message: 'preferences.salaryMin must be a number or null' });
        }
        user.profile.preferences.salaryMin = prefs.salaryMin;
      }
    }

    await user.save();
    res.json({ profile: serializeProfile(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getExtensionProfile, getMyProfile, updateProfile, serializeProfile };
