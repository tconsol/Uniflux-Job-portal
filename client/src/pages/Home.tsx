import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Shield, Zap, TrendingUp, Users, Briefcase, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useJobCount } from '../hooks/useJobs';
import { getDailyUsers } from '../utils/dailyUsers';

const FEATURES = [
  { icon: Search,    title: 'Aggregated Jobs',      desc: 'Jobs pulled from across the internet, normalized into one clean feed.' },
  { icon: Zap,       title: 'Real-time Updates',    desc: 'New jobs stream in live via SSE no refresh needed.' },
  { icon: Shield,    title: 'Subscription Plans',   desc: 'From 10 to unlimited jobs daily. Upgrade any time.' },
  { icon: TrendingUp, title: 'Smart Filtering',     desc: 'Filter by location, type, salary, skills, and company.' },
];

// Count-up animation hook
function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!target) return;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
      else setCount(target);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return count;
}

function AnimatedStat({ value, label, prefix = '', suffix = '', icon: Icon, color }: {
  value: number; label: string; prefix?: string; suffix?: string;
  icon: React.ElementType; color: string;
}) {
  const count = useCountUp(value);
  return (
    <div className={`relative flex flex-col items-center gap-1 bg-white border border-gray-100 rounded-2xl px-8 py-6 shadow-sm hover:shadow-md transition-shadow min-w-[160px]`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-3xl font-extrabold text-gray-900 tabular-nums tracking-tight">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { data: jobCount } = useJobCount();
  const dailyUsers = getDailyUsers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
          <Zap className="w-4 h-4" />
          Jobs aggregated from across the web
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Find jobs without
          <span className="text-brand-600"> the noise</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          One platform. Thousands of jobs. Curated fresh every day.
          No spam, no duplicates just the opportunities that matter.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <Link
              to="/jobs"
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
            >
              Browse Jobs <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/plans"
                className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl text-lg font-medium transition-colors"
              >
                View Pricing
              </Link>
            </>
          )}
        </div>

        {/* Animated Stats */}
        <div className="flex flex-wrap justify-center gap-4 mt-16">
          <AnimatedStat
            value={jobCount ?? 0}
            label="Jobs Available"
            icon={Briefcase}
            color="bg-brand-50 text-brand-600"
          />
          <AnimatedStat
            value={dailyUsers}
            label="Active Users"
            icon={Users}
            color="bg-green-50 text-green-600"
          />
          <AnimatedStat
            value={4}
            label="Plans Available"
            icon={RefreshCw}
            color="bg-purple-50 text-purple-600"
          />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Jobwalkers?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-brand-600 rounded-3xl px-8 py-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to find your next role?</h2>
            <p className="text-brand-100 mb-8 text-lg">Join thousands of job seekers using Jobwalkers daily.</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-brand-700 hover:bg-brand-50 px-8 py-3.5 rounded-xl font-semibold transition-colors"
            >
              Start for Free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
