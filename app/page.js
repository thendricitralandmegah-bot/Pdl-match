'use client';
import { useState } from 'react';

export default function PDLUPApp() {
  const [activeTab, setActiveTab] = useState('MATCHES');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Data Tournament Active
  const [tournament, setTournament] = useState({
    name: 'PD-Kan Mix Match Vol. 7',
    matchType: 'Mix Americano',
    location: 'Golden Padel Batam',
    targetPoints: 21,
    courtsCount: 2
  });

  const [currentRoundNum, setCurrentRoundNum] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);

  // Form State untuk Modal Create
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Americano');
  const [formCourts, setFormCourts] = useState(2);
  const [formPoints, setFormPoints] = useState(21);
  const [formRoster, setFormRoster] = useState("Thendri\nSiti\nBudi\nEka\nAndi\nFani\nRian\nDeni");

  // Matches State
  const [roundsMatches, setRoundsMatches] = useState({
    1: [
      {
        id: 'r1-c1',
        courtName: 'Court 1',
        badge: 'MIX',
        badgeColor: '#ec4899',
        team1: { name1: 'Thendri', name2: 'Siti', avatar1: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thendri', avatar2: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti' },
        team2: { name1: 'Budi', name2: 'Eka', avatar1: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi', avatar2: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eka' },
        score1: '',
        score2: '',
        submitted: false
      },
      {
        id: 'r1-c2',
        courtName: 'Court 2',
        badge: 'MIX',
        badgeColor: '#ec4899',
        team1: { name1: 'Andi', name2: 'Fani', avatar1: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andi', avatar2: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fani' },
        team2: { name1: 'Rian', name2: 'Deni', avatar1: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rian', avatar2: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deni' },
        score1: '',
        score2: '',
        submitted: false
      }
    ]
  });

  // Players Leaderboard State
  const [players, setPlayers] = useState([
    { id: 1, name: 'Thendri', played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, diff: 0 },
    { id: 2, name: 'Siti', played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, diff: 0 },
    { id: 3, name: 'Budi', played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, diff: 0 },
    { id: 4, name: 'Eka', played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, diff: 0 },
    { id: 5, name: 'Andi', played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, diff: 0 },
    { id: 6, name: 'Fani', played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, diff: 0 },
    { id: 7, name: 'Rian', played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, diff: 0 },
    { id: 8, name: 'Deni', played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, diff: 0 },
  ]);

  // Handler Score Change
  const handleScoreInput = (matchId, team, val) => {
    const activeMatches = roundsMatches[currentRoundNum] || [];
    const updated = activeMatches.map(m => {
      if (m.id === matchId) {
        return { ...m, [team]: val };
      }
      return m;
    });
    setRoundsMatches({ ...roundsMatches, [currentRoundNum]: updated });
  };

  // Submit Score & Recalculate Standings
  const handleSubmitScore = (matchId) => {
    const activeMatches = roundsMatches[currentRoundNum] || [];
    const targetMatch = activeMatches.find(m => m.id === matchId);
    if (!targetMatch || targetMatch.score1 === '' || targetMatch.score2 === '') {
      alert("Masukkan skor kedua tim terlebih dahulu!");
      return;
    }

    const s1 = parseInt(targetMatch.score1) || 0;
    const s2 = parseInt(targetMatch.score2) || 0;

    // Mark Match as Submitted
    const updatedMatches = activeMatches.map(m => {
      if (m.id === matchId) return { ...m, submitted: true };
      return m;
    });
    setRoundsMatches({ ...roundsMatches, [currentRoundNum]: updatedMatches });

    // Update Player Leaderboard Stats
    const t1Names = [targetMatch.team1.name1, targetMatch.team1.name2];
    const t2Names = [targetMatch.team2.name1, targetMatch.team2.name2];

    setPlayers(prevPlayers => {
      return prevPlayers.map(p => {
        let newP = { ...p };
        if (t1Names.includes(p.name)) {
          newP.played += 1;
          newP.pointsFor += s1;
          newP.pointsAgainst += s2;
          if (s1 > s2) newP.wins += 1;
          else if (s2 > s1) newP.losses += 1;
        } else if (t2Names.includes(p.name)) {
          newP.played += 1;
          newP.pointsFor += s2;
          newP.pointsAgainst += s1;
          if (s2 > s1) newP.wins += 1;
          else if (s1 > s2) newP.losses += 1;
        }
        newP.diff = newP.pointsFor - newP.pointsAgainst;
        return newP;
      }).sort((a, b) => b.pointsFor - a.pointsFor || b.diff - a.diff);
    });
  };

  // Generator Tournament Baru
  const handleCreateTournamentSubmit = (e) => {
    e.preventDefault();
    const rawNames = formRoster.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (rawNames.length < 4) {
      alert("Masukkan minimal 4 nama pemain!");
      return;
    }

    const newPlayers = rawNames.map((name, idx) => ({
      id: idx + 1,
      name,
      played: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      diff: 0
    }));

    setTournament({
      name: formName || 'Tournament Baru',
      matchType: formType,
      location: 'Golden Padel Batam',
      targetPoints: formPoints,
      courtsCount: formCourts
    });

    setPlayers(newPlayers);

    // Generate Round 1 Matches
    const shuffled = [...newPlayers].sort(() => Math.random() - 0.5);
    const newMatches = [];
    for (let c = 0; c < formCourts; c++) {
      const offset = c * 4;
      if (offset + 3 < shuffled.length) {
        newMatches.push({
          id: `r1-c${c + 1}`,
          courtName: `Court ${c + 1}`,
          badge: formType.toUpperCase().includes('MIX') ? 'MIX' : 'OPEN',
          badgeColor: formType.toUpperCase().includes('MIX') ? '#ec4899' : '#3b82f6',
          team1: {
            name1: shuffled[offset].name,
            name2: shuffled[offset + 1].name,
            avatar1: `https://api.dicebear.com/7.x/avataaars/svg?seed=${shuffled[offset].name}`,
            avatar2: `https://api.dicebear.com/7.x/avataaars/svg?seed=${shuffled[offset + 1].name}`
          },
          team2: {
            name1: shuffled[offset + 2].name,
            name2: shuffled[offset + 3].name,
            avatar1: `https://api.dicebear.com/7.x/avataaars/svg?seed=${shuffled[offset + 2].name}`,
            avatar2: `https://api.dicebear.com/7.x/avataaars/svg?seed=${shuffled[offset + 3].name}`
          },
          score1: '',
          score2: '',
          submitted: false
        });
      }
    }

    setRoundsMatches({ 1: newMatches });
    setCurrentRoundNum(1);
    setShowCreateModal(false);
    setActiveTab('MATCHES');
  };

  return (
    <div style={{ backgroundColor: '#0b0f17', color: '#f3f4f6', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', paddingBottom: '90px' }}>
      
      {/* 1. PDLUP Top Navigation Header */}
      <div style={{ backgroundColor: '#111827', borderBottom: '1px solid #1f2937', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ backgroundColor: '#ccff00', color: '#000', fontWeight: '900', fontSize: '18px', padding: '4px 10px', borderRadius: '6px', letterSpacing: '1px' }}>
            PDLUP
          </div>
          <span style={{ fontSize: '12px', color: '#ccff00', backgroundColor: 'rgba(204,255,0,0.1)', border: '1px solid #ccff00', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
            🪙 10
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => alert("Link match berhasil disalin!")} style={{ backgroundColor: '#ccff00', color: '#000', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>SHARE LINK 🔗</button>
          <button onClick={() => setShowCreateModal(true)} style={{ backgroundColor: '#1f2937', color: '#ccff00', border: '1px solid #ccff00', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>+ NEW</button>
        </div>
      </div>

      {/* 2. Sub-Header Tournament Card */}
      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#fff' }}>{tournament.name}</h1>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>{tournament.matchType} • {tournament.location}</p>
            </div>
            <span style={{ backgroundColor: '#ccff00', color: '#000', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px' }}>
              Round {currentRoundNum} of {totalRounds}
            </span>
          </div>

          {/* Round Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', backgroundColor: '#0b0f17', padding: '8px 12px', borderRadius: '8px' }}>
            <button 
              disabled={currentRoundNum === 1}
              onClick={() => setCurrentRoundNum(currentRoundNum - 1)}
              style={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', opacity: currentRoundNum === 1 ? 0.4 : 1 }}>
              ◀ Prev
            </button>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ccff00' }}>ROUND {currentRoundNum}</span>
            <button 
              disabled={currentRoundNum === totalRounds}
              onClick={() => setCurrentRoundNum(currentRoundNum + 1)}
              style={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', opacity: currentRoundNum === totalRounds ? 0.4 : 1 }}>
              Next ▶
            </button>
          </div>
        </div>

        {/* 3. Navigation Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#111827', padding: '4px', borderRadius: '10px', border: '1px solid #1f2937', marginBottom: '16px' }}>
          {['MATCHES', 'STANDINGS', 'LOGS'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: activeTab === tab ? '#ccff00' : 'transparent',
                color: activeTab === tab ? '#000' : '#9ca3af',
                transition: '0.2s'
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* 4. Tab Contents */}
        {activeTab === 'MATCHES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(roundsMatches[currentRoundNum] || []).map(match => (
              <div key={match.id} style={{ backgroundColor: '#111827', border: match.submitted ? '1px solid #ccff00' : '1px solid #1f2937', borderRadius: '14px', padding: '16px' }}>
                
                {/* Court Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>{match.courtName}</span>
                  <span style={{ backgroundColor: match.badgeColor, color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                    {match.badge}
                  </span>
                </div>

                {/* Team 1 Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0b0f17', padding: '10px 12px', borderRadius: '10px', marginBottom: '8px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex' }}>
                      <img src={match.team1.avatar1} alt="p1" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #ccff00' }} />
                      <img src={match.team1.avatar2} alt="p2" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #ccff00', marginLeft: '-10px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{match.team1.name1}</div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#9ca3af' }}>{match.team1.name2}</div>
                    </div>
                  </div>
                  <input 
                    type="number"
                    value={match.score1}
                    disabled={match.submitted}
                    onChange={(e) => handleScoreInput(match.id, 'score1', e.target.value)}
                    placeholder="0"
                    style={{ width: '48px', height: '48px', backgroundColor: '#111827', border: '1px solid #ccff00', borderRadius: '8px', color: '#ccff00', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}
                  />
                </div>

                <div style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280', fontWeight: 'bold', margin: '4px 0' }}>VS</div>

                {/* Team 2 Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0b0f17', padding: '10px 12px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex' }}>
                      <img src={match.team2.avatar1} alt="p3" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #3b82f6' }} />
                      <img src={match.team2.avatar2} alt="p4" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #3b82f6', marginLeft: '-10px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{match.team2.name1}</div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#9ca3af' }}>{match.team2.name2}</div>
                    </div>
                  </div>
                  <input 
                    type="number"
                    value={match.score2}
                    disabled={match.submitted}
                    onChange={(e) => handleScoreInput(match.id, 'score2', e.target.value)}
                    placeholder="0"
                    style={{ width: '48px', height: '48px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}
                  />
                </div>

                {/* Submit Score Button */}
                <button 
                  onClick={() => handleSubmitScore(match.id)}
                  disabled={match.submitted}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: match.submitted ? 'default' : 'pointer',
                    backgroundColor: match.submitted ? '#1f2937' : '#ccff00',
                    color: match.submitted ? '#9ca3af' : '#000'
                  }}>
                  {match.submitted ? '✓ SCORE SUBMITTED' : 'SUBMIT SCORE'}
                </button>

              </div>
            ))}
          </div>
        )}

        {/* Leaderboard Table */}
        {activeTab === 'STANDINGS' && (
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '16px', overflowX: 'auto' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#ccff00', marginTop: 0, marginBottom: '12px' }}>LEADERBOARD KLASEMEN</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937', color: '#9ca3af', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>POS</th>
                  <th style={{ padding: '8px' }}>NAMA PEMAIN</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>MAIN</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>MENANG</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>POIN</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>DIFF</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, idx) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #0b0f17' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 'bold', color: idx === 0 ? '#ccff00' : '#9ca3af' }}>#{idx + 1}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{p.name}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{p.played}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#ccff00', fontWeight: 'bold' }}>{p.wins}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold' }}>{p.pointsFor}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: p.diff >= 0 ? '#ccff00' : '#ef4444' }}>{p.diff > 0 ? `+${p.diff}` : p.diff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'LOGS' && (
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
            Riwayat log aktivitas match tersimpan otomatis di database Supabase Anda.
          </div>
        )}

      </div>

      {/* 5. Create Tournament Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 30, padding: '16px' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#ccff00' }}>🏆 Create Tournament</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateTournamentSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px', fontWeight: 'bold' }}>TOURNAMENT NAME</label>
                <input 
                  type="text" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. PD-Kan Vol. 8"
                  style={{ width: '100%', backgroundColor: '#0b0f17', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px', fontWeight: 'bold' }}>MATCH TYPE</label>
                <select 
                  value={formType} 
                  onChange={(e) => setFormType(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0b0f17', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}>
                  <option value="Americano">Americano (Rotasi Individu)</option>
                  <option value="Mix Americano">Mix Americano (Mix Gender)</option>
                  <option value="Mexicano">Mexicano (Peringkat Dinamis)</option>
                  <option value="Team Americano">Team Americano (Pasangan Tetap)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px', fontWeight: 'bold' }}>COURTS</label>
                  <select 
                    value={formCourts} 
                    onChange={(e) => setFormCourts(parseInt(e.target.value))}
                    style={{ width: '100%', backgroundColor: '#0b0f17', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}>
                    <option value={1}>1 Court (4 Players)</option>
                    <option value={2}>2 Courts (8 Players)</option>
                    <option value={3}>3 Courts (12 Players)</option>
                    <option value={4}>4 Courts (16 Players)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px', fontWeight: 'bold' }}>TARGET POINTS</label>
                  <input 
                    type="number" 
                    value={formPoints} 
                    onChange={(e) => setFormPoints(parseInt(e.target.value) || 21)}
                    style={{ width: '100%', backgroundColor: '#0b0f17', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px', fontWeight: 'bold' }}>ROSTER PEMAIN (Import Reclub)</label>
                <textarea 
                  rows={5}
                  value={formRoster}
                  onChange={(e) => setFormRoster(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0b0f17', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit"
                style={{ width: '100%', backgroundColor: '#ccff00', color: '#000', fontWeight: 'bold', fontSize: '14px', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                Generate Tournament Match 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Fixed Bottom Floating Menu */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#111827', borderTop: '1px solid #1f2937', padding: '10px 0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 20 }}>
        <button onClick={() => setActiveTab('MATCHES')} style={{ backgroundColor: 'transparent', border: 'none', color: '#ccff00', fontSize: '11px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          🏠 <span>HOME</span>
        </button>
        <button onClick={() => setShowCreateModal(true)} style={{ backgroundColor: '#ccff00', border: 'none', color: '#000', width: '42px', height: '42px', borderRadius: '50%', fontWeight: 'bold', fontSize: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', marginTop: '-18px', boxShadow: '0 0 12px rgba(204,255,0,0.5)' }}>
          +
        </button>
        <button onClick={() => setActiveTab('STANDINGS')} style={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af', fontSize: '11px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          🏆 <span>RANKING</span>
        </button>
      </div>

    </div>
  );
}
