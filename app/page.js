'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const MATCH_TYPES = [
  { title: 'Americano', desc: 'Rotasi individu dengan pasangan yang berganti.' },
  { title: 'Mexicano', desc: 'Pairing menyesuaikan klasemen setiap ronde.' },
  { title: 'Team Americano', desc: 'Tim tetap bertanding sepanjang turnamen.' },
  { title: 'Mix Americano', desc: 'Rotasi pasangan campuran.' },
  { title: 'Team Mexicano', desc: 'Tim tetap dengan pairing berbasis klasemen.' }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function normalizeTournament(tournament) {
  const totalRounds = Number(tournament.total_rounds ?? tournament.totalRounds ?? 7);
  const courts = Number(tournament.court_count ?? tournament.courts ?? 1);
  return {
    ...tournament,
    id: tournament.id,
    name: tournament.name || 'Ga',
    matchType: tournament.match_type || tournament.matchType || 'Americano',
    courts: courts > 0 ? courts : 1,
    totalRounds: totalRounds > 0 ? totalRounds : 7,
    playersCount: Number(tournament.players_count ?? tournament.playersCount ?? 6),
    targetPoints: tournament.target_points || tournament.targetPoints || 21,
    date: tournament.created_at ? new Date(tournament.created_at).toLocaleString() : '09/01/2026 6:00 PM',
    status: tournament.status || 'Active'
  };
}

