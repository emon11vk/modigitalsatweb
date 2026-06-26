import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { fetchWordData } from '../../utils/dictionaryAPI';
import { Theme, VocabFolder } from '../../types';
import { FolderPlus, Trash2, Plus, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminVocabPanelProps {
  theme: Theme;
  userEmail: string;
}

export default function AdminVocabPanel({ theme, userEmail }: AdminVocabPanelProps) {
  const isDark = theme === 'dark';
  
  const [folders, setFolders] = useState<VocabFolder[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newFolderName, setNewFolderName] = useState('');
  
  const [importFolderId, setImportFolderId] = useState('');
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{success: number, error: number} | null>(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('vocab_folders')
        .select('*')
        .eq('is_admin_folder', true)
        .order('created_at', { ascending: true });
        
      if (!error && data) {
        setFolders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;

    // We must get the user id first
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    try {
      const { error } = await supabase
        .from('vocab_folders')
        .insert({
          name: newFolderName,
          user_id: userData.user.id,
          is_admin_folder: true
        });
      
      if (!error) {
        setNewFolderName('');
        fetchFolders();
      } else {
        alert('Lỗi tạo thư mục: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thư mục này và tất cả từ vựng bên trong?")) return;
    try {
      await supabase.from('vocab_folders').delete().eq('id', id);
      fetchFolders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImport = async () => {
    if (!importFolderId) {
      alert("Vui lòng chọn thư mục để import vào!");
      return;
    }
    if (!importText.trim()) {
      alert("Vui lòng nhập danh sách từ vựng!");
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const lines = importText.split('\n').filter(l => l.trim() !== '');
    let successCount = 0;
    let errorCount = 0;

    for (const line of lines) {
      // Expected format: Term | Type | Definition | Example
      const parts = line.split('|').map(p => p.trim());
      if (parts.length < 3) {
        errorCount++;
        continue;
      }

      const [term, type, definition, example = ''] = parts;
      
      try {
        const dictData = await fetchWordData(term);
        
        const { error } = await supabase.from('vocabulary').insert({
          user_id: userData.user.id,
          folder_id: importFolderId,
          term,
          type,
          definition,
          example,
          status: 'Learning',
          pronunciation: dictData.pronunciation || '',
          audio_url: dictData.audioUrl || ''
        });

        if (error) {
          console.error(error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        errorCount++;
      }
    }

    setIsImporting(false);
    setImportResult({ success: successCount, error: errorCount });
    setImportText('');
  };

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ── Folders Column ── */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-lg font-bold font-display mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-text-dark'}`}>
          <Sparkles className="w-5 h-5 text-accent" />
          Thư mục toàn cầu (Admin)
        </h3>
        
        <form onSubmit={handleCreateFolder} className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Tên thư mục mới..." 
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            className={`flex-1 px-4 py-2 text-sm rounded-xl ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-text-dark'}`}
          />
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl font-bold flex items-center gap-1 hover:bg-primary-light">
            <FolderPlus className="w-4 h-4" /> Tạo
          </button>
        </form>

        <div className="space-y-2">
          {folders.map(folder => (
            <div key={folder.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'border-white/5 bg-bg-elevated' : 'border-slate-100 bg-slate-50'}`}>
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-text-dark'}`}>{folder.name}</span>
              <button onClick={() => handleDeleteFolder(folder.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {folders.length === 0 && <p className="text-sm text-slate-500 italic">Chưa có thư mục nào.</p>}
        </div>
      </div>

      {/* ── Import Column ── */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-lg font-bold font-display mb-4 ${isDark ? 'text-white' : 'text-text-dark'}`}>
          Nhập từ vựng hàng loạt (Import)
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>Chọn thư mục đích</label>
            <select 
              value={importFolderId} 
              onChange={e => setImportFolderId(e.target.value)}
              className={`w-full px-4 py-2 text-sm rounded-xl ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-text-dark'}`}
            >
              <option value="">-- Chọn thư mục --</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>Danh sách từ vựng (Dán từ Excel/Word)</label>
            <div className={`text-[10px] mb-2 p-2 rounded-lg ${isDark ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-primary'}`}>
              Định dạng mỗi dòng: <br/>
              <span className="font-mono font-bold">Từ vựng | Loại từ | Định nghĩa | Ví dụ (có thể để trống)</span><br/>
              VD: <span className="font-mono">Ephemeral | Adjective | Ngắn ngủi | Beauty is ephemeral.</span>
            </div>
            <textarea 
              rows={8}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Dán dữ liệu vào đây..."
              className={`w-full px-4 py-2.5 text-sm rounded-xl resize-none font-mono ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-text-dark'}`}
            />
          </div>

          <button 
            onClick={handleImport}
            disabled={isImporting}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isImporting ? 'bg-primary/50 text-white/50 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20'}`}
          >
            {isImporting ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang import...</> : <><Plus className="w-5 h-5" /> Bắt đầu Import</>}
          </button>

          <AnimatePresence>
            {importResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-start gap-3 mt-4">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Import hoàn tất!</p>
                  <p className="text-xs mt-1">Thành công: {importResult.success} từ vựng</p>
                  {importResult.error > 0 && <p className="text-xs mt-1 text-red-500">Thất bại: {importResult.error} dòng</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
