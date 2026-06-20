import React, { useState } from 'react';
import { Plus, Search, BookOpen, Clock, Tag, X, Sparkles, Check, Trash2, Milestone } from 'lucide-react';
import { VocabularyWord, Theme } from '../types';

interface VocabularyScreenProps {
  theme: Theme;
  words: VocabularyWord[];
  onAddWord: (word: Omit<VocabularyWord, 'id' | 'date'>) => void;
  onDeleteWord: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export default function VocabularyScreen({
  theme,
  words,
  onAddWord,
  onDeleteWord,
  onToggleStatus,
}: VocabularyScreenProps) {
  const isDark = theme === 'dark';

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Learning' | 'Mastered'>('All');

  // Flippable card status state (Format: id -> boolean)
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Form controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newType, setNewType] = useState('Adjective');
  const [newDefinition, setNewDefinition] = useState('');
  const [newExample, setNewExample] = useState('');

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm || !newDefinition) return;

    onAddWord({
      term: newTerm,
      type: newType,
      definition: newDefinition,
      example: newExample,
      status: 'Learning',
    });

    // Reset fields
    setNewTerm('');
    setNewType('Adjective');
    setNewDefinition('');
    setNewExample('');
    setIsModalOpen(false);
  };

  const filteredWords = words.filter((w) => {
    const matchesSearch = w.term.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.definition.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = statusFilter === 'All' || w.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Visual Hub Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className={`text-3xl sm:text-5xl font-black font-display uppercase tracking-tighter leading-none ${isDark ? 'text-white' : 'text-black'}`}>
            SỔ TAY TỪ VỰNG SAT Digital
          </h2>
          <p className="text-xs sm:text-sm font-mono opacity-50 mt-2">
            Chủ động ghi chép và ghi nhớ từ mới thông qua bộ thẻ lật 2 mặt (Flashcards) ưu việt.
          </p>
        </div>

        {/* Floating Add Word Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className={`px-5 py-3 rounded-none text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all self-start md:self-auto cursor-pointer border ${
            isDark
              ? 'bg-[#4dd9cc] text-black border-[#4dd9cc] hover:bg-black hover:text-white hover:border-white/20'
              : 'bg-black text-white border-transparent hover:bg-white hover:text-black hover:border-black'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Từ Vựng Mới</span>
        </button>
      </div>

      {/* Filter and Search Bar controls */}
      <div className={`p-4 rounded-none border transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${
        isDark ? 'bg-black border-white/10' : 'bg-white border-black/15'
      }`}>
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm từ vựng hoặc định nghĩa học thuật..."
            className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-none font-mono focus:outline-none transition-colors border ${
              isDark 
                ? 'bg-white/5 border-white/10 text-white focus:border-[#4dd9cc]' 
                : 'bg-gray-50 border-black/15 text-gray-900 focus:border-black'
            }`}
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 p-1 w-full md:w-auto">
          {(['All', 'Learning', 'Mastered'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-none text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border ${
                statusFilter === filter
                  ? (isDark ? 'bg-[#4dd9cc] text-black border-[#4dd9cc]' : 'bg-black text-white border-black')
                  : (isDark ? 'border-transparent text-white/50 hover:text-white hover:border-white/10' : 'border-transparent text-black/50 hover:text-black hover:border-black/5')
              }`}
            >
              {filter === 'All' ? 'Tất cả' : (filter === 'Learning' ? 'Đang học' : 'Đã thuộc')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid listing index flashcards */}
      {filteredWords.length === 0 ? (
        <div className={`text-center py-16 rounded-none border-2 border-dashed p-6 ${
          isDark ? 'border-white/10 text-gray-500' : 'border-black/15 text-gray-500'
        }`}>
          <BookOpen className="w-10 h-10 mx-auto opacity-30 mb-4 text-[#4dd9cc]" />
          <p className="text-xs uppercase tracking-widest font-black font-mono">Không tìm thấy từ tương ứng</p>
          <p className="text-xs text-gray-400 mt-2 font-mono opacity-60">Hãy nhấn "Thêm Từ Vựng Mới" để đa dạng hóa sổ học thuật.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredWords.map((word) => {
            const isFlipped = !!flippedCards[word.id];
            const isMastered = word.status === 'Mastered';

            return (
              <div 
                key={word.id}
                className="perspective-1000 h-48 group cursor-pointer"
                onClick={() => toggleFlip(word.id)}
              >
                {/* Flipping Container Card */}
                <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}>
                  
                  {/* FRONT SIDE */}
                  <div className={`absolute inset-0 w-full h-full backface-hidden p-5 rounded-none border-2 transition-all flex flex-col justify-between ${
                    isDark 
                      ? 'bg-black border-white/10 group-hover:border-[#4dd9cc]/50' 
                      : 'bg-white border-black/15 group-hover:border-black'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${
                          isDark ? 'bg-white/5 border-white/20 text-white/70' : 'bg-gray-100 border-black/10 text-black/80'
                        }`}>
                          {word.type}
                        </span>
                        <h3 className={`text-[22px] font-black font-display tracking-tight uppercase ${isDark ? 'text-white' : 'text-black'}`}>
                          {word.term}
                        </h3>
                      </div>

                      {/* Controls (Toggle Status and Trash) */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onToggleStatus(word.id)}
                          className={`p-1.5 border transition-all rounded-none cursor-pointer ${
                            isMastered
                              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                              : 'border-white/10 text-gray-500 hover:text-emerald-400 hover:border-emerald-500/40'
                          }`}
                          title={isMastered ? "Đánh dấu là chưa thuộc" : "Đánh dấu là đã thuộc"}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => onDeleteWord(word.id)}
                          className="p-1.5 border border-transparent text-gray-500 hover:text-red-500 hover:border-red-500/35 transition-colors rounded-none cursor-pointer"
                          title="Xóa từ vựng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-gray-500 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ĐÃ THÊM: {word.date}
                      </span>
                      <span className="font-bold text-[#4dd9cc] uppercase tracking-wider">Chạm để xem nghĩa ↗</span>
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 p-5 rounded-none border-2 transition-all flex flex-col justify-between ${
                    isDark 
                      ? 'bg-[#0f0f0f] border-[#4dd9cc]/50' 
                      : 'bg-gray-50 border-black'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Định Nghĩa học thuật:</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border ${
                          isMastered ? 'bg-[#4dd9cc]/10 text-[#4dd9cc] border-[#4dd9cc]/30' : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}>
                          {isMastered ? 'MASTERED' : 'LEARNING'}
                        </span>
                      </div>
                      
                      <p className={`text-sm font-semibold leading-relaxed ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {word.definition}
                      </p>

                      <div className="pt-2 border-t border-white/5">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40 block mb-0.5">Ví dụ SAT:</span>
                        <p className="text-xs italic text-gray-500 leading-relaxed font-mono">
                          "{word.example}"
                        </p>
                      </div>
                    </div>

                    <div className="text-[9px] font-mono text-right text-gray-500 uppercase">
                      Chạm để lật lại ↺
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new Vocabulary Modal Popup overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-none border-2 transform transition-all p-6 md:p-8 ${
            isDark 
              ? 'bg-[#0a0e1a] border-[#4dd9cc] text-white' 
              : 'bg-white border-black text-black'
          }`}>
            
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 font-display">
                <Sparkles className="w-5 h-5 text-[#4dd9cc]" />
                <span>Thêm Từ Vựng SAT Mới</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-none text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              
              {/* Term */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Từ Vựng (Academic Term)</label>
                <input
                  type="text"
                  required
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="Ví dụ: Ephemeral"
                  className={`w-full p-2.5 text-xs rounded-none font-mono focus:outline-none border ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white focus:border-[#4dd9cc]' 
                      : 'bg-gray-50 border-black/15 text-gray-900 focus:border-black'
                  }`}
                />
              </div>

              {/* Type Grid */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Loại Từ (Part of speech)</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-none font-mono focus:outline-none border ${
                    isDark 
                      ? 'bg-black border-white/10 text-white focus:border-[#4dd9cc]' 
                      : 'bg-white border-black text-black focus:border-[#0a0e1a]'
                  }`}
                >
                  <option value="Adjective">Tính từ (Adjective)</option>
                  <option value="Noun">Danh từ (Noun)</option>
                  <option value="Verb">Động từ (Verb)</option>
                  <option value="Adverb">Trạng từ (Adverb)</option>
                </select>
              </div>

              {/* Definition */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Định nghĩa & Nghĩa</label>
                <textarea
                  required
                  rows={2}
                  value={newDefinition}
                  onChange={(e) => setNewDefinition(e.target.value)}
                  placeholder="Ví dụ: Kéo dài trong thời gian cực kỳ ngắn, thoáng qua."
                  className={`w-full p-2.5 text-xs rounded-none font-mono focus:outline-none border ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white focus:border-[#4dd9cc]' 
                      : 'bg-gray-50 border-black/15 text-[#0a0a0a] focus:border-black'
                  }`}
                />
              </div>

              {/* Example sentence */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Câu ví dụ thực tế học thuật</label>
                <textarea
                  rows={2}
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="Ví dụ: Beauty is ephemeral, but knowledge is eternal."
                  className={`w-full p-2.5 text-xs rounded-none font-mono focus:outline-none border ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white focus:border-[#4dd9cc]' 
                      : 'bg-gray-50 border-black/15 text-[#0a0a0a] focus:border-black'
                  }`}
                />
              </div>

              {/* Submit triggers */}
              <div className="pt-4 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded-none text-gray-400 hover:text-white cursor-pointer hover:bg-white/5"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 font-black uppercase tracking-widest text-[10px] rounded-none cursor-pointer transition-all border ${
                    isDark 
                      ? 'bg-[#4dd9cc] text-black border-[#4dd9cc] hover:bg-black hover:text-white hover:border-white/10' 
                      : 'bg-black text-white border-transparent hover:bg-white hover:text-black hover:border-black'
                  }`}
                >
                  Lưu từ vựng
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
