import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Theme } from '../../types';
import { loadExam, deleteExam } from '../../utils/saveExam';
import {
  Database,
  RefreshCw,
  Edit3,
  Trash2,
  Calendar,
  Layers,
  HelpCircle,
  Search,
  Folder,
  FolderPlus,
  FolderOpen,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExamManagerPanelProps {
  theme: Theme;
  onEditExam: (examId: string) => void;
}

interface ExamFolder {
  id: string;
  name: string;
  created_at: string;
}

interface ExamRow {
  id: string;
  title: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  section_count?: number;
  question_count?: number;
  folder_id?: string | null;
  is_locked?: boolean;
  deadline?: string | null;
}

export default function ExamManagerPanel({
  theme,
  onEditExam,
}: ExamManagerPanelProps) {
  const isDark = theme === 'dark';
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [folders, setFolders] = useState<ExamFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Folder creation
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Drag and Drop
  const [draggedExamId, setDraggedExamId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Collapse State
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Fetch folders (gracefully handle if table doesn't exist yet)
      const { data: folderData, error: folderErr } = await supabase
        .from('exam_folders')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (!folderErr && folderData) {
        setFolders(folderData);
      }

      // 2. Fetch exams
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // 3. Fetch counts for each exam
      const examsWithCounts = await Promise.all(
        (data || []).map(async (exam: any) => {
          const { count: sectionCount } = await supabase
            .from('exam_sections')
            .select('id', { count: 'exact', head: true })
            .eq('exam_id', exam.id);

          const { data: sections } = await supabase
            .from('exam_sections')
            .select('id')
            .eq('exam_id', exam.id);

          let questionCount = 0;
          if (sections && sections.length > 0) {
            const sectionIds = sections.map((s: any) => s.id);
            const { count } = await supabase
              .from('exam_questions')
              .select('id', { count: 'exact', head: true })
              .in('section_id', sectionIds);
            questionCount = count ?? 0;
          }

          return {
            ...exam,
            section_count: sectionCount ?? 0,
            question_count: questionCount,
          };
        })
      );

      setExams(examsWithCounts);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleDelete(examId: string) {
    setDeletingId(examId);
    const success = await deleteExam(examId);
    if (success) {
      setExams((prev) => prev.filter((e) => e.id !== examId));
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  async function handleToggleLock(examId: string, currentStatus: boolean) {
    try {
      const newStatus = !currentStatus;
      await supabase.from('exams').update({ is_locked: newStatus }).eq('id', examId);
      await supabase.from('modules').update({ is_locked: newStatus }).eq('id', examId);
      setExams(prev => prev.map(e => e.id === examId ? { ...e, is_locked: newStatus } : e));
    } catch (err) {
      console.error(err);
      alert('Lỗi khi cập nhật trạng thái khóa');
    }
  }

  async function handleUpdateDeadline(examId: string, newDeadline: string) {
    try {
      const val = newDeadline ? new Date(newDeadline).toISOString() : null;
      await supabase.from('exams').update({ deadline: val }).eq('id', examId);
      await supabase.from('modules').update({ deadline: val }).eq('id', examId);
      setExams(prev => prev.map(e => e.id === examId ? { ...e, deadline: val } : e));
    } catch (err) {
      console.error(err);
      alert('Lỗi khi cập nhật deadline');
    }
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('exam_folders')
        .insert({ name: newFolderName.trim() })
        .select()
        .single();
      
      if (error) {
        alert(`Failed to create folder: ${error.message || 'Unknown error'}`);
        throw error;
      }
      if (data) {
        setFolders((prev) => [...prev, data]);
        setNewFolderName('');
        setIsCreatingFolder(false);
      }
    } catch (err: any) {
      console.error('Error creating folder:', err);
    }
  }

  async function handleDeleteFolder(folderId: string) {
    if (!confirm('Are you sure you want to delete this folder? Exams inside will not be deleted.')) return;
    try {
      const { error } = await supabase
        .from('exam_folders')
        .delete()
        .eq('id', folderId);
      
      if (error) throw error;
      setFolders((prev) => prev.filter(f => f.id !== folderId));
      setExams((prev) => prev.map(e => e.folder_id === folderId ? { ...e, folder_id: null } : e));
    } catch (err) {
      console.error('Error deleting folder:', err);
    }
  }

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, examId: string) => {
    setDraggedExamId(examId);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to allow the drag image to be generated before we might hide/change the item
    setTimeout(() => {
      // Optional: add a class to the dragged item
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedExamId(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);
    
    if (!draggedExamId) return;

    // Optimistic update
    setExams(prev => prev.map(ex => 
      ex.id === draggedExamId ? { ...ex, folder_id: folderId } : ex
    ));

    try {
      // Update DB
      const { error } = await supabase
        .from('exams')
        .update({ folder_id: folderId })
        .eq('id', draggedExamId);

      if (error) throw error;

      // Sync to modules
      await supabase
        .from('modules')
        .update({ folder_id: folderId })
        .eq('id', draggedExamId);
    } catch (err) {
      console.error('Error updating exam folder:', err);
      // Revert on error
      fetchData();
    }
    setDraggedExamId(null);
  };

  const filteredExams = exams.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group exams
  const unassignedExams = filteredExams.filter(e => !e.folder_id);
  const examsByFolder = folders.reduce((acc, folder) => {
    acc[folder.id] = filteredExams.filter(e => e.folder_id === folder.id);
    return acc;
  }, {} as Record<string, ExamRow[]>);

  const renderExamCard = (exam: ExamRow, index: number) => (
    <motion.div
      key={exam.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      draggable
      onDragStart={(e) => handleDragStart(e, exam.id)}
      onDragEnd={handleDragEnd}
      className={`rounded-2xl border p-4 transition-all cursor-grab active:cursor-grabbing ${
        isDark
          ? 'bg-bg-card border-white/10 hover:border-primary/20'
          : 'bg-white border-slate-200 shadow-sm hover:border-primary/20'
      } ${draggedExamId === exam.id ? 'opacity-50 scale-95' : ''}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <GripVertical className={`w-4 h-4 shrink-0 ${isDark ? 'text-white/20' : 'text-slate-300'}`} />
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-text-dark'}`}>
              {exam.title}
            </h4>
            <div className={`flex flex-wrap items-center gap-3 mt-1.5 text-[11px] ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {exam.section_count ?? 0} sections
              </span>
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                {exam.question_count ?? 0} questions
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(exam.updated_at).toLocaleDateString()}
              </span>
              {exam.created_by && (
                <span className="truncate max-w-[150px]">
                  by {exam.created_by}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            type="date"
            value={exam.deadline ? exam.deadline.split('T')[0] : ''}
            onChange={(e) => handleUpdateDeadline(exam.id, e.target.value)}
            className={`px-2 py-1.5 rounded-xl text-xs font-semibold border outline-none transition-all w-28 ${
              isDark ? 'bg-bg-card border-white/10 text-text-muted hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-text-dark'
            }`}
            title="Thiết lập Deadline"
          />

          <button
            onClick={() => handleToggleLock(exam.id, exam.is_locked || false)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? (exam.is_locked ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'border-white/10 text-text-muted hover:text-white')
                : (exam.is_locked ? 'bg-red-50 text-red-500 border-red-200' : 'border-slate-200 text-slate-400 hover:text-text-dark')
            }`}
            title={exam.is_locked ? 'Mở khóa đề' : 'Khóa đề'}
          >
            {exam.is_locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onEditExam(exam.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                : 'bg-primary/5 text-primary hover:bg-primary/10'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>

          {confirmDeleteId === exam.id ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDelete(exam.id)}
                disabled={deletingId === exam.id}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-accent-warm text-white cursor-pointer hover:bg-accent-warm/80 transition-all disabled:opacity-50"
              >
                {deletingId === exam.id ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  'Confirm'
                )}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isDark
                    ? 'bg-white/5 text-text-muted hover:text-white'
                    : 'bg-slate-100 text-slate-500 hover:text-text-dark'
                }`}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteId(exam.id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? 'border-white/10 text-text-muted hover:text-accent-warm hover:border-accent-warm/20'
                  : 'border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-text-dark'}`}>
            Saved Exams
          </h3>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-white/5 text-text-muted' : 'bg-slate-100 text-slate-500'}`}>
            {exams.length}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => setIsCreatingFolder(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-text-dark'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>

          {/* Search */}
          <div className={`flex-1 sm:flex-none relative`}>
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-text-muted' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exams..."
              className={`pl-9 pr-4 py-2.5 rounded-xl text-xs border w-full sm:w-52 transition-all ${
                isDark
                  ? 'bg-bg-card border-white/10 text-white placeholder:text-text-muted/50'
                  : 'bg-white border-slate-200 text-text-dark placeholder:text-slate-400'
              }`}
            />
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? 'border-white/10 hover:bg-white/5 text-text-secondary'
                : 'border-slate-200 hover:bg-slate-50 text-slate-500'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Create Folder Form */}
      <AnimatePresence>
        {isCreatingFolder && (
          <motion.form
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            onSubmit={handleCreateFolder}
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
              isDark ? 'bg-bg-card border-primary/30' : 'bg-primary/5 border-primary/20'
            }`}
          >
            <FolderPlus className={`w-5 h-5 ${isDark ? 'text-primary' : 'text-primary'}`} />
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder Name (e.g. Verbal)"
              className={`flex-1 px-4 py-2 rounded-xl text-sm border outline-none transition-all ${
                isDark
                  ? 'bg-black/20 border-white/10 text-white focus:border-primary/50'
                  : 'bg-white border-slate-200 text-text-dark focus:border-primary/50'
              }`}
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white cursor-pointer hover:bg-primary-hover disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
                  isDark ? 'text-text-muted hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-text-dark hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Exams List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filteredExams.length === 0 && folders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center py-16 rounded-2xl border ${
            isDark ? 'bg-bg-card border-white/10' : 'bg-white border-slate-200'
          }`}
        >
          <Database className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-white/10' : 'text-slate-200'}`} />
          <p className={`text-sm font-semibold ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
            {searchQuery ? 'No matching exams found' : 'No exams or folders yet'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          
          {/* Render Folders */}
          {folders.map(folder => {
            const folderExams = examsByFolder[folder.id] || [];
            const isDragOver = dragOverFolderId === folder.id;
            const isCollapsed = collapsedFolders[folder.id] ?? true;
            
            return (
              <div 
                key={folder.id}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isDark
                    ? `bg-bg-card border-white/10 ${isDragOver ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''}`
                    : `bg-white border-slate-200 shadow-sm ${isDragOver ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''}`
                }`}
              >
                {/* Folder Header */}
                <div 
                  className={`flex items-center justify-between p-4 border-b cursor-pointer transition-colors ${
                    isDark ? 'border-white/5 bg-white/5 hover:bg-white/10' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/50'
                  }`}
                  onClick={() => toggleFolder(folder.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                      {isCollapsed ? <Folder className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-text-dark'}`}>
                        {folder.name}
                        {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
                        {folderExams.length} {folderExams.length === 1 ? 'exam' : 'exams'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    className={`p-2 rounded-xl transition-all cursor-pointer opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100 ${
                      isDark
                        ? 'text-text-muted hover:text-red-400 hover:bg-red-400/10'
                        : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                    style={{ opacity: folderExams.length === 0 ? 1 : undefined }}
                    title="Delete Folder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Folder Contents */}
                {!isCollapsed && (
                  <div className={`p-3 space-y-2 min-h-[80px] ${folderExams.length === 0 ? 'flex items-center justify-center' : ''}`}>
                    {folderExams.length > 0 ? (
                      folderExams.map((exam, i) => renderExamCard(exam, i))
                    ) : (
                      <p className={`text-xs text-center py-6 border-2 border-dashed rounded-xl ${
                        isDark ? 'border-white/10 text-white/30' : 'border-slate-200 text-slate-400'
                      }`}>
                        {isDragOver ? 'Drop exam here' : 'Drag exams here'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Render Unassigned Exams */}
          {(unassignedExams.length > 0 || folders.length > 0) && (
            <div 
              className={`rounded-2xl border-2 border-dashed p-4 transition-all min-h-[120px] ${
                isDark 
                  ? `border-white/10 ${dragOverFolderId === null ? 'bg-white/5 border-primary/50' : ''}` 
                  : `border-slate-200 ${dragOverFolderId === null ? 'bg-slate-50 border-primary/50' : ''}`
              }`}
              onDragOver={(e) => handleDragOver(e, null)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, null)}
            >
              <div className="flex items-center gap-2 mb-4 px-2">
                <Database className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
                <h4 className={`text-sm font-semibold ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Root / Uncategorized Exams
                </h4>
              </div>
              
              <div className="space-y-2">
                {unassignedExams.length > 0 ? (
                  unassignedExams.map((exam, i) => renderExamCard(exam, i))
                ) : (
                  <div className={`text-center py-8 ${isDark ? 'text-white/20' : 'text-slate-400'} text-xs`}>
                    Drop exams here to remove from folders
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
