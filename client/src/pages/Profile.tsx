import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User, CreditCard, Calendar, Shield, Pencil, Eye, EyeOff,
  Check, X, KeyRound, Zap, Plus, Trash2, GripVertical,
  Globe, Phone, MapPin, Linkedin, Briefcase, GraduationCap,
  Award, FileText, Github, BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useBilling';
import { updateProfile, getFullProfile, updateFullProfile } from '../api/auth.api';
import type { Education, Experience, Certification } from '../types';

const PLAN_COLORS: Record<string, string> = {
  free:     'bg-gray-100 text-gray-700 border-gray-200',
  standard: 'bg-blue-50 text-blue-700 border-blue-200',
  premium:  'bg-purple-50 text-purple-700 border-purple-200',
  elite:    'bg-amber-50 text-amber-700 border-amber-200',
};

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-gray-400" /> {title}
      </h3>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text', icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: any;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${Icon ? 'pl-9' : 'px-3'} py-2`}
        />
      </div>
    </div>
  );
}

function TagsInput({ values, onChange, placeholder }: {
  values: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState('');

  function add() {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput('');
  }

  function remove(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs px-2.5 py-1 rounded-full border border-brand-200">
            {v}
            <button onClick={() => remove(i)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder ?? 'Add...'}
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button onClick={add} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EducationForm({ items, onChange }: { items: Education[]; onChange: (v: Education[]) => void }) {
  function update(idx: number, field: keyof Education, value: string) {
    const next = items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    onChange(next);
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function add() {
    onChange([...items, { institution: '', degree: '', field: '' }]);
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 relative">
          <button onClick={() => remove(i)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Institution</label>
              <input value={item.institution} onChange={(e) => update(i, 'institution', e.target.value)}
                placeholder="University name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <InputField label="Degree" value={item.degree} onChange={(v) => update(i, 'degree', v)} placeholder="Bachelor's" />
            <InputField label="Field of study" value={item.field} onChange={(v) => update(i, 'field', v)} placeholder="Computer Science" />
            <InputField label="Start date" value={item.startDate ?? ''} onChange={(v) => update(i, 'startDate', v)} type="date" />
            <InputField label="End date" value={item.endDate ?? ''} onChange={(v) => update(i, 'endDate', v)} type="date" />
            <InputField label="GPA" value={item.gpa ?? ''} onChange={(v) => update(i, 'gpa', v)} placeholder="3.8" />
          </div>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium">
        <Plus className="w-4 h-4" /> Add education
      </button>
    </div>
  );
}

function ExperienceForm({ items, onChange }: { items: Experience[]; onChange: (v: Experience[]) => void }) {
  function update(idx: number, field: keyof Experience, value: any) {
    const next = items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    onChange(next);
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function add() {
    onChange([...items, { company: '', title: '', current: false }]);
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 relative">
          <button onClick={() => remove(i)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Company" value={item.company} onChange={(v) => update(i, 'company', v)} placeholder="Company name" />
            <InputField label="Title" value={item.title} onChange={(v) => update(i, 'title', v)} placeholder="Software Engineer" />
            <InputField label="Location" value={item.location ?? ''} onChange={(v) => update(i, 'location', v)} placeholder="City, State" />
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={item.current ?? false}
                  onChange={(e) => update(i, 'current', e.target.checked)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-sm text-gray-600">I currently work here</span>
              </label>
            </div>
            <InputField label="Start date" value={item.startDate ?? ''} onChange={(v) => update(i, 'startDate', v)} type="date" />
            {!item.current && (
              <InputField label="End date" value={item.endDate ?? ''} onChange={(v) => update(i, 'endDate', v)} type="date" />
            )}
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <textarea value={item.description ?? ''} onChange={(e) => update(i, 'description', e.target.value)}
                rows={3} placeholder="Describe your role and achievements"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>
          </div>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium">
        <Plus className="w-4 h-4" /> Add experience
      </button>
    </div>
  );
}

function CertificationsForm({ items, onChange }: { items: Certification[]; onChange: (v: Certification[]) => void }) {
  function update(idx: number, field: keyof Certification, value: string) {
    const next = items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    onChange(next);
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function add() {
    onChange([...items, { name: '', issuer: '' }]);
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 relative">
          <button onClick={() => remove(i)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Name" value={item.name} onChange={(v) => update(i, 'name', v)} placeholder="AWS Solutions Architect" />
            <InputField label="Issuer" value={item.issuer} onChange={(v) => update(i, 'issuer', v)} placeholder="Amazon" />
            <InputField label="Date" value={item.date ?? ''} onChange={(v) => update(i, 'date', v)} type="date" />
            <InputField label="URL" value={item.url ?? ''} onChange={(v) => update(i, 'url', v)} placeholder="https://credential.example.com" />
          </div>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium">
        <Plus className="w-4 h-4" /> Add certification
      </button>
    </div>
  );
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { data: subData } = useSubscription();
  const subscription = subData?.subscription;
  const plan         = subData?.plan;
  const planSlug     = subscription?.planSlug ?? 'free';
  const planStyle    = PLAN_COLORS[planSlug] ?? PLAN_COLORS.free;

  // Name edit
  const [editingName, setEditingName]   = useState(false);
  const [nameVal, setNameVal]           = useState(user?.name ?? '');
  const [nameSaving, setNameSaving]     = useState(false);
  const [nameError, setNameError]       = useState('');

  // Password change
  const [showPassForm, setShowPassForm] = useState(false);
  const [currentPass, setCurrentPass]   = useState('');
  const [newPass, setNewPass]           = useState('');
  const [confirmPass, setConfirmPass]   = useState('');
  const [showCur, setShowCur]           = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConf, setShowConf]         = useState(false);
  const [passSaving, setPassSaving]     = useState(false);
  const [passError, setPassError]       = useState('');
  const [passSuccess, setPassSuccess]   = useState('');

  // Full profile state
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [github, setGithub] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [prefLocations, setPrefLocations] = useState<string[]>([]);
  const [prefJobTypes, setPrefJobTypes] = useState<string[]>([]);
  const [prefSalaryMin, setPrefSalaryMin] = useState('');

  const isGoogleUser = !!user?.googleId;

  // Load full profile
  useEffect(() => {
    if (!user || profileLoaded) return;
    (async () => {
      try {
        const p = await getFullProfile();
        setPhone(p.phone ?? '');
        setLocation(p.location ?? '');
        setLinkedIn(p.linkedIn ?? '');
        setPortfolio(p.portfolio ?? '');
        setGithub(p.github ?? '');
        setTitle(p.title ?? '');
        setBio(p.bio ?? '');
        setSkills(p.skills ?? []);
        setEducation(p.education ?? []);
        setExperience(p.experience ?? []);
        setCertifications(p.certifications ?? []);
        setCoverLetter(p.coverLetter ?? '');
        setPrefLocations(p.preferences?.locations ?? []);
        setPrefJobTypes(p.preferences?.jobTypes ?? []);
        setPrefSalaryMin(p.preferences?.salaryMin != null ? String(p.preferences.salaryMin) : '');
        setProfileLoaded(true);
      } catch {
        setProfileLoaded(true);
      }
    })();
  }, [user, profileLoaded]);

  async function saveName() {
    if (!nameVal.trim()) { setNameError('Name cannot be empty'); return; }
    setNameSaving(true);
    setNameError('');
    try {
      await updateProfile({ name: nameVal.trim() });
      await refreshUser();
      setEditingName(false);
    } catch (err: any) {
      setNameError(err?.response?.data?.message ?? 'Failed to update name');
    } finally {
      setNameSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    if (newPass !== confirmPass) { setPassError('Passwords do not match'); return; }
    if (newPass.length < 6) { setPassError('Password must be at least 6 characters'); return; }
    setPassSaving(true);
    try {
      await updateProfile({ currentPassword: currentPass, newPassword: newPass });
      setPassSuccess('Password updated successfully!');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
      setShowPassForm(false);
    } catch (err: any) {
      setPassError(err?.response?.data?.message ?? 'Failed to update password');
    } finally {
      setPassSaving(false);
    }
  }

  async function saveFullProfile() {
    setProfileSaving(true);
    setProfileMessage('');
    setProfileError('');
    try {
      await updateFullProfile({
        phone: phone || null,
        location: location || null,
        linkedIn: linkedIn || null,
        portfolio: portfolio || null,
        github: github || null,
        title: title || null,
        bio: bio || null,
        skills,
        education,
        experience,
        certifications,
        coverLetter: coverLetter || null,
        preferences: {
          locations: prefLocations,
          jobTypes: prefJobTypes,
          salaryMin: prefSalaryMin ? Number(prefSalaryMin) : null,
        },
      });
      setProfileMessage('Profile saved successfully!');
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (err: any) {
      setProfileError(err?.response?.data?.message ?? 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile</h1>

        <div className="space-y-5">
          {/* User info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={nameVal}
                      onChange={(e) => setNameVal(e.target.value)}
                      autoFocus
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                    />
                    <button onClick={saveName} disabled={nameSaving}
                      className="p-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg disabled:opacity-60">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditingName(false); setNameVal(user?.name ?? ''); setNameError(''); }}
                      className="p-1.5 border border-gray-300 text-gray-500 hover:bg-gray-50 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">{user?.name}</h2>
                    <button onClick={() => { setEditingName(true); setNameVal(user?.name ?? ''); }}
                      className="text-gray-400 hover:text-gray-600">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
                <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>Member since {user && new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Professional info */}
          <SectionCard title="Professional Info" icon={Briefcase}>
            <div className="space-y-3">
              <InputField label="Professional title" value={title} onChange={setTitle} placeholder="e.g. Senior Frontend Developer" icon={Briefcase} />
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bio / Summary</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                  rows={3} placeholder="Brief professional summary for job applications"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Phone" value={phone} onChange={setPhone} placeholder="+1 (555) 123-4567" icon={Phone} />
                <InputField label="Location" value={location} onChange={setLocation} placeholder="City, State" icon={MapPin} />
              </div>
            </div>
          </SectionCard>

          {/* Links */}
          <SectionCard title="Links" icon={Globe}>
            <div className="space-y-3">
              <InputField label="LinkedIn" value={linkedIn} onChange={setLinkedIn} placeholder="https://linkedin.com/in/yourprofile" icon={Linkedin} />
              <InputField label="Portfolio" value={portfolio} onChange={setPortfolio} placeholder="https://yourportfolio.com" icon={Globe} />
              <InputField label="GitHub" value={github} onChange={setGithub} placeholder="https://github.com/yourhandle" icon={Github} />
            </div>
          </SectionCard>

          {/* Resume URL */}
          <SectionCard title="Resume" icon={FileText}>
            <InputField label="Resume URL" value={user?.profile?.resumeUrl ?? ''} onChange={() => {}}
              placeholder="Link to your resume/CV" icon={FileText} />
            <p className="text-xs text-gray-400 mt-1">Upload resume via the job portal or provide a direct URL.</p>
          </SectionCard>

          {/* Skills */}
          <SectionCard title="Skills" icon={Zap}>
            <TagsInput values={skills} onChange={setSkills} placeholder="Type a skill and press Enter..." />
          </SectionCard>

          {/* Education */}
          <SectionCard title="Education" icon={GraduationCap}>
            <EducationForm items={education} onChange={setEducation} />
          </SectionCard>

          {/* Experience */}
          <SectionCard title="Experience" icon={Briefcase}>
            <ExperienceForm items={experience} onChange={setExperience} />
          </SectionCard>

          {/* Certifications */}
          <SectionCard title="Certifications" icon={Award}>
            <CertificationsForm items={certifications} onChange={setCertifications} />
          </SectionCard>

          {/* Cover letter */}
          <SectionCard title="Cover Letter Template" icon={BookOpen}>
            <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
              rows={6} placeholder="Write a default cover letter template for job applications..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          </SectionCard>

          {/* Job preferences */}
          <SectionCard title="Job Preferences" icon={MapPin}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Preferred locations</label>
                <TagsInput values={prefLocations} onChange={setPrefLocations} placeholder="Add location..." />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Preferred job types</label>
                <TagsInput values={prefJobTypes} onChange={setPrefJobTypes} placeholder="e.g. full-time, remote..." />
              </div>
              <InputField label="Minimum salary ($)" value={prefSalaryMin} onChange={setPrefSalaryMin} type="number" placeholder="50000" />
            </div>
          </SectionCard>

          {/* Save full profile */}
          <div className="flex items-center gap-3">
            <button onClick={saveFullProfile} disabled={profileSaving}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
              {profileSaving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              Save Profile
            </button>
            {profileMessage && <span className="text-green-600 text-sm flex items-center gap-1"><Check className="w-3.5 h-3.5" />{profileMessage}</span>}
            {profileError && <span className="text-red-500 text-sm">{profileError}</span>}
          </div>

          {/* Change password */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-gray-400" /> Password
              </h3>
              {!isGoogleUser && !showPassForm && (
                <button onClick={() => setShowPassForm(true)}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                  <Pencil className="w-3.5 h-3.5" /> Change
                </button>
              )}
            </div>

            {isGoogleUser ? (
              <p className="text-sm text-gray-500">
                Signed in with Google.{' '}
                <Link to="/forgot-password" className="text-brand-600 hover:text-brand-700 font-medium">
                  Set a password
                </Link>
              </p>
            ) : !showPassForm ? (
              <>
                <p className="text-sm text-gray-500">••••••••••••</p>
                {passSuccess && (
                  <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {passSuccess}
                  </p>
                )}
              </>
            ) : (
              <form onSubmit={savePassword} className="mt-4 space-y-3">
                {passError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                    {passError}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Current password</label>
                  <div className="relative">
                    <input type={showCur ? 'text' : 'password'} value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)} required
                      className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Your current password" />
                    <button type="button" onClick={() => setShowCur(!showCur)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                      {showCur ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">New password</label>
                  <div className="relative">
                    <input type={showNew ? 'text' : 'password'} value={newPass}
                      onChange={(e) => setNewPass(e.target.value)} required minLength={6}
                      className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="At least 6 characters" />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Confirm new password</label>
                  <div className="relative">
                    <input type={showConf ? 'text' : 'password'} value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)} required
                      className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Repeat new password" />
                    <button type="button" onClick={() => setShowConf(!showConf)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                      {showConf ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={passSaving}
                    className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
                    {passSaving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Update Password
                  </button>
                  <button type="button" onClick={() => { setShowPassForm(false); setPassError(''); setCurrentPass(''); setNewPass(''); setConfirmPass(''); }}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Subscription */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" /> Subscription
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1.5 border rounded-lg text-sm font-semibold capitalize ${planStyle}`}>
                {plan?.name ?? planSlug}
              </span>
              {subscription?.status && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {subscription.status}
                </span>
              )}
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-5">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span>{plan?.jobLimit === -1 ? 'Unlimited jobs/day' : `${(plan?.jobLimit ?? 0).toLocaleString()} jobs/day`}</span>
              </div>
              <div className="flex items-center gap-2">
                {plan?.applyLimit === -1 ? (
                  <><Zap className="w-4 h-4 text-gray-400" /><span>Unlimited applies</span></>
                ) : (
                  <><Zap className="w-4 h-4 text-gray-400" /><span>{(plan?.applyLimit ?? 10).toLocaleString()} applies per period</span></>
                )}
              </div>
              {subscription?.planExpiresAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Expires {new Date(subscription.planExpiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
            </div>
            {planSlug !== 'elite' && (
              <Link
                to="/plans"
                className="block text-center bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {subscription?.status === 'active' && planSlug !== 'free' ? 'Upgrade Plan' : 'View Plans'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
