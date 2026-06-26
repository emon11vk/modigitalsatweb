import { useState } from 'react';
import { Theme } from '../types';
import { useAdminRole } from '../hooks/useAdminRole';
import { loadExam } from '../utils/saveExam';
import AdminDashboard from './admin/AdminDashboard';
import ExamEditorPanel from './admin/ExamEditorPanel';
import ExamManagerPanel from './admin/ExamManagerPanel';
import AdminManagementPanel from './admin/AdminManagementPanel';
import AdminVocabPanel from './admin/AdminVocabPanel';
import {
  ShieldAlert,
  LayoutDashboard,
  FileEdit,
  Database,
  Users,
  BookOpen,
  Loader2,
  Lock,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminScreenProps {
  theme: Theme;
}

type AdminTab = 'dashboard' | 'editor' | 'manager' | 'vocab' | 'admins';

export default function AdminScreen({ theme }: AdminScreenProps) {
  const isDark = theme === 'dark';
  const { loading, isAdmin, isRoot, email } = useAdminRole();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // ─── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className={`text-sm font-semibold ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
          Checking permissions...
        </p>
      </div>
    );
  }

  // ─── Not Admin ─────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-32 max-w-md mx-auto text-center"
      >
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${
            isDark ? 'bg-accent-warm/10 border border-accent-warm/20' : 'bg-red-50 border border-red-100'
          }`}
        >
          <Lock className={`w-8 h-8 ${isDark ? 'text-accent-warm' : 'text-red-400'}`} />
        </div>
        <h2 className={`text-2xl font-black font-display ${isDark ? 'text-white' : 'text-text-dark'}`}>
          Access Denied
        </h2>
        <p className={`text-sm mt-3 leading-relaxed ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
          This area is restricted to administrators only. If you believe you should have access, contact the root admin.
        </p>
        <div className={`mt-6 px-4 py-2 rounded-xl text-xs font-mono ${isDark ? 'bg-white/5 text-text-muted' : 'bg-slate-100 text-slate-500'}`}>
          {email || 'Not signed in'}
        </div>
      </motion.div>
    );
  }

  // ─── Tab Config ────────────────────────────────────────────
  const tabs: {
    key: AdminTab;
    label: string;
    icon: React.ReactNode;
    rootOnly?: boolean;
  }[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      key: 'editor',
      label: 'Exam Editor',
      icon: <FileEdit className="w-4 h-4" />,
    },
    {
      key: 'manager',
      label: 'Exam Manager',
      icon: <Database className="w-4 h-4" />,
    },
    {
      key: 'vocab',
      label: 'Vocab Hub',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      key: 'admins',
      label: 'Admin Access',
      icon: <Users className="w-4 h-4" />,
      rootOnly: true,
    },
  ];

  const handleEditExam = async (examId: string) => {
    setActiveTab('editor');
    // The editor will load the exam when it mounts
    // We need a way to pass the examId - use a key trick
    setEditingExamId(examId);
  };

  // ─── Main Admin UI ────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl border p-8 md:p-10 ${
          isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-200'
        }`}
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-warm/10 border border-accent-warm/20 text-accent-warm text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              Admin Console
            </span>
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-black font-display tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-text-dark'
              }`}
            >
              Control Center
            </h2>
            <p
              className={`text-sm leading-relaxed ${
                isDark ? 'text-text-secondary' : 'text-text-dark-secondary'
              }`}
            >
              Manage exams, questions, images, and admin access.
            </p>
          </div>

          {/* Role Badge */}
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shrink-0 ${
              isRoot
                ? isDark
                  ? 'bg-accent-gold/10 border-accent-gold/20'
                  : 'bg-amber-50 border-amber-200'
                : isDark
                ? 'bg-primary/10 border-primary/20'
                : 'bg-indigo-50 border-indigo-200'
            }`}
          >
            {isRoot ? (
              <Crown className={`w-4 h-4 ${isDark ? 'text-accent-gold' : 'text-amber-500'}`} />
            ) : (
              <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-primary' : 'text-indigo-500'}`} />
            )}
            <div>
              <p className={`text-[10px] uppercase tracking-wider font-bold ${
                isRoot
                  ? isDark ? 'text-accent-gold' : 'text-amber-600'
                  : isDark ? 'text-primary' : 'text-indigo-600'
              }`}>
                {isRoot ? 'Root Admin' : 'Admin'}
              </p>
              <p className={`text-[11px] font-medium truncate max-w-[180px] ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
                {email}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`flex items-center gap-1 p-1.5 rounded-2xl overflow-x-auto ${
          isDark ? 'bg-white/5' : 'bg-slate-100'
        }`}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isHidden = tab.rootOnly && !isRoot;

          if (isHidden) return null;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key !== 'editor') setEditingExamId(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : isDark
                  ? 'text-text-muted hover:text-white hover:bg-white/5'
                  : 'text-text-dark-secondary hover:text-text-dark hover:bg-white'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.rootOnly && (
                <Crown className="w-3 h-3 opacity-50" />
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && <AdminDashboard theme={theme} />}

        {activeTab === 'editor' && (
          <ExamEditorPanel
            key={editingExamId ?? 'new'}
            examId={editingExamId ?? undefined}
            theme={theme}
            userEmail={email ?? ''}
          />
        )}

        {activeTab === 'manager' && (
          <ExamManagerPanel theme={theme} onEditExam={handleEditExam} />
        )}

        {activeTab === 'vocab' && (
          <AdminVocabPanel theme={theme} userEmail={email ?? ''} />
        )}

        {activeTab === 'admins' && (
          <AdminManagementPanel
            theme={theme}
            currentEmail={email ?? ''}
            isRoot={isRoot}
          />
        )}
      </div>
    </div>
  );
}
