import { Trophy, Search, Users, Sparkles, Crown, Medal } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { StudentRank, Theme } from '../types';

interface LeaderboardScreenProps {
  theme: Theme;
  rankings: StudentRank[];
}

export default function LeaderboardScreen({ theme, rankings }: LeaderboardScreenProps) {
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');

  const top1 = rankings.find(r => r.rank === 1);
  const top2 = rankings.find(r => r.rank === 2);
  const top3 = rankings.find(r => r.rank === 3);

  const filteredRankings = rankings.filter(
    r => r.name.toLowerCase().includes(search.toLowerCase())
  );

  const podiumConfig = [
    { data: top2, rank: 2, label: '2nd', height: 'h-24', avatarSize: 'w-16 h-16 md:w-20 md:h-20', ringColor: 'border-slate-400', bgColor: isDark ? 'bg-white/5' : 'bg-slate-100', pillColor: 'bg-slate-400 text-white' },
    { data: top1, rank: 1, label: '1st', height: 'h-32', avatarSize: 'w-20 h-20 md:w-24 md:h-24', ringColor: 'border-accent-gold', bgColor: isDark ? 'bg-accent-gold/5' : 'bg-amber-50', pillColor: 'bg-accent-gold text-black' },
    { data: top3, rank: 3, label: '3rd', height: 'h-20', avatarSize: 'w-14 h-14 md:w-18 md:h-18', ringColor: 'border-amber-700', bgColor: isDark ? 'bg-white/3' : 'bg-amber-50/50', pillColor: 'bg-amber-700 text-white' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Header ── */}
      <div>
        <h2 className={`text-3xl sm:text-4xl font-black font-display tracking-tight ${isDark ? 'text-white' : 'text-text-dark'}`}>
          <span className="gradient-text-gold">Bảng Xếp Hạng</span>
        </h2>
        <p className={`text-sm mt-2 ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
          Tôn vinh những học viên xuất sắc nhất trên hệ thống.
        </p>
      </div>

      {/* ── Top 3 Podium ── */}
      <div className="grid grid-cols-3 max-w-2xl mx-auto items-end gap-3 md:gap-6 pt-8 pb-4">
        {podiumConfig.map((item, idx) => {
          if (!item.data) return <div key={idx} />;
          const student = item.data;
          return (
            <motion.div
              key={item.rank}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.15, type: 'spring', stiffness: 100 }}
            >
              {/* Avatar */}
              <div className="relative">
                {item.rank === 1 && (
                  <Crown className="w-6 h-6 text-accent-gold absolute -top-5 left-1/2 -translate-x-1/2 animate-float" />
                )}
                <div className={`rounded-full p-1 border-2 ${item.ringColor}`}>
                  <img
                    src={student.avatarUrl}
                    alt={student.name}
                    referrerPolicy="no-referrer"
                    className={`${item.avatarSize} rounded-full object-cover`}
                  />
                </div>
                <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${item.pillColor}`}>
                  {item.label}
                </span>
              </div>

              {/* Info */}
              <div className="text-center mt-5">
                <h4 className={`text-xs md:text-sm font-bold truncate max-w-[110px] ${isDark ? 'text-white' : 'text-text-dark'}`}>
                  {student.name}
                </h4>
                <p className={`text-xs font-bold font-mono mt-0.5 ${item.rank === 1 ? 'text-accent-gold' : isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
                  {student.totalScore} pts
                </p>
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                  {student.testsCompleted} tests
                </p>
              </div>

              {/* Podium block */}
              <div className={`w-full mt-4 ${item.height} rounded-t-xl text-center flex flex-col justify-end pb-3 text-xs font-bold border border-b-0 ${
                isDark
                  ? `${item.bgColor} border-white/5`
                  : `${item.bgColor} border-slate-200`
              }`}>
                <span className={`text-xs font-mono ${isDark ? 'text-text-muted' : 'text-text-dark-secondary'}`}>
                  #{item.rank}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Rankings Table ── */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        {/* Table Header */}
        <div className={`p-4 flex items-center justify-between flex-wrap gap-4 border-b ${
          isDark ? 'border-white/5' : 'border-slate-100'
        }`}>
          <div className="relative w-full sm:max-w-xs">
            <Search className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? 'text-text-muted' : 'text-slate-400'}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm học viên..."
              className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl transition-all ${
                isDark
                  ? 'bg-white/5 border border-white/10 text-white placeholder-text-muted focus:border-primary/50'
                  : 'bg-slate-50 border border-slate-200 text-text-dark placeholder-slate-400 focus:border-primary/50'
              }`}
            />
          </div>

          <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-text-muted' : 'text-text-dark-secondary'}`}>
            <Users className="w-4 h-4 text-primary" />
            <span>{filteredRankings.length} học viên</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={`text-xs uppercase tracking-wider border-b ${
                isDark ? 'text-text-muted bg-white/2 border-white/5' : 'text-slate-400 bg-slate-50 border-slate-100'
              }`}>
                <th className="px-4 py-3 text-center w-16">Hạng</th>
                <th className="px-4 py-3">Học Viên</th>
                <th className="px-4 py-3 text-right">Tổng Điểm</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">Trung Bình</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">Tests</th>
              </tr>
            </thead>
            <tbody>
              {filteredRankings.map((student, idx) => {
                const isUser = student.isCurrentUser;

                return (
                  <motion.tr
                    key={student.rank}
                    className={`transition-colors border-b last:border-b-0 ${
                      isUser
                        ? isDark ? 'bg-primary/5 border-primary/10' : 'bg-primary/5 border-primary/5'
                        : isDark ? 'border-white/3 hover:bg-white/3' : 'border-slate-50 hover:bg-slate-50'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <td className="px-4 py-3.5 text-center font-bold font-mono">
                      {student.rank === 1 ? (
                        <span className="text-accent-gold">🥇</span>
                      ) : student.rank === 2 ? (
                        <span>🥈</span>
                      ) : student.rank === 3 ? (
                        <span>🥉</span>
                      ) : (
                        <span className={isDark ? 'text-text-muted' : 'text-text-dark-secondary'}>#{student.rank}</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatarUrl}
                          alt={student.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <span className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-text-dark'}`}>
                            {student.name}
                            {isUser && (
                              <span className="inline-flex items-center gap-1 bg-primary text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                <Sparkles className="w-2.5 h-2.5" /> You
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold font-mono text-primary">
                      {student.totalScore}
                    </td>

                    <td className={`px-4 py-3.5 text-right font-mono hidden md:table-cell ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
                      {student.avgScore.toFixed(1)}
                    </td>

                    <td className={`px-4 py-3.5 text-right font-mono hidden sm:table-cell ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                      {student.testsCompleted}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
