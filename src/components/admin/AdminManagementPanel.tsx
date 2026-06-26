import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Theme } from '../../types';
import {
  Users,
  UserPlus,
  Trash2,
  RefreshCw,
  Shield,
  ShieldCheck,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminManagementPanelProps {
  theme: Theme;
  currentEmail: string;
  isRoot: boolean;
}

interface AdminRow {
  id: string;
  email: string;
  granted_by: string | null;
  granted_at: string;
  is_root: boolean;
}

export default function AdminManagementPanel({
  theme,
  currentEmail,
  isRoot,
}: AdminManagementPanelProps) {
  const isDark = theme === 'dark';
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantEmail, setGrantEmail] = useState('');
  const [granting, setGranting] = useState(false);
  const [grantStatus, setGrantStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  async function fetchAdmins() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('granted_at', { ascending: true });

      if (error) throw error;
      setAdmins(data || []);
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!grantEmail.trim()) return;

    setGranting(true);
    setGrantStatus({ type: 'idle', message: '' });

    try {
      const email = grantEmail.trim().toLowerCase();

      // Check if already admin
      const existing = admins.find(
        (a) => a.email.toLowerCase() === email
      );
      if (existing) {
        setGrantStatus({
          type: 'error',
          message: `${email} is already an admin.`,
        });
        setGranting(false);
        return;
      }

      const { error } = await supabase.from('admins').insert({
        email,
        granted_by: currentEmail,
      });

      if (error) {
        if (error.message.includes('row-level security')) {
          setGrantStatus({
            type: 'error',
            message: 'You do not have permission to grant admin access.',
          });
        } else {
          setGrantStatus({ type: 'error', message: error.message });
        }
        setGranting(false);
        return;
      }

      setGrantStatus({
        type: 'success',
        message: `Granted admin access to ${email}`,
      });
      setGrantEmail('');
      fetchAdmins();
    } catch (err: any) {
      setGrantStatus({ type: 'error', message: err.message });
    } finally {
      setGranting(false);
    }
  }

  async function handleRevoke(adminId: string) {
    setRevokingId(adminId);
    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId);

      if (error) {
        console.error('Revoke error:', error);
        alert(
          error.message.includes('row-level security')
            ? 'You do not have permission to revoke admin access.'
            : error.message
        );
      } else {
        setAdmins((prev) => prev.filter((a) => a.id !== adminId));
      }
    } catch (err) {
      console.error('Revoke error:', err);
    } finally {
      setRevokingId(null);
      setConfirmRevokeId(null);
    }
  }

  if (!isRoot) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-center py-20 rounded-2xl border ${
          isDark ? 'bg-bg-card border-white/10' : 'bg-white border-slate-200'
        }`}
      >
        <Shield className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-white/10' : 'text-slate-200'}`} />
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-text-dark'}`}>
          Root Access Required
        </h3>
        <p className={`text-sm mt-2 max-w-md mx-auto ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
          Only the root administrator can manage admin access. Contact the root admin to request changes.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grant Admin Form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-6 ${
          isDark ? 'bg-bg-card border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <UserPlus className="w-5 h-5 text-primary" />
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-text-dark'}`}>
            Grant Admin Access
          </h3>
        </div>
        <p className={`text-xs mb-5 ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
          Enter any Gmail address to grant admin access. Works even if the user hasn't signed up yet — they'll get admin rights on first login.
        </p>

        <form onSubmit={handleGrant} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-text-muted' : 'text-slate-400'}`} />
            <input
              type="email"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="admin@gmail.com"
              required
              className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border transition-all ${
                isDark
                  ? 'bg-bg-dark border-white/10 text-white placeholder:text-text-muted/50'
                  : 'bg-slate-50 border-slate-200 text-text-dark placeholder:text-slate-400'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={granting || !grantEmail.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer
              bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {granting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Grant Admin
          </button>
        </form>

        {/* Grant Status */}
        <AnimatePresence>
          {grantStatus.type !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-4 p-3 rounded-xl border flex items-start gap-2 text-xs ${
                grantStatus.type === 'success'
                  ? isDark
                    ? 'bg-accent/10 border-accent/20 text-accent'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isDark
                  ? 'bg-accent-warm/10 border-accent-warm/20 text-accent-warm'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {grantStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{grantStatus.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Admin List */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-bg-card border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-gold" />
            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-text-dark'}`}>
              Current Admins
            </h3>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-white/5 text-text-muted' : 'bg-slate-100 text-slate-500'}`}>
              {admins.length}
            </span>
          </div>
          <button
            onClick={fetchAdmins}
            disabled={loading}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              isDark
                ? 'hover:bg-white/5 text-text-muted'
                : 'hover:bg-slate-50 text-slate-400'
            } ${loading ? 'opacity-50' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {admins.map((admin, i) => (
              <motion.div
                key={admin.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center justify-between px-5 py-4 transition-colors ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      admin.is_root
                        ? 'bg-accent-gold/15 text-accent-gold'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {admin.is_root ? (
                      <Crown className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-text-dark'}`}>
                        {admin.email}
                      </p>
                      {admin.is_root && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-accent-gold/15 text-accent-gold">
                          Root
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-3 mt-0.5 text-[11px] ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(admin.granted_at).toLocaleDateString()}
                      </span>
                      {admin.granted_by && (
                        <span>by {admin.granted_by}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Revoke Button (not for root) */}
                {!admin.is_root && (
                  <div className="shrink-0 ml-3">
                    {confirmRevokeId === admin.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRevoke(admin.id)}
                          disabled={revokingId === admin.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-accent-warm text-white cursor-pointer hover:bg-accent-warm/80 transition-all disabled:opacity-50"
                        >
                          {revokingId === admin.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            'Revoke'
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmRevokeId(null)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                            isDark
                              ? 'bg-white/5 text-text-muted hover:text-white'
                              : 'bg-slate-100 text-slate-500 hover:text-text-dark'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRevokeId(admin.id)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          isDark
                            ? 'border-white/10 text-text-muted hover:text-accent-warm hover:border-accent-warm/20 hover:bg-accent-warm/5'
                            : 'border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200'
                        }`}
                        title="Revoke admin access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Security Note */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-xl p-4 flex items-start gap-3 text-xs ${
          isDark
            ? 'bg-accent-gold/5 border border-accent-gold/10 text-accent-gold/70'
            : 'bg-amber-50 border border-amber-100 text-amber-700'
        }`}
      >
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Security Notice</p>
          <p className="mt-1 leading-relaxed opacity-80">
            Admin access is enforced at the database level via Row Level Security (RLS).
            Even if the UI is bypassed, unauthorized users cannot perform admin operations.
            Root admin status is hardcoded in a SECURITY DEFINER function and cannot be tampered with.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
