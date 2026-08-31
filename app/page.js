'use client';
import { useState, useEffect } from 'react';

export default function PDLMatchApp() {
  const [activeTab, setActiveTab] = useState('setup'); // 'setup' | 'courts' | 'standings'
  
  // State Form Tournament
  const [tournamentName, setTournamentName] = useState('PDL-MATCH Session');
  const [matchFormat, setMatchFormat] = useState('Americano'); // Americano, Mexicano, Team Americano, Mix Americano
  const [targetPoints, setTargetPoints] = useState(21);
  const [courtCount, setCourtCount] = useState(2);
  const [playerInput, setPlayerInput] = useState("Thendri\nBudi\nAndi\nSiti\nRian\nEka\nDeni\nFani");

  // State Data Game
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);

  // Auto Generate Schedule Algoritma (Americano Rotation Engine)
  const handleGenerateTournament = () => {
    const rawNames = playerInput.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (rawNames.length < 4) {
      alert("Masukkan minimal 4 nama pemain untuk membuat jadwal match!");
      return;
    }

    const playerList = rawNames.map((name, index) => ({
      id: index + 1,
      name,
      played: 0,
      won: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      diff: 0
    }));

    setPlayers(playerList);

    // Generate Matches / Rotasi Sederhana untuk Americano
    const generatedRounds = [];
    const totalRounds = 4; // Default 4 round rotasi

    for (let r = 1; r <= totalRounds; r++) {
      const shuffled = [...playerList].sort(() => Math.random() - 0.5);
      const matches = [];

      for (let c = 0; c < courtCount; c++) {
        const offset = c * 4;
        if (offset + 3 < shuffled.length) {
          matches.push({
            id: `R${r}-C${c + 1}`,
            courtName: `Court ${c + 1}`,
            team1: [shuffled[offset], shuffled[offset + 1]],
            team2: [shuffled[offset + 2], shuffled[offset + 3]],
            score1: '',
            score2: '',
            completed: false
          });
        }
      }

      if (matches.length > 0) {
        generatedRounds.push({ roundNum: r, matches });
      }
    }

    setRounds(generatedRounds);
    setCurrentRoundIdx(0);
    setActiveTab('courts');
  };

  // Update Score Handler
  const handleScoreChange = (roundIdx, matchId, teamNum, value) => {
    const valNum = parseInt(value) || 0;
    const updatedRounds = [...rounds];
    const match = updatedRounds[roundIdx].matches.find(m => m.id === matchId);

    if (teamNum === 1) {
      match.score1 = value;
      // Auto fill score 2 jika format Americano poin pas (e.g. 21)
      if (valNum <= targetPoints && matchFormat === 'Americano') {
        match.score2 = targetPoints - valNum;
      }
    } else {
      match.score2 = value;
    }

    match.completed = match.score1 !== '' && match.score2 !== '';
    setRounds(updatedRounds);
    recalculateStandings(updatedRounds);
  };

  // Recalculate Standings / Leaderboard Logic
  const recalculateStandings = (currentRounds) => {
    const playerStats = {};
    players.forEach(p => {
      playerStats[p.id] = { ...p, played: 0, won: 0, lost: 0, pointsFor: 0, pointsAgainst: 0, diff: 0 };
    });

    currentRounds.forEach(r => {
      r.matches.forEach(m => {
        if (m.completed) {
          const s1 = parseInt(m.score1) || 0;
          const s2 = parseInt(m.score2) || 0;

          // Team 1 Stats
          m.team1.forEach(p => {
            if (playerStats[p.id]) {
              playerStats[p.id].played += 1;
              playerStats[p.id].pointsFor += s1;
              playerStats[p.id].pointsAgainst += s2;
              if (s1 > s2) playerStats[p.id].won += 1;
              else if (s1 < s2) playerStats[p.id].lost += 1;
            }
          });

          // Team 2 Stats
          m.team2.forEach(p => {
            if (playerStats[p.id]) {
              playerStats[p.id].played += 1;
              playerStats[p.id].pointsFor += s2;
              playerStats[p.id].pointsAgainst += s1;
              if (s2 > s1) playerStats[p.id].won += 1;
              else if (s2 < s1) playerStats[p.id].lost += 1;
            }
          });
        }
      });
    });

    const updatedList = Object.values(playerStats).map(p => ({
      ...p,
      diff: p.pointsFor - p.pointsAgainst
    })).sort((a, b) => b.pointsFor - a.pointsFor || b.diff - a.diff);

    setPlayers(updatedList);
  };

  return (
    <div style={{ backgroundColor: '#090d16', color: '#f3f4f6', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '20px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Top Header / App Brand */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f293d', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#a3e635', color: '#000000', fontWeight: '900', fontSize: '22px', padding: '6px 16px', borderRadius: '10px', letterSpacing: '1px', boxShadow: '0 0 15px rgba(163,230,53,0.3)' }}>
              PDLUP
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{tournamentName}</h1>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0' }}>{matchFormat} • {targetPoints} Poin • {courtCount} Court</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('setup')}
            style={{ backgroundColor: '#1f293d', color: '#a3e635', border: '1px solid #374151', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            + Event Baru
          </button>
        </header>

        {/* PDLUP Style Tab Navigation */}
        <div style={{ display: 'flex', backgroundColor: '#111827', padding: '6px', borderRadius: '14px', border: '1px solid #1f293d', marginBottom: '24px', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('setup')}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', backgroundColor: activeTab === 'setup' ? '#a3e635' : 'transparent', color: activeTab === 'setup' ? '#000' : '#9ca3af', transition: '0.2s' }}>
            ⚙️ Setup & Roster
          </button>
          <button 
            onClick={() => setActiveTab('courts')}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', backgroundColor: activeTab === 'courts' ? '#a3e635' : 'transparent', color: activeTab === 'courts' ? '#000' : '#9ca3af', transition: '0.2s' }}>
            🎾 Live Courts ({rounds.length > 0 ? rounds[currentRoundIdx]?.matches.length : 0})
          </button>
          <button 
            onClick={() => setActiveTab('standings')}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', backgroundColor: activeTab === 'standings' ? '#a3e635' : 'transparent', color: activeTab === 'standings' ? '#000' : '#9ca3af', transition: '0.2s' }}>
            🏆 Leaderboard
          </button>
        </div>

        {/* TAB 1: SETUP & ROSTER IMPORT */}
        {activeTab === 'setup' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Config Panel */}
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '18px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#a3e635', marginTop: 0, marginBottom: '18px' }}>1. Format Tournament</h2>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 'bold' }}>NAMA EVENT</label>
                <input 
                  type="text" 
                  value={tournamentName} 
                  onChange={(e) => setTournamentName(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#090d16', border: '1px solid #374151', borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 'bold' }}>MATCH FORMAT</label>
                <select 
                  value={matchFormat} 
                  onChange={(e) => setMatchFormat(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#090d16', border: '1px solid #374151', borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option value="Americano">Americano (Individual Rotation)</option>
                  <option value="Mexicano">Mexicano (Leaderboard-based Pairing)</option>
                  <option value="Team Americano">Team Americano (Fixed Pairs)</option>
                  <option value="Mix Americano">Mix Americano (Male + Female Pair)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 'bold' }}>TARGET POIN</label>
                  <input 
                    type="number" 
                    value={targetPoints} 
                    onChange={(e) => setTargetPoints(parseInt(e.target.value) || 21)}
                    style={{ width: '100%', backgroundColor: '#090d16', border: '1px solid #374151', borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 'bold' }}>LAPANGAN</label>
                  <select 
                    value={courtCount} 
                    onChange={(e) => setCourtCount(parseInt(e.target.value))}
                    style={{ width: '100%', backgroundColor: '#090d16', border: '1px solid #374151', borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}>
                    <option value={1}>1 Court (4 Pemain)</option>
                    <option value={2}>2 Court (8 Pemain)</option>
                    <option value={3}>3 Court (12 Pemain)</option>
                    <option value={4}>4 Court (16 Pemain)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Roster Import Panel */}
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#a3e635', marginTop: 0, marginBottom: '18px' }}>2. Import Pemain (Reclub / Manual)</h2>
                <textarea 
                  rows={8}
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  placeholder="Paste daftar nama pemain..."
                  style={{ width: '100%', backgroundColor: '#090d16', border: '1px solid #374151', borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '14px', fontFamily: 'monospace', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
              <button 
                onClick={handleGenerateTournament}
                style={{ width: '100%', backgroundColor: '#a3e635', color: '#000', fontWeight: 'bold', fontSize: '16px', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', marginTop: '18px', boxShadow: '0 4px 15px rgba(163,230,53,0.3)' }}>
                Generate Schedule PDLUP 🚀
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE COURTS & SCORE INPUT */}
        {activeTab === 'courts' && (
          <div>
            {rounds.length === 0 ? (
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '18px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                <p>Belum ada jadwal. Silakan masuk ke tab <b>Setup & Roster</b> lalu klik <b>Generate Schedule</b>.</p>
              </div>
            ) : (
              <div>
                {/* Round Switcher Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <button 
                    disabled={currentRoundIdx === 0}
                    onClick={() => setCurrentRoundIdx(currentRoundIdx - 1)}
                    style={{ backgroundColor: '#1f293d', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: currentRoundIdx === 0 ? 'not-allowed' : 'pointer', opacity: currentRoundIdx === 0 ? 0.5 : 1 }}>
                    ← Round Sebelumnya
                  </button>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#a3e635' }}>
                    ROUND {rounds[currentRoundIdx].roundNum} dari {rounds.length}
                  </span>
                  <button 
                    disabled={currentRoundIdx === rounds.length - 1}
                    onClick={() => setCurrentRoundIdx(currentRoundIdx + 1)}
                    style={{ backgroundColor: '#1f293d', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: currentRoundIdx === rounds.length - 1 ? 'not-allowed' : 'pointer', opacity: currentRoundIdx === rounds.length - 1 ? 0.5 : 1 }}>
                    Round Berikutnya →
                  </button>
                </div>

                {/* Match Cards Per Court */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  {rounds[currentRoundIdx].matches.map((match) => (
                    <div key={match.id} style={{ backgroundColor: '#111827', border: match.completed ? '1px solid #a3e635' : '1px solid #1f293d', borderRadius: '18px', padding: '20px', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #1f293d', paddingBottom: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#a3e635', fontSize: '14px' }}>{match.courtName}</span>
                        <span style={{ fontSize: '12px', color: match.completed ? '#a3e635' : '#eab308', backgroundColor: '#090d16', padding: '2px 8px', borderRadius: '12px', border: '1px solid #374151' }}>
                          {match.completed ? '● SELESAI' : 'LIVE'}
                        </span>
                      </div>

                      {/* Team 1 vs Team 2 Score Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px' }}>{match.team1[0].name}</p>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px', color: '#9ca3af' }}>{match.team1[1].name}</p>
                        </div>
                        <input 
                          type="number" 
                          value={match.score1} 
                          onChange={(e) => handleScoreChange(currentRoundIdx, match.id, 1, e.target.value)}
                          placeholder="0"
                          style={{ width: '50px', height: '50px', backgroundColor: '#090d16', border: '1px solid #a3e635', borderRadius: '10px', color: '#a3e635', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}
                        />
                      </div>

                      <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', margin: '8px 0', fontWeight: 'bold' }}>VS</div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px' }}>{match.team2[0].name}</p>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px', color: '#9ca3af' }}>{match.team2[1].name}</p>
                        </div>
                        <input 
                          type="number" 
                          value={match.score2} 
                          onChange={(e) => handleScoreChange(currentRoundIdx, match.id, 2, e.target.value)}
                          placeholder="0"
                          style={{ width: '50px', height: '50px', backgroundColor: '#090d16', border: '1px solid #374151', borderRadius: '10px', color: '#fff', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STANDINGS / LEADERBOARD */}
        {activeTab === 'standings' && (
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '18px', padding: '20px', overflowX: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#a3e635', marginTop: 0, marginBottom: '16px' }}>🏆 Standings Klasemen PDLUP</h2>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f293d', color: '#9ca3af' }}>
                  <th style={{ padding: '12px 8px' }}>POS</th>
                  <th style={{ padding: '12px 8px' }}>NAMA PEMAIN</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>MAIN</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>MENANG</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>POIN FOR</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>DIFF</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, idx) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #111827', backgroundColor: idx === 0 ? 'rgba(163,230,53,0.05)' : 'transparent' }}>
                    <td style={{ padding: '14px 8px', fontWeight: 'bold', color: idx === 0 ? '#a3e635' : '#9ca3af' }}>#{idx + 1}</td>
                    <td style={{ padding: '14px 8px', fontWeight: 'bold' }}>{p.name}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>{p.played}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: '#a3e635', fontWeight: 'bold' }}>{p.won}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 'bold' }}>{p.pointsFor}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: p.diff >= 0 ? '#a3e635' : '#ef4444' }}>{p.diff > 0 ? `+${p.diff}` : p.diff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
