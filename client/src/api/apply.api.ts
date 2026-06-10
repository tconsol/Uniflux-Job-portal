import api from './axios';
import type { Job } from '../types';

export interface AppliedJobEntry {
  jobId:     string;
  title:     string;
  company:   string;
  location:  string;
  applyUrl:  string;
  appliedAt: string;
}

const LS_KEY = 'uniflux_applied_jobs';

function loadLocal(): Record<string, AppliedJobEntry> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

function saveLocal(entries: Record<string, AppliedJobEntry>) {
  localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

export function getLocalApplied(): AppliedJobEntry[] {
  return Object.values(loadLocal()).sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  );
}

export async function applyToJob(job: Job): Promise<{
  ok: boolean;
  alreadyApplied?: boolean;
  appliesUsed?: number;
  applyLimit?: number;
  limitReached?: boolean;
}> {
  const { data } = await api.post(`/jobs/${job._id}/apply`, {
    jobTitle: job.title,
    company:  job.company,
    location: job.location,
    applyUrl: job.applyUrl,
  });

  if (data.ok) {
    const entries = loadLocal();
    entries[job._id] = {
      jobId:     job._id,
      title:     job.title,
      company:   job.company,
      location:  job.location,
      applyUrl:  job.applyUrl,
      appliedAt: new Date().toISOString(),
    };
    saveLocal(entries);
  }

  return data;
}

export async function getAppliedJobs(): Promise<{
  jobs: AppliedJobEntry[];
  total: number;
}> {
  // Merge server records with localStorage (localStorage has the full details)
  const { data } = await api.get('/jobs/applied');
  const local = loadLocal();

  const merged: AppliedJobEntry[] = (data.jobs as Array<{ _id: string; title: string; company: string; location: string; applyUrl: string; appliedAt: string }>)
    .map((s) => {
      const loc = local[s._id];
      return {
        jobId:     s._id,
        title:     loc?.title    || s.title    || '',
        company:   loc?.company  || s.company  || '',
        location:  loc?.location || s.location || '',
        applyUrl:  loc?.applyUrl || s.applyUrl || '',
        appliedAt: s.appliedAt,
      };
    })
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

  return { jobs: merged, total: merged.length };
}
