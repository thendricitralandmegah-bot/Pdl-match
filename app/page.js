'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trophy, Users, LayoutGrid, RefreshCw } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PadelApp() {
  const [activeTab, setActiveTab] = useState('setup');
  const [matchName, setMatchName] = useState('PDL-MATCH Session');
  const [matchFormat, setMatchFormat] = useState('Americano (21 Poin)');
  const [courtCount, setCourtCount] = useState(4);
  const [reclubInput, setReclubInput] = useState('Thendri\nBudi\nAndi\nSiti\nRian\nEka\nDeni\nMaya\nFajar\nNita\nRudi\nLina\nHadi\nSari\nGita\nAgus');
  
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const generateMatches = () => {
    const rawList = reclubInput.split('\n').map(p => p.trim()).filter(Boolean);
    setPlayers(rawList);

    const generatedMatches = [];
    for (let i = 1; i <= courtCount; i++) {
      const p1 = rawList[(i - 1) * 4] || `Pemain A${i}`;
      const p2 = rawList[(i - 1) * 4 + 1] || `Pemain B${i}`;
      const p3 = rawList[(i - 1) * 4 + 2] || `Pemain C${i}`;
      const p4 = rawList[(i - 1) * 4 + 3] || `Pemain D${i}`;

      generatedMatches.push({
        id: i,
        courtNumber: i,
        teamA: [p1, p2],
        teamB: [p3, p4],
        scoreA: 0,
        scoreB: 0,
      });
    }

    setMatches(generatedMatches);
    updateLeaderboard(rawList, generatedMatches);
    setActiveTab('courts');
  };

  const handleScoreChange = (matchId, team, value) => {
    const updated = matches.map((m) => {
      if (m.id === matchId) {
        return {
          ...m,
          [team === 'A' ? 'scoreA' : 'scoreB']: parseInt(value) || 0,
        };
      }
      return m;
    });
    setMatches(updated);
    updateLeaderboard(players, updated);
  };

  const updateLeaderboard = (playerList, matchData) => {
    const stats = {};
    playerList.forEach((p) => {
      stats[p] = { name: p, played: 0, won: 0, pointsScored: 0, pointDiff: 0 };
    });

    matchData.forEach((m) => {
      const sA = m.scoreA;
      const sB = m.scoreB;

      if (sA > 0 || sB > 0) {
        m.teamA.forEach((p) => {
          if (stats[p]) {
            stats[p].played += 1;
            stats[p].pointsScored += sA;
            stats[p].pointDiff += sA - sB;
            if (sA > sB) stats[p].won += 1;
          }
        });

        m.teamB.forEach((p) => {
          if (stats[p]) {
            stats[p].played += 1;
            stats[p].pointsScored += sB;
            stats[p].pointDiff += sB - sA;
            if (sB > sA) stats[p].won += 1;
          }
        });
      }
    });

    const sorted = Object.values(stats).sort((a, b) => b.pointsScored - a.pointsScored || b.pointDiff - a.pointDiff);
    setLeaderboard(sorted);
  };

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 min-h-screen text-slate-100 bg-slate-950 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-black text-lime-400 tracking-wider">
            PDL<span className="text-white">-MATCH</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">{matchName} • {matchFormat}</p>
        </div>

        <nav className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-sm w-full md:w-auto">
          <button
            onClick={() => setActiveTab('setup')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'setup' ? 'bg-lime-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={16} /> Setup & Reclub
          </button>
          <button
            onClick={() => setActiveTab('courts')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'courts' ? 'bg-lime-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid size={16} /> Live Courts ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'leaderboard' ? 'bg-lime-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy size={16} /> Standings
          </button>
        </nav>
      </header>

      {activeTab === 'setup' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="text-lime-400" size={20} /> Pengaturan Pertandingan
            </h2>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nama Event</label>
              <input
                type="text"
                value={matchName}
                onChange={(e) => setMatchName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-lime-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Format Permainan</label>
              <select
                value={matchFormat}
                onChange={(e) => setMatchFormat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-lime-400 outline-none"
              >
                <option>Americano (21 Poin)</option>
                <option>Americano (32 Poin)</option>
                <option>Mexicano (King of Court)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Jumlah Lapangan</label>
              <select
                value={courtCount}
                onChange={(e) => setCourtCount(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-lime-400 outline-none"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} Court ({ (i + 1) * 4 } Pemain)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-2 text-white">Import Roster (Reclub)</h2>
              <textarea
                rows={7}
                value={reclubInput}
                onChange={(e) => setReclubInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-lime-400 outline-none font-mono"
              />
            </div>
            <button
              onClick={generateMatches}
              className="mt-4 w-full bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> Generate Schedule
            </button>
          </div>
        </section>
      )}

      {activeTab === 'courts' && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((m) => (
            <div key={m.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <span className="font-extrabold text-lime-400 tracking-wider">COURT {m.courtNumber}</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">Round 1</span>
              </div>
              <div className="space-y-3">
                <div className="bg-slate-950 p-3 rounded-xl flex justify-between items-center border border-slate-800">
                  <span className="text-sm font-semibold truncate pr-2">{m.teamA.join(' / ')}</span>
                  <input
                    type="number"
                    value={m.scoreA}
                    onChange={(e) => handleScoreChange(m.id, 'A', e.target.value)}
                    className="w-14 bg-slate-900 border border-slate-700 text-center text-lime-400 font-bold p-1.5 rounded-lg text-lg outline-none"
                  />
                </div>
                <div className="text-center text-[10px] font-bold text-slate-600">VS</div>
                <div className="bg-slate-950 p-3 rounded-xl flex justify-between items-center border border-slate-800">
                  <span className="text-sm font-semibold truncate pr-2">{m.teamB.join(' / ')}</span>
                  <input
                    type="number"
                    value={m.scoreB}
                    onChange={(e) => handleScoreChange(m.id, 'B', e.target.value)}
                    className="w-14 bg-slate-900 border border-slate-700 text-center text-lime-400 font-bold p-1.5 rounded-lg text-lg outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'leaderboard' && (
        <section className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="text-lime-400" size={20} /> Live Standings
            </h2>
            <span className="text-xs text-slate-400">{leaderboard.length} Pemain</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Pemain</th>
                  <th className="p-4 text-center">Played</th>
                  <th className="p-4 text-center">Wins</th>
                  <th className="p-4 text-center">Poin</th>
                  <th className="p-4 text-center">Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leaderboard.map((p, idx) => (
                  <tr key={p.name} className="hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-lime-400">#{idx + 1}</td>
                    <td className="p-4 font-semibold text-white">{p.name}</td>
                    <td className="p-4 text-center text-slate-300">{p.played}</td>
                    <td className="p-4 text-center text-slate-300">{p.won}</td>
                    <td className="p-4 text-center font-bold text-lime-400">{p.pointsScored}</td>
                    <td className="p-4 text-center text-slate-400">{p.pointDiff > 0 ? `+${p.pointDiff}` : p.pointDiff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
