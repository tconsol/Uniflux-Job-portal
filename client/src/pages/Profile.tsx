import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, CreditCard, Calendar, Shield, Pencil, Eye, EyeOff, Check, X, KeyRound, Zap, Globe, FileText, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useBilling';
import { updateProfile } from '../api/auth.api';
import { getMyProfile, updateProfileFields } from '../api/profile.api';
import type { ProfileField, ProfileEducationEntry, ProfileExperienceEntry, ProfileCertificationEntry } from '../types';

const PLAN_COLORS: Record<string, string> = {
  free:     'bg-gray-100 text-gray-700 border-gray-200',
  standard: 'bg-blue-50 text-blue-700 border-blue-200',
  premium:  'bg-purple-50 text-purple-700 border-purple-200',
  elite:    'bg-amber-50 text-amber-700 border-amber-200',
};

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

  const isGoogleUser = !!user?.googleId;

  // Region (job market)
  const [regionSaving, setRegionSaving] = useState(false);
  const [regionError, setRegionError]   = useState('');

  // AutoFill profile (extension-facing fields)
  const [afLoading, setAfLoading]   = useState(true);
  const [afSaving, setAfSaving]     = useState(false);
  const [afError, setAfError]       = useState('');
  const [afSuccess, setAfSuccess]   = useState('');

  const [afTitle, setAfTitle]           = useState('');
  const [afPhone, setAfPhone]           = useState('');
  const [afLocation, setAfLocation]     = useState('');
  const [afLinkedIn, setAfLinkedIn]     = useState('');
  const [afPortfolio, setAfPortfolio]   = useState('');
  const [afGithub, setAfGithub]         = useState('');
  const [afResumeUrl, setAfResumeUrl]   = useState('');
  const [afBio, setAfBio]               = useState('');
  const [afCoverLetter, setAfCoverLetter] = useState('');
  const [afSkillsText, setAfSkillsText] = useState('');
  const [afEducation, setAfEducation]   = useState<ProfileEducationEntry[]>([]);
  const [afExperience, setAfExperience] = useState<ProfileExperienceEntry[]>([]);
  const [afCertifications, setAfCertifications] = useState<ProfileCertificationEntry[]>([]);

  useEffect(() => {
    getMyProfile()
      .then((p: ProfileField) => {
        setAfTitle(p.title ?? '');
        setAfPhone(p.phone ?? '');
        setAfLocation(p.location ?? '');
        setAfLinkedIn(p.linkedIn ?? '');
        setAfPortfolio(p.portfolio ?? '');
        setAfGithub(p.github ?? '');
        setAfResumeUrl(p.resumeUrl ?? '');
        setAfBio(p.bio ?? '');
        setAfCoverLetter(p.coverLetter ?? '');
        setAfSkillsText(p.skills.join(', '));
        setAfEducation(p.education);
        setAfExperience(p.experience);
        setAfCertifications(p.certifications);
      })
      .catch(() => setAfError('Failed to load AutoFill profile'))
      .finally(() => setAfLoading(false));
  }, []);

  async function saveAutofillProfile() {
    setAfSaving(true);
    setAfError('');
    setAfSuccess('');
    try {
      await updateProfileFields({
        title: afTitle.trim() || null,
        phone: afPhone.trim() || null,
        location: afLocation.trim() || null,
        linkedIn: afLinkedIn.trim() || null,
        portfolio: afPortfolio.trim() || null,
        github: afGithub.trim() || null,
        resumeUrl: afResumeUrl.trim() || null,
        bio: afBio.trim() || null,
        coverLetter: afCoverLetter.trim() || null,
        skills: afSkillsText.split(',').map((s) => s.trim()).filter(Boolean),
        education: afEducation,
        experience: afExperience,
        certifications: afCertifications,
      });
      setAfSuccess('AutoFill profile saved');
    } catch (err: any) {
      setAfError(err?.response?.data?.message ?? 'Failed to save AutoFill profile');
    } finally {
      setAfSaving(false);
    }
  }

  function updateEducationRow(i: number, patch: Partial<ProfileEducationEntry>) {
    setAfEducation((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function updateExperienceRow(i: number, patch: Partial<ProfileExperienceEntry>) {
    setAfExperience((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function updateCertificationRow(i: number, patch: Partial<ProfileCertificationEntry>) {
    setAfCertifications((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function saveRegion(next: 'US' | 'IN') {
    if (next === (user?.region ?? 'US')) return;
    setRegionSaving(true);
    setRegionError('');
    try {
      await updateProfile({ region: next });
      await refreshUser();
    } catch (err: any) {
      setRegionError(err?.response?.data?.message ?? 'Failed to update region');
    } finally {
      setRegionSaving(false);
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
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

          {/* Job region */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-400" /> Job region
            </h3>
            <p className="text-sm text-gray-500 mb-4">Which market's jobs appear in your feed.</p>
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
              {(['US', 'IN'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => saveRegion(r)}
                  disabled={regionSaving}
                  className={`px-5 py-2 text-sm font-medium rounded-lg transition disabled:opacity-60 ${
                    (user?.region ?? 'US') === r ? 'bg-brand-600 text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {r === 'US' ? 'United States' : 'India'}
                </button>
              ))}
            </div>
            {regionError && <p className="text-red-500 text-xs mt-2">{regionError}</p>}
          </div>

          {/* AutoFill profile (used by the Uniflux AutoFill extension) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" /> AutoFill Profile
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Powers the Uniflux AutoFill browser extension on job application forms.
            </p>

            {afLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : (
              <div className="space-y-4">
                {afError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                    {afError}
                  </div>
                )}
                {afSuccess && (
                  <p className="text-green-600 text-sm flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {afSuccess}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Headline / title" value={afTitle} onChange={setAfTitle} placeholder="Full Stack Developer" />
                  <Field label="Phone" value={afPhone} onChange={setAfPhone} placeholder="+91 9876543210" />
                  <Field label="Location" value={afLocation} onChange={setAfLocation} placeholder="Bengaluru, India" />
                  <Field label="LinkedIn URL" value={afLinkedIn} onChange={setAfLinkedIn} placeholder="https://linkedin.com/in/..." />
                  <Field label="Portfolio / website" value={afPortfolio} onChange={setAfPortfolio} placeholder="https://..." />
                  <Field label="GitHub URL" value={afGithub} onChange={setAfGithub} placeholder="https://github.com/..." />
                  <Field label="Resume URL" value={afResumeUrl} onChange={setAfResumeUrl} placeholder="https://..." />
                  <Field label="Skills (comma-separated)" value={afSkillsText} onChange={setAfSkillsText} placeholder="React, Node.js, SQL" />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bio</label>
                  <textarea value={afBio} onChange={(e) => setAfBio(e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Short professional summary" />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cover letter template</label>
                  <textarea value={afCoverLetter} onChange={(e) => setAfCoverLetter(e.target.value)} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Used to fill cover-letter fields on application forms" />
                </div>

                {/* Education */}
                <ListEditor
                  label="Education"
                  rows={afEducation}
                  onAdd={() => setAfEducation((r) => [...r, {}])}
                  onRemove={(i) => setAfEducation((r) => r.filter((_, idx) => idx !== i))}
                  renderRow={(row, i) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Field label="Institution" value={row.institution ?? ''} onChange={(v) => updateEducationRow(i, { institution: v })} />
                      <Field label="Degree" value={row.degree ?? ''} onChange={(v) => updateEducationRow(i, { degree: v })} />
                      <Field label="Field of study" value={row.field ?? ''} onChange={(v) => updateEducationRow(i, { field: v })} />
                      <Field label="GPA" value={row.gpa ?? ''} onChange={(v) => updateEducationRow(i, { gpa: v })} />
                    </div>
                  )}
                />

                {/* Experience */}
                <ListEditor
                  label="Experience"
                  rows={afExperience}
                  onAdd={() => setAfExperience((r) => [...r, { current: false }])}
                  onRemove={(i) => setAfExperience((r) => r.filter((_, idx) => idx !== i))}
                  renderRow={(row, i) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Field label="Company" value={row.company ?? ''} onChange={(v) => updateExperienceRow(i, { company: v })} />
                      <Field label="Title" value={row.title ?? ''} onChange={(v) => updateExperienceRow(i, { title: v })} />
                      <Field label="Location" value={row.location ?? ''} onChange={(v) => updateExperienceRow(i, { location: v })} />
                      <label className="flex items-center gap-2 text-sm text-gray-600 mt-5">
                        <input type="checkbox" checked={!!row.current}
                          onChange={(e) => updateExperienceRow(i, { current: e.target.checked })} />
                        Current role
                      </label>
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Description</label>
                        <textarea value={row.description ?? ''} onChange={(e) => updateExperienceRow(i, { description: e.target.value })}
                          rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      </div>
                    </div>
                  )}
                />

                {/* Certifications */}
                <ListEditor
                  label="Certifications"
                  rows={afCertifications}
                  onAdd={() => setAfCertifications((r) => [...r, {}])}
                  onRemove={(i) => setAfCertifications((r) => r.filter((_, idx) => idx !== i))}
                  renderRow={(row, i) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Field label="Name" value={row.name ?? ''} onChange={(v) => updateCertificationRow(i, { name: v })} />
                      <Field label="Issuer" value={row.issuer ?? ''} onChange={(v) => updateCertificationRow(i, { issuer: v })} />
                      <Field label="URL" value={row.url ?? ''} onChange={(v) => updateCertificationRow(i, { url: v })} />
                    </div>
                  )}
                />

                <button onClick={saveAutofillProfile} disabled={afSaving}
                  className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
                  {afSaving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save AutoFill Profile
                </button>
              </div>
            )}
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

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
    </div>
  );
}

function ListEditor<T>({ label, rows, onAdd, onRemove, renderRow }: {
  label: string;
  rows: T[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  renderRow: (row: T, i: number) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <button type="button" onClick={onAdd}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">None added yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 relative">
              <button type="button" onClick={() => onRemove(i)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="pr-6">{renderRow(row, i)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
