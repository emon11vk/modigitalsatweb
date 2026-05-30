import { Trophy, Award, Search, Users, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { StudentRank, Theme } from '../types';

interface LeaderboardScreenProps {
  theme: Theme;
  rankings: StudentRank[];
}

export default function LeaderboardScreen({ theme, rankings }: LeaderboardScreenProps) {
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');

  // Extract top 3 for the beautiful premium podium layout
  const top1 = rankings.find(r => r.rank === 1);
  const top2 = rankings.find(r => r.rank === 2);
  const top3 = rankings.find(r => r.rank === 3);

  // Filter others for search
  const filteredRankings = rankings.filter(
    r => r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div className="pb-4 border-b border-white/5">
        <h2 className={`text-3xl sm:text-5xl font-black font-display uppercase tracking-tighter leading-none ${isDark ? 'text-white' : 'text-black'}`}>
          BẢNG VÀNG HỌC VIÊN PRO_
        </h2>
        <p className="text-xs sm:text-sm font-mono opacity-50 mt-2">
          Tôn vinh nỗ lực bền bỉ và bứt phá điểm số xuất sắc của các bạn học viên trên toàn hệ thống.
        </p>
      </div>

      {/* Top 3 Podium Visualizer - Brutalist style */}
      <div className="grid grid-cols-3 max-w-2xl mx-auto items-end gap-2 md:gap-6 pt-12 pb-6">
        
        {/* Ranked #2 Podium Column */}
        {top2 && (
          <div className="flex flex-col items-center">
            <div className="relative group">
              <img 
                src={top2.avatarUrl} 
                alt={top2.name} 
                referrerPolicy="no-referrer"
                className={`w-14 h-14 md:w-20 md:h-20 rounded-none object-cover border-2 ${
                  isDark ? 'border-white/30' : 'border-black'
                }`}
              />
              <span className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 bg-gray-500 text-white text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-none border border-white/20">
                2ND
              </span>
            </div>
            
            <div className="text-center mt-4">
              <h4 className={`text-xs md:text-sm font-black uppercase truncate max-w-[100px] ${isDark ? 'text-white' : 'text-black'}`}>
                {top2.name}
              </h4>
              <p className={`text-xs font-black font-mono mt-0.5 opacity-80`}>
                {top2.totalScore} Pts
              </p>
              <p className="text-[9px] font-mono opacity-50">
                {top2.testsCompleted} TESTS
              </p>
            </div>

            {/* Gray Pillar Podium block */}
            <div className={`w-full mt-4 h-24 rounded-none text-center flex flex-col justify-end pb-3 text-xs md:text-sm font-black border border-b-0 ${
              isDark 
                ? 'bg-black border-white/10 text-white/40' 
                : 'bg-gray-100 border-black/15 text-black'
            }`}>
              SLV
            </div>
          </div>
        )}

        {/* Ranked #1 Champion Podium Column */}
        {top1 && (
          <div className="flex flex-col items-center">
            <div className="relative group">
              {/* Champion Indicators */}
              <div className="flex justify-center -mb-1">
                <Trophy className="w-5 h-5 text-[#00D2FF] animate-bounce" />
              </div>

              <img 
                src={top1.avatarUrl} 
                alt={top1.name} 
                referrerPolicy="no-referrer"
                className="w-16 h-16 md:w-24 md:h-24 rounded-none object-cover border-2 border-[#00D2FF] shadow-none"
              />
              <span className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 bg-[#00D2FF] text-black text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-none leading-none">
                CHAMP
              </span>
            </div>
            
            <div className="text-center mt-4">
              <h4 className={`text-sm md:text-base font-black uppercase truncate max-w-[120px] ${isDark ? 'text-white' : 'text-black'}`}>
                {top1.name}
              </h4>
              <p className="text-xs md:text-sm font-black font-mono text-[#00D2FF] mt-0.5">
                {top1.totalScore} PTS
              </p>
              <p className="text-[9px] font-mono opacity-50">
                {top1.testsCompleted} TESTS
              </p>
            </div>

            {/* Championship Golden Pillar Podium block */}
            <div className={`w-full mt-4 h-32 rounded-none text-center flex flex-col justify-end pb-4 text-xs md:text-sm font-black border border-b-0 ${
              isDark 
                ? 'bg-[#00D2FF]/5 border-[#00D2FF] text-[#00D2FF]' 
                : 'bg-black border-black text-white'
            }`}>
              GOLD
            </div>
          </div>
        )}

        {/* Ranked #3 Podium Column */}
        {top3 && (
          <div className="flex flex-col items-center">
            <div className="relative group">
              <img 
                src={top3.avatarUrl} 
                alt={top3.name} 
                referrerPolicy="no-referrer"
                className={`w-14 h-14 md:w-20 md:h-20 rounded-none object-cover border-2 ${
                  isDark ? 'border-amber-700/40' : 'border-black'
                }`}
              />
              <span className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 bg-amber-700 text-white text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-none border border-white/15">
                3RD
              </span>
            </div>
            
            <div className="text-center mt-4">
              <h4 className={`text-xs md:text-sm font-black uppercase truncate max-w-[100px] ${isDark ? 'text-white' : 'text-black'}`}>
                {top3.name}
              </h4>
              <p className={`text-xs font-black font-mono mt-0.5 opacity-80`}>
                {top3.totalScore} Pts
              </p>
              <p className="text-[9px] font-mono opacity-50">
                {top3.testsCompleted} TESTS
              </p>
            </div>

            {/* Bronze Pillar Podium block */}
            <div className={`w-full mt-4 h-20 rounded-none text-center flex flex-col justify-end pb-3 text-xs md:text-sm font-black border border-b-0 ${
              isDark 
                ? 'bg-black border-white/10 text-white/40' 
                : 'bg-[#faf6f0] border-black/15 text-black'
            }`}>
              BRZ
            </div>
          </div>
        )}

      </div>

      {/* Ranks Table Section & Filtration Form */}
      <div className={`p-4 rounded-none border-2 transition-all space-y-4 ${
        isDark ? 'bg-black border-white/10' : 'bg-white border-black'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm học viên..."
              className={`w-full pl-9 pr-4 py-2 text-xs rounded-none font-mono focus:outline-none transition-colors border ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white focus:border-[#00D2FF]' 
                  : 'bg-gray-50 border-black/15 text-gray-900 focus:border-black'
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest opacity-60 font-mono">
            <Users className="w-4 h-4 text-[#00D2FF]" />
            <span>HIỂN THỊ {filteredRankings.length} HỌC VIÊN</span>
          </div>
        </div>

        {/* Scrollable table ranking log */}
        <div className="overflow-x-auto select-none rounded-none border border-white/5">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead>
              <tr className={`border-b text-gray-400 uppercase text-[9px] font-black tracking-widest ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-black/15'
              }`}>
                <th className="p-4 text-center w-20">Thứ Hạng</th>
                <th className="p-4">Học Viên</th>
                <th className="p-4 text-right">Tổng Điểm</th>
                <th className="p-4 text-right">Mức Trung Bình</th>
                <th className="p-4 text-right">Số Lần Luyện Đề (Tests)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRankings.map((student) => {
                const isUser = student.isCurrentUser;
                
                return (
                  <tr 
                    key={student.rank}
                    className={`transition-colors ${
                      isUser 
                        ? (isDark ? 'bg-[#00D2FF]/10 hover:bg-[#00D2FF]/15' : 'bg-[#00D2FF]/20 font-semibold')
                        : (isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50')
                    }`}
                  >
                    {/* Rank */}
                    <td className="p-4 text-center font-black font-mono">
                      {student.rank === 1 ? '🥇 CHAMP' : (student.rank === 2 ? '🥈' : (student.rank === 3 ? '🥉' : `#${student.rank}`))}
                    </td>
 
                    {/* Student Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={student.avatarUrl} 
                          alt={student.name} 
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-none object-cover border border-white/10 shadow-none"
                        />
                        <div className="space-y-0.5">
                          <span className={`font-black flex items-center gap-2 uppercase tracking-wide ${isDark ? 'text-white' : 'text-black'}`}>
                            {student.name}
                            {isUser && (
                              <span className="inline-flex items-center gap-1 bg-[#00D2FF] text-black text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-none border border-transparent">
                                <Sparkles className="w-2.5 h-2.5" /> BẠN (YOU)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Total Score */}
                    <td className="p-4 text-right font-black font-mono text-[#00D2FF]">
                      {student.totalScore}
                    </td>

                    {/* Avg Score */}
                    <td className={`p-4 text-right font-black font-mono ${isDark ? 'text-white/70' : 'text-black/85'}`}>
                      {student.avgScore.toFixed(1)} / 160
                    </td>

                    {/* Completed */}
                    <td className="p-4 text-right font-black font-mono opacity-50">
                      {student.testsCompleted}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
