import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Theme } from '../../types';
import { Loader2, AlertTriangle, CheckCircle2, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MathRenderer from '../MathRenderer';

interface AdminReportsPanelProps {
  theme: Theme;
}

interface QuestionReport {
  id: string;
  question_id: number;
  error_type: string;
  details: string;
  status: string;
  created_at: string;
  questions?: {
    text: string;
  };
}

export default function AdminReportsPanel({ theme }: AdminReportsPanelProps) {
  const isDark = theme === 'dark';
  
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('question_reports')
        .select(`
          *,
          questions (
            text
          )
        `)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setReports(data as QuestionReport[]);
      } else if (error) {
        console.error(error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('question_reports')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (!error) {
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá báo cáo này?")) return;
    try {
      const { error } = await supabase
        .from('question_reports')
        .delete()
        .eq('id', id);
        
      if (!error) {
        setReports(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  }

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status === 'resolved');

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold font-display flex items-center gap-2 ${isDark ? 'text-white' : 'text-text-dark'}`}>
            <AlertTriangle className="w-5 h-5 text-accent-warm" />
            Báo cáo lỗi từ người dùng ({pendingReports.length} chờ xử lý)
          </h3>
          <button onClick={fetchReports} className="text-sm text-primary hover:underline font-semibold">
            Làm mới
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-10 text-slate-500 italic text-sm">
            Hiện không có báo cáo lỗi nào.
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {reports.map((report) => (
                <motion.div 
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-xl border ${
                    report.status === 'resolved'
                      ? (isDark ? 'border-white/5 bg-white/5 opacity-70' : 'border-slate-200 bg-slate-50 opacity-70')
                      : (isDark ? 'border-accent-warm/30 bg-accent-warm/5' : 'border-accent-warm/20 bg-accent-warm/5')
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          report.error_type === 'Missing Graph/Image' 
                            ? 'bg-purple-100 text-purple-700'
                            : report.error_type === 'Answers'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {report.error_type}
                        </span>
                        <span className={`text-[10px] font-semibold ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
                          {new Date(report.created_at).toLocaleString('vi-VN')}
                        </span>
                        {report.status === 'resolved' && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase tracking-wider ml-2">
                            <CheckCircle2 className="w-3 h-3" /> Resolved
                          </span>
                        )}
                      </div>
                      
                      <div className={`text-sm mb-3 font-medium ${isDark ? 'text-text-primary' : 'text-text-dark'}`}>
                        <span className={`opacity-70 text-xs mr-2`}>ID Câu hỏi: {report.question_id}</span>
                      </div>

                      {report.questions?.text && (
                        <div className={`mb-3 p-3 rounded-lg text-sm border font-serif ${
                          isDark ? 'bg-bg-dark border-white/5 text-text-secondary' : 'bg-white border-slate-200 text-text-dark-secondary'
                        }`}>
                          <MathRenderer content={report.questions.text} isDark={isDark} disableMath={false} />
                        </div>
                      )}

                      {report.details && (
                        <div className={`text-sm p-3 rounded-lg border border-dashed ${
                          isDark ? 'border-white/20 bg-white/5 text-white' : 'border-slate-300 bg-slate-100 text-black'
                        }`}>
                          <strong className="block text-xs mb-1 opacity-70">Chi tiết phản hồi:</strong>
                          {report.details}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                      {report.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'resolved')}
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã xử lý
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(report.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                          isDark ? 'bg-white/5 hover:bg-red-500/20 text-red-400 border border-white/10' : 'bg-white hover:bg-red-50 text-red-500 border border-slate-200'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xoá
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
