import React, { useState, useMemo } from 'react';
import { Theme, ExamFolder, Module } from '../types';
import { ChevronDown, ChevronRight, Folder, FolderOpen, Play, Search, GraduationCap } from 'lucide-react';

interface PracticeScreenProps {
  theme: Theme;
  folders: ExamFolder[];
  modules: Module[];
  onStartTest: (moduleId: string) => void;
}

export default function PracticeScreen({ theme, folders, modules, onStartTest }: PracticeScreenProps) {
  const isDark = theme === 'dark';
  const [activeCategory, setActiveCategory] = useState<'course' | 'general'>('general');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Lọc folder theo category
  const categoryFolders = useMemo(() => {
    return folders.filter(f => f.category === activeCategory || (!f.category && activeCategory === 'general'));
  }, [folders, activeCategory]);

  // Xây dựng cây thư mục (nested)
  const folderTree = useMemo(() => {
    const map = new Map<string, any>();
    const roots: any[] = [];

    categoryFolders.forEach(f => {
      map.set(f.id, { ...f, children: [] });
    });

    categoryFolders.forEach(f => {
      if (f.parent_id && map.has(f.parent_id)) {
        map.get(f.parent_id).children.push(map.get(f.id));
      } else {
        roots.push(map.get(f.id));
      }
    });

    return roots;
  }, [categoryFolders]);

  // Lọc bài test theo folder được chọn
  const displayModules = useMemo(() => {
    if (!selectedFolderId) {
      // Nếu chưa chọn folder, hiển thị tất cả các bài test không nằm trong folder (hoặc tất cả bài test của category nếu muốn)
      // Ở đây ta hiển thị các bài test thuộc các folder gốc của category hiện tại
      const allCategoryFolderIds = categoryFolders.map(f => f.id);
      return modules.filter(m => m.folder_id && allCategoryFolderIds.includes(m.folder_id));
    }
    
    // Nếu có chọn folder, tìm tất cả id của folder con (recursive)
    const getFolderIdsRecursive = (folderId: string): string[] => {
      const children = folders.filter(f => f.parent_id === folderId).map(f => f.id);
      let ids = [folderId, ...children];
      for (const child of children) {
        ids = [...ids, ...getFolderIdsRecursive(child)];
      }
      return Array.from(new Set(ids));
    };

    const targetFolderIds = getFolderIdsRecursive(selectedFolderId);
    const filtered = modules.filter(m => m.folder_id && targetFolderIds.includes(m.folder_id));
    console.log('DEBUG_PRACTICE:', {
      totalModules: modules.length,
      selectedFolderId,
      targetFolderIds,
      filteredCount: filtered.length,
      modulesSample: modules.slice(0, 3)
    });
    return filtered;
  }, [modules, selectedFolderId, folders, categoryFolders]);

  const renderFolderNode = (node: any, level: number = 0) => {
    const isExpanded = expandedFolders[node.id];
    const isSelected = selectedFolderId === node.id;
    
    return (
      <div key={node.id} className="w-full">
        <button
          onClick={() => {
            setSelectedFolderId(node.id);
            if (node.children.length > 0 && !isExpanded) {
              toggleFolder(node.id);
            }
          }}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold transition-all rounded-lg border-2 ${
            isSelected
              ? isDark 
                ? 'bg-primary/20 border-primary text-primary' 
                : 'bg-primary/10 border-primary text-primary'
              : isDark
                ? 'bg-transparent border-white/5 text-text-secondary hover:bg-white/5 hover:border-white/10'
                : 'bg-transparent border-slate-200/50 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
          }`}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
        >
          <div className="flex items-center gap-2 truncate">
            {node.children.length > 0 ? (
              <span onClick={(e) => { e.stopPropagation(); toggleFolder(node.id); }} className="cursor-pointer p-0.5">
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </span>
            ) : (
              <span className="w-4"></span> // Spacer for alignment
            )}
            <span className="truncate">{node.name}</span>
          </div>
        </button>
        
        {isExpanded && node.children.length > 0 && (
          <div className="mt-1 space-y-1">
            {node.children.map((child: any) => renderFolderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-bg-dark text-white' : 'bg-bg-light text-text-dark'}`}>
      
      {/* Top Banner & Toggle */}
      <div className={`p-6 border-b ${isDark ? 'border-white/5 bg-bg-card' : 'border-slate-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black font-display flex items-center gap-3">
                <GraduationCap className={`w-8 h-8 ${isDark ? 'text-primary' : 'text-primary'}`} />
                Practice
              </h1>
              <p className={`mt-2 text-sm ${isDark ? 'text-text-secondary' : 'text-slate-500'}`}>
                Luyện tập với các đề thi theo khóa học hoặc tự do.
              </p>
            </div>

            {/* Custom Toggle mimicking the top adaptive options */}
            <div className={`flex p-1 rounded-2xl border-2 ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
              <button
                onClick={() => { setActiveCategory('general'); setSelectedFolderId(null); }}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeCategory === 'general'
                    ? isDark ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-primary text-white shadow-md'
                    : isDark ? 'text-text-muted hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                General
              </button>
              <button
                onClick={() => { setActiveCategory('course'); setSelectedFolderId(null); }}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeCategory === 'course'
                    ? isDark ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-primary text-white shadow-md'
                    : isDark ? 'text-text-muted hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Mơ digital SAT Course
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar & Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar (Folders) */}
        <div className={`w-full md:w-64 lg:w-72 shrink-0 p-4 rounded-3xl border-2 ${isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-text-secondary' : 'text-slate-500'}`}>
              Danh mục
            </h3>
          </div>
          
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            {activeCategory !== 'general' && (
              <button
                onClick={() => setSelectedFolderId(null)}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-bold transition-all rounded-lg border-2 ${
                  selectedFolderId === null
                    ? isDark 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-primary border-primary text-white shadow-md'
                    : isDark
                      ? 'bg-transparent border-white/5 text-text-secondary hover:bg-white/5 hover:border-white/10'
                      : 'bg-transparent border-slate-200/50 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                All Tests
              </button>
            )}
            
            {folderTree.map(node => renderFolderNode(node, 0))}
            
            {folderTree.length === 0 && (
              <p className={`text-xs text-center py-4 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                Chưa có thư mục nào
              </p>
            )}
          </div>
        </div>

        {/* Right Content (Tests Grid) */}
        <div className="flex-1">
          {displayModules.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-64 rounded-3xl border-2 border-dashed ${isDark ? 'border-white/10 bg-bg-card/50' : 'border-slate-200 bg-slate-50/50'}`}>
              <FolderOpen className={`w-12 h-12 mb-3 opacity-20 ${isDark ? 'text-white' : 'text-slate-400'}`} />
              <p className={`text-sm font-medium ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
                Không tìm thấy đề thi nào trong thư mục này
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayModules.map(module => (
                <div 
                  key={module.id} 
                  className={`flex flex-col p-5 rounded-3xl border-2 transition-all hover:-translate-y-1 ${
                    isDark ? 'bg-bg-card border-white/5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10' : 'bg-white border-slate-200 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5'
                  }`}
                >
                  <div className="flex-1">
                    <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isDark ? 'text-primary/80' : 'text-primary/80'}`}>
                      Practice Test
                    </p>
                    <h4 className="text-lg font-black font-display leading-tight mb-4">
                      {module.title}
                    </h4>
                    
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`px-3 py-2 rounded-xl border-2 ${isDark ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50'}`}>
                        <p className={`text-[9px] uppercase font-bold text-center ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>Minutes</p>
                        <p className="text-lg font-black text-center">{module.durationMinutes || 134}</p>
                      </div>
                      <div className={`px-3 py-2 rounded-xl border-2 ${isDark ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50'}`}>
                        <p className={`text-[9px] uppercase font-bold text-center ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>Questions</p>
                        <p className="text-lg font-black text-center">{module.questionsCount || 98}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onStartTest(module.id)}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all border-2 ${
                      isDark
                        ? 'bg-primary border-primary text-white hover:bg-primary-hover hover:border-primary-hover'
                        : 'bg-primary border-primary text-white hover:bg-primary-hover hover:border-primary-hover shadow-md'
                    }`}
                  >
                    START <Play className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