export default function PDLUPDualPanelApp() {
  const [currentView, setCurrentView] = useState('TOURNAMENT_DETAIL'); // 'HOME' | 'CREATE' | 'TOURNAMENT_DETAIL' | 'PROFILE'
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState({
    id: 'local-1',
    name: 'Ga',
    matchType: 'Americano',
    courts: 1,
    totalRounds: 7,
    playersCount: 6,
    targetPoints: 21,
    date: '09/01/2026 6:00 PM'
  });

  const [activeRound, setActiveRound] = useState(1);
  const [playersList, setPlayersList] = useState(['A', 'Aa', 'Aaa', 'Aaa(1)', 'Aaa(2)', 'Aaaa']);

  // Leaderboard State (Sesuai Kolom Screenshot PDLUP)
  const [leaderboard, setLeaderboard] = useState([
    { id: '1', rank: 1, name: 'A', g: 0, wlt: '0-0-0', diff: 0, bonus: 0, pts: 0 },
    { id: '2', rank: 2, name: 'Aa', g: 0, wlt: '0-0-0', diff: 0, bonus: 0, pts: 0 },
    { id: '3', rank: 3, name: 'Aaa', g: 0, wlt: '0-0-0', diff: 0, bonus: 0, pts: 0 },
    { id: '4', rank: 4, name: 'Aaa(1)', g: 0, wlt: '0-0-0', diff: 0, bonus: 0, pts: 0 },
    { id: '5', rank: 5, name: 'Aaa(2)', g: 0, wlt: '0-0-0', diff: 0, bonus: 0, pts: 0 },
    { id: '6', rank: 6, name: 'Aaaa', g: 0, wlt: '0-0-0', diff: 0, bonus: 0, pts: 0 },
  ]);

  // Matches State (Sesuai Card Match Box Skor 00 00 & Rest Players PDLUP)
  const [roundsMatches, setRoundsMatches] = useState({
    1: {
      court: 'Court 1',
      teamA: ['Aa', 'Aaa'],
      teamB: ['Aaa(2)', 'A'],
      scoreA: '00',
      scoreB: '00',
      restPlayers: ['Aaa(1)', 'Aaaa'],
      submitted: false
    },
    2: {
      court: 'Court 1',
      teamA: ['A', 'Aaa(1)'],
      teamB: ['Aa', 'Aaaa'],
      scoreA: '00',
      scoreB: '00',
      restPlayers: ['Aaa', 'Aaa(2)'],
      submitted: false
    },
    3: {
      court: 'Court 1',
      teamA: ['Aaa', 'Aaaa'],
      teamB: ['Aaa(1)', 'Aaa(2)'],
      scoreA: '00',
      scoreB: '00',
      restPlayers: ['A', 'Aa'],
      submitted: false
    }
  });

  // Form Create State
  const [formName, setFormName] = useState('');
  const [formMatchType, setFormMatchType] = useState('Americano');
  const [formCourts, setFormCourts] = useState(1);
  const [formRounds, setFormRounds] = useState(7);
  const [formPoints, setFormPoints] = useState('21');
  const [playerInput, setPlayerInput] = useState('');

  const currentMatch = roundsMatches[activeRound] || roundsMatches[1] || {
    court: 'Court 1',
    teamA: ['Player 1', 'Player 2'],
    teamB: ['Player 3', 'Player 4'],
    scoreA: '00',
    scoreB: '00',
    restPlayers: [],
    submitted: false
  };

  // Score Input Change (Max 2 digit format 00)
  const handleScoreChange = (team, value) => {
    if (!/^\d*$/.test(value)) return;
    const formatted = value.padStart(2, '0').slice(-2);
    setRoundsMatches({
      ...roundsMatches,
      [activeRound]: {
        ...currentMatch,
        [team]: formatted
      }
    });
  };

  // Finish Match & Recalculate Leaderboard
  const handleFinishMatch = () => {
    const sA = parseInt(currentMatch.scoreA) || 0;
    const sB = parseInt(currentMatch.scoreB) || 0;

    setRoundsMatches({
      ...roundsMatches,
      [activeRound]: {
        ...currentMatch,
        submitted: true
      }
    });

    const teamANames = currentMatch.teamA;
    const teamBNames = currentMatch.teamB;

    setLeaderboard(prev => {
      return prev.map(p => {
        let newP = { ...p };
        if (teamANames.includes(p.name)) {
          newP.g += 1;
          newP.pts += sA;
          newP.diff += (sA - sB);
          let [w, l, t] = newP.wlt.split('-').map(Number);
          if (sA > sB) w += 1;
          else if (sB > sA) l += 1;
          else t += 1;
          newP.wlt = `${w}-${l}-${t}`;
        } else if (teamBNames.includes(p.name)) {
          newP.g += 1;
          newP.pts += sB;
          newP.diff += (sB - sA);
          let [w, l, t] = newP.wlt.split('-').map(Number);
          if (sB > sA) w += 1;
          else if (sA > sB) l += 1;
          else t += 1;
          newP.wlt = `${w}-${l}-${t}`;
        }
        return newP;
      }).sort((a, b) => b.pts - a.pts || b.diff - a.diff);
    });
  };

  // Submit Form Create Tournament
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (playersList.length < 4) {
      alert("Masukkan minimal 4 pemain!");
      return;
    }

    const tName = formName.trim() || 'Ga';
    const newTourney = {
      id: `local-${Date.now()}`,
      name: tName,
      matchType: formMatchType,
      courts: formCourts,
      totalRounds: formRounds,
      playersCount: playersList.length,
      targetPoints: formPoints,
      date: '09/01/2026 6:00 PM'
    };

    const newLeaderboard = playersList.map((name, idx) => ({
      id: `p-${idx}`,
      rank: idx + 1,
      name,
      g: 0,
      wlt: '0-0-0',
      diff: 0,
      bonus: 0,
      pts: 0
    }));

    setActiveTournament(newTourney);
    setLeaderboard(newLeaderboard);
    setActiveRound(1);
    setCurrentView('TOURNAMENT_DETAIL');
  };

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1f2937' }}>
      
      {/* 1. HEADER BAR BLUE PDLUP */}
      <header style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setCurrentView('HOME')}>
          <span style={{ fontSize: '18px' }}>←</span>
          <div style={{ backgroundColor: '#ffffff', color: '#2563eb', padding: '4px 6px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}>📍</div>
          <span style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>PDLUP - Padel Matchmaker</span>
        </div>
        <button style={{ backgroundColor: 'transparent', border: 'none', color: '#ffffff', fontSize: '18px', cursor: 'pointer' }}>⚙️</button>
      </header>

      {/* 2. SUB-HEADER METADATA */}
      {currentView === 'TOURNAMENT_DETAIL' && activeTournament && (
        <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#2563eb' }}>🏆</span> {activeTournament.name}
              </h1>
              <div style={{ display: 'flex', gap: '12px', color: '#6b7280', fontSize: '16px' }}>
                <span style={{ cursor: 'pointer' }} onClick={() => alert("Share link copied!")}>🔗</span>
                <span style={{ cursor: 'pointer' }}>⋮</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: '#4b5563', fontWeight: '500' }}>
              <span>📋 {activeTournament.matchType}</span>
              <span>📅 {activeTournament.date}</span>
              <span>🎯 {activeTournament.targetPoints} Points</span>
              <span>👥 {activeTournament.playersCount} Players</span>
              <span>🔄 {activeTournament.totalRounds} Rounds</span>
              <span>🎾 {activeTournament.courts} Courts</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. DUAL-PANEL SPLIT VIEW (EXACT MATCH SCREENSHOT APP.PDLUP.COM) */}
      {currentView === 'TOURNAMENT_DETAIL' && (
        <main style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
          
          {/* LEFT PANEL: LEADERBOARD TABLE */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#2563eb' }}>📊</span> Leaderboard
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ backgroundColor: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>👤+</button>
                <button style={{ backgroundColor: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>⋮</button>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', textAlign: 'left' }}>
                  <th style={{ padding: '8px 4px' }}>👁 BY POINTS ▼</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>G</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>W-L-T</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>DIFF</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>+M</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>P</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, idx) => (
                  <tr key={row.id || idx} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '10px 4px', fontWeight: 'bold', color: '#111827' }}>
                      <span style={{ color: '#9ca3af', marginRight: '6px' }}>⋮</span> {idx + 1}. {row.name}
                    </td>
                    <td style={{ padding: '10px 4px', textAlign: 'center', color: '#4b5563' }}>{row.g}</td>
                    <td style={{ padding: '10px 4px', textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>{row.wlt}</td>
                    <td style={{ padding: '10px 4px', textAlign: 'center', color: '#4b5563' }}>{row.diff}</td>
                    <td style={{ padding: '10px 4px', textAlign: 'center', color: '#4b5563' }}>{row.bonus}</td>
                    <td style={{ padding: '10px 4px', textAlign: 'center', fontWeight: 'bold', color: '#2563eb' }}>{row.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #f3f4f6', fontSize: '10px', color: '#9ca3af', lineHeight: '1.6' }}>
              <div>W-L-T = Win - Losses - Ties</div>
              <div>WR = Win Rate</div>
              <div>DIFF = Point Difference</div>
              <div>+M = Compensation points for fewer matches played</div>
              <div>P = Points</div>
              <div>G = Game Played (Missed match)</div>
            </div>
          </div>

          {/* RIGHT PANEL: MATCH ROUNDS & SCORING */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#2563eb' }}>🎾</span> Match Rounds
              </h2>
              <button style={{ backgroundColor: 'transparent', border: 'none', color: '#6b7280', fontSize: '16px', cursor: 'pointer' }}>📑</button>
            </div>

            {/* Horizontal Round Tabs Bar (1, 2, 3, 4, 5, 6, 7) */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
              {Array.from({ length: activeTournament.totalRounds }, (_, i) => i + 1).map(rNum => (
                <button
                  key={rNum}
                  onClick={() => setActiveRound(rNum)}
                  style={{
                    minWidth: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    border: activeRound === rNum ? 'none' : '1px solid #d1d5db',
                    backgroundColor: activeRound === rNum ? '#2563eb' : '#ffffff',
                    color: activeRound === rNum ? '#ffffff' : '#374151',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: activeRound === rNum ? '0 2px 4px rgba(37,99,235,0.3)' : 'none'
                  }}>
                  {rNum}
                </button>
              ))}
            </div>

            {/* Active Match Round Card */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Round #{activeRound}</h3>
                <button style={{ backgroundColor: '#f3f4f6', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: '#4b5563' }}>›</button>
              </div>

              {/* Exact PDLUP Score Card Box */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '20px', position: 'relative', marginBottom: '20px', backgroundColor: '#ffffff' }}>
                
                <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '11px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  {currentMatch.court} ✏️
                </span>

                {/* Score Black Box 00 00 */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <input 
                    type="text"
                    maxLength={2}
                    value={currentMatch.scoreA}
                    onChange={(e) => handleScoreChange('scoreA', e.target.value)}
                    style={{ width: '54px', height: '54px', backgroundColor: '#000000', color: '#ffffff', borderRadius: '10px', fontSize: '24px', fontWeight: 'bold', textAlign: 'center', border: 'none', outline: 'none' }}
                  />
                  <input 
                    type="text"
                    maxLength={2}
                    value={currentMatch.scoreB}
                    onChange={(e) => handleScoreChange('scoreB', e.target.value)}
                    style={{ width: '54px', height: '54px', backgroundColor: '#000000', color: '#ffffff', borderRadius: '10px', fontSize: '24px', fontWeight: 'bold', textAlign: 'center', border: 'none', outline: 'none' }}
                  />
                </div>

                {/* Team Left vs Team Right */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', color: '#111827', gap: '12px' }}>
                  <div>
                    <div>{currentMatch.teamA[0]}</div>
                    <div>{currentMatch.teamA[1]}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>{currentMatch.teamB[0]}</div>
                    <div>{currentMatch.teamB[1]}</div>
                  </div>
                </div>
              </div>

              {/* Rest Players Box */}
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '10px', padding: '12px', textAlign: 'left', fontSize: '12px', color: '#4b5563', marginBottom: '24px' }}>
                <span style={{ fontWeight: 'bold', color: '#111827' }}>Rest Players: </span> 
                {currentMatch.restPlayers && currentMatch.restPlayers.length > 0 ? currentMatch.restPlayers.join(', ') : 'None'}
              </div>

              {/* Finish & Reshuffle Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={handleFinishMatch}
                  style={{ flex: 1, backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                  🚩 Finish
                </button>
                <button 
                  onClick={() => alert("Jadwal round berhasil di-reshuffle!")}
                  style={{ flex: 1, backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                  🔀 Reshuffle
                </button>
              </div>

            </div>
          </div>

        </main>
      )}

      {/* CREATE TOURNAMENT VIEW */}
      {currentView === 'CREATE' && (
        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb', marginBottom: '16px' }}>🏆 Create Tournament</h2>
          <form onSubmit={handleCreateSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Name</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ga" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </div>
            <button type="submit" style={{ width: '100%', backgroundColor: '#2563eb', color: '#fff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>Create</button>
          </form>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb', padding: '8px 0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 50 }}>
        <button onClick={() => setCurrentView('TOURNAMENT_DETAIL')} style={{ backgroundColor: 'transparent', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>🏠 Home</button>
        <button onClick={() => setCurrentView('CREATE')} style={{ backgroundColor: '#2563eb', border: 'none', color: '#ffffff', width: '40px', height: '40px', borderRadius: '50%', fontWeight: 'bold', fontSize: '20px', cursor: 'pointer', marginTop: '-15px' }}>＋</button>
        <button onClick={() => setCurrentView('PROFILE')} style={{ backgroundColor: 'transparent', border: 'none', color: '#6b7280', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>👤 Profile</button>
      </nav>

    </div>
  );
}
