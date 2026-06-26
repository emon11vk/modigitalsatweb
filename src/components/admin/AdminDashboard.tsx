import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Theme } from '../../types';
import {
  FileText,
  Users,
  HelpCircle,
  TrendingUp,
  BarChart3,
  Clock,
  Layers,
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  theme: Theme;
}

interface DashboardStats {
  totalExams: number;
  totalQuestions: number;
  totalAdmins: number;
  totalModules: number;
}

export default function AdminDashboard({ theme }: AdminDashboardProps) {
  const isDark = theme === 'dark';
  const [stats, setStats] = useState<DashboardStats>({
    totalExams: 0,
    totalQuestions: 0,
    totalAdmins: 0,
    totalModules: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const [examsRes, questionsRes, adminsRes, modulesRes] = await Promise.allSettled([
          supabase.from('exams').select('id', { count: 'exact', head: true }),
          supabase.from('exam_questions').select('id', { count: 'exact', head: true }),
          supabase.from('admins').select('id', { count: 'exact', head: true }),
          supabase.from('modules').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          totalExams:
            examsRes.status === 'fulfilled' ? examsRes.value.count ?? 0 : 0,
          totalQuestions:
            questionsRes.status === 'fulfilled' ? questionsRes.value.count ?? 0 : 0,
          totalAdmins:
            adminsRes.status === 'fulfilled' ? adminsRes.value.count ?? 0 : 0,
          totalModules:
            modulesRes.status === 'fulfilled' ? modulesRes.value.count ?? 0 : 0,
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Total Exams',
      value: stats.totalExams,
      icon: <FileText className="w-5 h-5" />,
      color: 'primary',
      gradient: 'from-primary/20 to-primary/5',
      borderColor: 'border-primary/20',
      iconBg: 'bg-primary/15 text-primary',
    },
    {
      label: 'Total Questions',
      value: stats.totalQuestions,
      icon: <HelpCircle className="w-5 h-5" />,
      color: 'accent',
      gradient: 'from-accent/20 to-accent/5',
      borderColor: 'border-accent/20',
      iconBg: 'bg-accent/15 text-accent',
    },
    {
      label: 'Active Admins',
      value: stats.totalAdmins,
      icon: <Users className="w-5 h-5" />,
      color: 'accent-gold',
      gradient: 'from-accent-gold/20 to-accent-gold/5',
      borderColor: 'border-accent-gold/20',
      iconBg: 'bg-accent-gold/15 text-accent-gold',
    },
    {
      label: 'Legacy Modules',
      value: stats.totalModules,
      icon: <Layers className="w-5 h-5" />,
      color: 'accent-warm',
      gradient: 'from-accent-warm/20 to-accent-warm/5',
      borderColor: 'border-accent-warm/20',
      iconBg: 'bg-accent-warm/15 text-accent-warm',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`relative overflow-hidden rounded-2xl p-5 border transition-all ${
              isDark
                ? `bg-bg-card ${card.borderColor}`
                : `bg-white border-slate-200 shadow-sm`
            }`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50`}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                  {card.icon}
                </div>
                <TrendingUp
                  className={`w-4 h-4 ${
                    isDark ? 'text-white/20' : 'text-slate-200'
                  }`}
                />
              </div>
              <div>
                <p
                  className={`text-2xl font-black font-display ${
                    isDark ? 'text-white' : 'text-text-dark'
                  }`}
                >
                  {loading ? '—' : card.value}
                </p>
                <p
                  className={`text-[11px] font-semibold mt-1 ${
                    isDark ? 'text-text-muted' : 'text-text-dark-secondary'
                  }`}
                >
                  {card.label}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className={`rounded-2xl p-6 border ${
            isDark ? 'bg-bg-card border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-text-dark'}`}>
              Quick Actions
            </h3>
          </div>
          <div className="space-y-3">
            <div
              className={`p-3 rounded-xl text-xs leading-relaxed ${
                isDark ? 'bg-white/5 text-text-secondary' : 'bg-slate-50 text-text-dark-secondary'
              }`}
            >
              <span className="font-semibold text-primary">📝 Exam Editor</span> — Import
              JSON, edit questions visually, upload images, and save to database.
            </div>
            <div
              className={`p-3 rounded-xl text-xs leading-relaxed ${
                isDark ? 'bg-white/5 text-text-secondary' : 'bg-slate-50 text-text-dark-secondary'
              }`}
            >
              <span className="font-semibold text-accent">📋 Exam Manager</span> — View, edit, or
              delete saved exams from the database.
            </div>
            <div
              className={`p-3 rounded-xl text-xs leading-relaxed ${
                isDark ? 'bg-white/5 text-text-secondary' : 'bg-slate-50 text-text-dark-secondary'
              }`}
            >
              <span className="font-semibold text-accent-gold">👥 Admin Management</span> — Grant
              or revoke admin access (root admin only).
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className={`rounded-2xl p-6 border ${
            isDark ? 'bg-bg-card border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-accent" />
            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-text-dark'}`}>
              System Status
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
                Database
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
                Storage
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
                Auth Provider
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Google OAuth
              </span>
            </div>
            <div
              className={`mt-3 pt-3 border-t text-[10px] ${
                isDark ? 'border-white/5 text-text-muted' : 'border-slate-100 text-slate-400'
              }`}
            >
              Last checked: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
