import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { VocabularyWord, Theme } from '../types';
import { generateAIStory } from '../utils/aiStoryAPI';

interface AIStoryModalProps {
  theme: Theme;
  words: VocabularyWord[];
  isOpen: boolean;
  onClose: () => void;
}

const GENRES = [
  'Tình yêu',
  'Hài hước',
  'Học đường',
  'Hành động',
  'Viễn tưởng',
  'Kinh dị'
];

export default function AIStoryModal({ theme, words, isOpen, onClose }: AIStoryModalProps) {
  const isDark = theme === 'dark';
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [genre, setGenre] = useState(GENRES[0]);
  const [story, setStory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleWord = (id: string) => {
    setSelectedWords(prev => 
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedWords.length === 0) {
      setError('Vui lòng chọn ít nhất 1 từ vựng.');
      return;
    }
    setError('');
    setIsLoading(true);
    setStory('');

    const wordsToInclude = words.filter(w => selectedWords.includes(w.id));

    try {
      const generatedStory = await generateAIStory({ words: wordsToInclude, genre });
      setStory(generatedStory);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo câu chuyện.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to render story and bold vocabulary words
  const renderStory = () => {
    if (!story) return null;

    let formattedStory = story;
    const wordsToBold = words.filter(w => selectedWords.includes(w.id)).map(w => w.term);

    // Case-insensitive replacement with support for common English suffixes
    wordsToBold.forEach(term => {
      // Remove any trailing spaces or punctuation from term
      const cleanTerm = term.trim().replace(/[.,!?;:]$/, '');
      // Match the term + optional suffixes (s, ed, ing, ly, etc.) and ensure it's not already bolded
      const regex = new RegExp(`(?<!\\*\\*)\\b(${cleanTerm}[a-z]{0,4})\\b(?!\\*\\*)`, 'gi');
      formattedStory = formattedStory.replace(regex, '**$1**');
    });

    // Handle markdown bolding
    const parts = formattedStory.split(/(\*\*.*?\*\*)/g);

    return (
      <div className={`mt-6 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'}`}>
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <span key={index} className={`font-bold px-1.5 py-0.5 mx-0.5 rounded-md ${isDark ? 'bg-primary/20 text-primary-light' : 'bg-primary/15 text-primary'}`}>
                {part.slice(2, -2)}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-8 ${
            isDark ? 'bg-bg-card border border-primary/15' : 'bg-white border border-slate-200 shadow-2xl'
          }`}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-bold font-display flex items-center gap-2 ${isDark ? 'text-white' : 'text-text-dark'}`}>
              <Sparkles className="w-5 h-5 text-primary" />
              Tạo câu chuyện với AI
            </h3>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark ? 'text-text-muted hover:text-white' : 'text-slate-400 hover:text-text-dark'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Step 1: Select Words */}
            <div className="space-y-3">
              <label className={`block text-sm font-semibold ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
                1. Chọn từ vựng (chọn từ 3-5 từ để AI viết tốt nhất)
              </label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-xl border-dashed border-slate-300 dark:border-white/10">
                {words.slice(0, 50).map(word => {
                  const isSelected = selectedWords.includes(word.id);
                  return (
                    <button
                      key={word.id}
                      onClick={() => toggleWord(word.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-white border border-primary'
                          : isDark ? 'bg-white/5 border border-white/10 text-text-secondary hover:border-primary/50' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-primary/50'
                      }`}
                    >
                      {word.term}
                    </button>
                  );
                })}
                {words.length === 0 && <span className="text-xs text-slate-400">Bạn chưa có từ vựng nào.</span>}
              </div>
            </div>

            {/* Step 2: Select Genre */}
            <div className="space-y-3">
              <label className={`block text-sm font-semibold ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
                2. Chọn thể loại
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      genre === g
                        ? 'bg-accent text-white shadow-md shadow-accent/20'
                        : isDark ? 'bg-white/5 text-text-secondary hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || selectedWords.length === 0}
              className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                isLoading || selectedWords.length === 0
                  ? 'bg-primary/50 text-white/50 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/20 cursor-pointer'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang sáng tác...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Bắt đầu tạo câu chuyện
                </>
              )}
            </button>

            {/* Story Output */}
            {renderStory()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
