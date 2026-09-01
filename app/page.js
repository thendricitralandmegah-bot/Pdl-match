'use client';
import { useState } from 'react';

export default function PDLUPIntegratedApp() {
  const [currentView, setCurrentView] = useState('HOME'); // 'HOME' | 'CREATE' | 'TOURNAMENT_DETAIL' | 'PROFILE'
  const [homeFilter, setHomeFilter] = useState('All');
  const [detailTab, setDetailTab] = useState('MATCHES'); // 'MATCHES' | 'STANDINGS' | 'LOGS'

  // Tournament List Database
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);

  // Form State "Create Tournament"
  const [formName, setFormName] = useState('');
  const [formMatchType, setFormMatchType] = useState('Americano');
  const [formDate, setFormDate] = useState('September 1, 2026 at 11:00 AM');
  const [formCourts, setFormCourts] = useState(1);
  const [formScoringType, setFormScoringType] = useState('Point Scoring');
  const [formPoints, setFormPoints] = useState('21 Points');
  
  // Players Input Roster
  const [playerInput, setPlayerInput] = useState('');
  const [playersList, setPlayersList] = useState(['Anj', 'Abja', 'Avahan', 'Avanan', 'Afahah', 'Abahj']);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Active Tournament Play State
  const [currentRound, setCurrentRound] = useState(1);
  const [roundsData, setRoundsData] = useState({}); // Stores matches per round
  const [activePlayersStats, setActivePlayersStats] = useState([]); // Dynamic standings per tournament
  const [matchLogs, setMatchLogs] = useState([]);

  // Profile Data State
  const [userProfile, setUserProfile] = useState({
    name: 'Thendri',
    role: 'Padel Organizer',
    tournamentsCreated: 12,
    matchesOrganized: 48,
    activeCoins: 10
  });

  // Handler: Add Single Player
  const handleAddPlayer = () => {
    if (playerInput.trim() !== '') {
      setPlayersList([...playersList, playerInput.trim()]);
      setPlayerInput('');
    }
  };

  // Handler: Remove Player
  const handleRemovePlayer = (idx) => {
    setPlayersList(playersList.filter((_, i) => i !== idx));
  };

  // GENERATOR UTAMA MATCH & ROTASI INTEGRATED
  const handleCreateTournamentSubmit = (e) => {
    e.preventDefault();
    if (playersList.length < 4) {
      alert("Masukkan minimal 4 pemain untuk membuat pertandingan!");
      return;
    }

    const tourneyName = formName.trim() || 'New Tournament';
    const targetPts = parseInt(formPoints) || 21;
    const totalRoundsCount = 4;

    // 1. Inisialisasi Player Stats
    const initialStats = playersList.map((name, index) => ({
      id: `p-${index + 1}`,
      name,
      played: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      diff: 0
    }));

    // 2. Generate Rounds & Matches Rotasi Pasangan Fair-Pairing
    const generatedRounds = {};
    for (let r = 1; r <= totalRoundsCount; r++) {
      // Shuffle players per round
      const shuffled = [...playersList].sort(() => Math.random() - 0.5);
      const courtMatches = [];

      for (let c = 0; c < formCourts; c++) {
        const offset = c * 4;
        if (offset + 3 < shuffled.length) {
          courtMatches.push({
            id: `r${r}-c${c + 1}`,
            courtName: `Court ${c + 1}`,
            badge: formMatchType.toUpperCase().includes('MIX') ? 'MIX' : 'OPEN',
            badgeColor: formMatchType.toUpperCase().includes('MIX') ? '#ec4899' : '#2563eb',
            team1: {
              name1: shuffled[offset],
              name2: shuffled[offset + 1],
              avatar1: `https://api.dicebear.com/7.x/avataaars/svg?seed=${shuffled[offset]}`,
              avatar2: `https://api.dicebear.com/7.x/avataaars/svg?seed=${shuffled[offset + 1]}`
            },
            team2: {
              name1: shuffled[offset + 2],
              name2: shuffled[offset + 3],
              avatar1: `https://api.dicebear.com/7.x/avataaars/svg?seed=${shuffled[offset + 2]}`,
              avatar2: `https://api.dicebear.com/7.x/avataaars/svg?seed=${shuffled[offset + 3]}`
            },
            score1: '',
            score2: '',
            submitted: false
          });
        }
      }
      generatedRounds[r] = courtMatches;
    }

    const newTourneyObj = {
      id: `t-${Date.now()}`,
      name: tourneyName,
      matchType: formMatchType,
      date: formDate,
      courts: formCourts,
      playersCount: playersList.length,
      status: 'Active',
      currentRound: 1,
      totalRounds: totalRoundsCount,
      targetPoints: targetPts
    };

    setTournaments([newTourneyObj, ...tournaments]);
    setActiveTournament(newTourneyObj);
    setRoundsData(generatedRounds);
    setActivePlayersStats(initialStats);
    setCurrentRound(1);
    setCurrentView('TOURNAMENT_DETAIL');
  };

  // Handler: Score Input Change
  const handleScoreChange = (matchId, team, val) => {
    const currentMatches = roundsData[currentRound] || [];
    const updated = currentMatches.map(m => m.id === matchId ? { ...m, [team]: val } : m);
    setRoundsData({ ...roundsData, [currentRound]: updated });
  };

  // Handler: Submit Score & Update Leaderboard
  const handleSubmitScore = (matchId) => {
    const currentMatches = roundsData[currentRound] || [];
    const targetMatch = currentMatches.find(m => m.id === matchId);
    
    if (!targetMatch || targetMatch.score1 === '' || targetMatch.score2 === '') {
      alert("Masukkan skor kedua tim terlebih dahulu!");
      return;
    }

    const s1 = parseInt(targetMatch.score1) || 0;
    const s2 = parseInt(targetMatch.score2) || 0;

    // Lock Match Card
    const updatedMatches = currentMatches.map(m => m.id === matchId ? { ...m, submitted: true } : m);
    setRoundsData({ ...roundsData, [currentRound]: updatedMatches });

    // Update Player Standings Realtime
    const t1P1 = targetMatch.team1.name1;
    const t1P2 = targetMatch.team1.name2;
    const t2P1 = targetMatch.team2.name1;
    const t2P2 = targetMatch.team2.name2;

    setActivePlayersStats(prevStats => {
      return prevStats.map(p => {
        let newP = { ...p };
        if (p.name === t1P1 || p.name === t1P2) {
          newP.played += 1;
          newP.pointsFor += s1;
          newP.pointsAgainst += s2;
          if (s1 > s2) newP.wins += 1;
          else if (s2 > s1) newP.losses += 1;
        } else if (p.name === t2P1 || p.name === t2P2) {
          newP.played += 1;
          newP.pointsFor += s2;
          newP.pointsAgainst += s1;
          if (s2 > s1) newP.wins += 1;
          else if (s1 > s2) newP.losses += 1;
        }
        newP.diff = newP.pointsFor - newP.pointsAgainst;
        return newP;
      }).sort((a, b) => b.pointsFor - a.pointsFor || b.wins - a.wins || b.diff - a.diff);
    });

    // Add Log Entry
    const newLog = `Round ${currentRound} (${targetMatch.courtName}): ${t1P1} & ${t1P2} [${s1} - ${s2}] ${t2P1} & ${t2P2}`;
    setMatchLogs([newLog, ...matchLogs]);
  };

  return (
    <div style={{ backgroundColor: '#f3f4f6', color: '#1f2937', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', paddingBottom: '75px' }}>
      
      {/* 1. TOP NAVBAR HEADER */}
      <header style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setCurrentView('HOME')}>
          <div style={{ backgroundColor: '#ffffff', color: '#2563eb', padding: '6px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>📍</span>
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>PDLUP</h1>
            <p style={{ fontSize: '10px', margin: 0, opacity: 0.9, fontWeight: '500' }}>Padel Matchmaker</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currentView === 'TOURNAMENT_DETAIL' && (
            <button onClick={() => setCurrentView('HOME')} style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              ← Tournaments
            </button>
          )}
          <button style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>⚙️</button>
        </div>
      </header>

      {/* 2. SCREEN 1: HOME (TOURNAMENT LIST) */}
      {currentView === 'HOME' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Active', 'Past'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setHomeFilter(filter)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: homeFilter === filter ? '#2563eb' : '#e5e7eb',
                    color: homeFilter === filter ? '#ffffff' : '#4b5563'
                  }}>
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {tournaments.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '48px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎾</div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#111827' }}>No Tournaments Yet</h3>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 16px 0' }}>Create your first padel match to start live scoring.</p>
              <button 
                onClick={() => setCurrentView('CREATE')}
                style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                + Create Tournament
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tournaments.filter(t => homeFilter === 'All' || t.status === homeFilter).map(t => (
                <div 
                  key={t.id}
                  onClick={() => { setActiveTournament(t); setCurrentView('TOURNAMENT_DETAIL'); }}
                  style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#111827' }}>{t.name}</h2>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{t.matchType} • {t.courts} Courts • {t.playersCount} Players</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 0' }}>📅 {t.date}</p>
                  </div>
                  <div style={{ fontSize: '18px', color: '#9ca3af' }}>›</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. SCREEN 2: CREATE TOURNAMENT FORM */}
      {currentView === 'CREATE' && (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>🏆</span> Create Tournament
            </h2>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <form onSubmit={handleCreateTournamentSubmit}>
              
              {/* Name Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>Tournament Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Friday Tournament"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              {/* Match Type Dropdown */}
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>Match Type</label>
                <div 
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
                  <span>{formMatchType}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>▼</span>
                </div>

                {showTypeDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 40, marginTop: '4px', maxHeight: '250px', overflowY: 'auto', padding: '6px' }}>
                    {[
                      { title: 'Americano', desc: 'Individual rotation. Play with & against everyone.' },
                      { title: 'Team Americano', desc: 'Fixed teams. Play against all teams.' },
                      { title: 'Mix Americano', desc: 'Mixed teams (👨👩). Play with & against everyone.' },
                      { title: 'Mexicano', desc: 'Balanced matches each round based on ranking.' },
                      { title: 'Team Mexicano', desc: 'Fixed teams. Balanced matchups each round.' },
                      { title: 'Knockout', desc: 'Elimination format. Teams compete, losers are out.' }
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => { setFormMatchType(item.title); setShowTypeDropdown(false); }}
                        style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#111827' }}>{item.title}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tournament Date */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>Tournament Date</label>
                <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📅</span>
                  <input 
                    type="text" 
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Number of Courts */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>Number of Courts</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setFormCourts(Math.max(1, formCourts - 1))}
                    style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>-</button>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{formCourts}</span>
                  <button 
                    type="button" 
                    onClick={() => setFormCourts(formCourts + 1)}
                    style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>+</button>
                </div>
              </div>

              {/* Scoring Rules */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>Scoring Type</label>
                  <select 
                    value={formScoringType}
                    onChange={(e) => setFormScoringType(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                    <option>Point Scoring</option>
                    <option>Games & Sets</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>Points per Match</label>
                  <select 
                    value={formPoints}
                    onChange={(e) => setFormPoints(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                    <option>16 Points</option>
                    <option>21 Points</option>
                    <option>24 Points</option>
                    <option>32 Points</option>
                  </select>
                </div>
              </div>

              {/* Add Players Box */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
                  Add Players ({playersList.length})
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input 
                    type="text"
                    placeholder="Type a name... or @username"
                    value={playerInput}
                    onChange={(e) => setPlayerInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPlayer())}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none' }}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddPlayer}
                    style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    👤+
                  </button>
                </div>

                {/* Added Players List Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', backgroundColor: '#f9fafb', padding: '10px', borderRadius: '8px', border: '1px solid #f3f4f6', minHeight: '40px' }}>
                  {playersList.map((p, i) => (
                    <span key={i} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {p}
                      <span onClick={() => handleRemovePlayer(i)} style={{ cursor: 'pointer', fontWeight: 'bold', color: '#93c5fd' }}>×</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', fontSize: '15px', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                + Create Tournament
              </button>

            </form>
          </div>
        </div>
      )}

      {/* 4. SCREEN 3: ACTIVE TOURNAMENT DETAIL & SCORING */}
      {currentView === 'TOURNAMENT_DETAIL' && activeTournament && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px' }}>
          
          {/* Header Overview Card */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#111827' }}>{activeTournament.name}</h2>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{activeTournament.matchType} • {activeTournament.courts} Courts • {activeTournament.playersCount} Players</p>
              </div>
              <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                Round {currentRound} of {activeTournament.totalRounds}
              </span>
            </div>

            {/* Interactive Round Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', backgroundColor: '#f9fafb', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
              <button 
                disabled={currentRound === 1}
                onClick={() => setCurrentRound(currentRound - 1)}
                style={{ border: 'none', background: 'transparent', color: currentRound === 1 ? '#9ca3af' : '#2563eb', fontWeight: 'bold', fontSize: '12px', cursor: currentRound === 1 ? 'default' : 'pointer' }}>
                ◀ Prev
              </button>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>ROUND {currentRound}</span>
              <button 
                disabled={currentRound === activeTournament.totalRounds}
                onClick={() => setCurrentRound(currentRound + 1)}
                style={{ border: 'none', background: 'transparent', color: currentRound === activeTournament.totalRounds ? '#9ca3af' : '#2563eb', fontWeight: 'bold', fontSize: '12px', cursor: currentRound === activeTournament.totalRounds ? 'default' : 'pointer' }}>
                Next ▶
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div style={{ display: 'flex', backgroundColor: '#e5e7eb', padding: '3px', borderRadius: '10px', marginBottom: '16px' }}>
            {['MATCHES', 'STANDINGS', 'LOGS'].map(tab => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  backgroundColor: detailTab === tab ? '#ffffff' : 'transparent',
                  color: detailTab === tab ? '#111827' : '#6b7280',
                  boxShadow: detailTab === tab ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}>
                {tab}
              </button>
            ))}
          </div>

          {/* TAB 1: MATCHES PER ROUND */}
          {detailTab === 'MATCHES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(roundsData[currentRound] || []).map(m => (
                <div key={m.id} style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: m.submitted ? '1px solid #2563eb' : '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#111827' }}>{m.courtName}</span>
                    <span style={{ backgroundColor: m.badgeColor, color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>{m.badge}</span>
                  </div>

                  {/* Team 1 Card */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9fafb', padding: '10px 12px', borderRadius: '10px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex' }}>
                        <img src={m.team1.avatar1} alt="p1" style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid #2563eb' }} />
                        <img src={m.team1.avatar2} alt="p2" style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid #2563eb', marginLeft: '-8px' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>{m.team1.name1} & {m.team1.name2}</span>
                    </div>
                    <input 
                      type="number" 
                      value={m.score1} 
                      disabled={m.submitted}
                      onChange={(e) => handleScoreChange(m.id, 'score1', e.target.value)}
                      placeholder="0"
                      style={{ width: '44px', height: '44px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', borderRadius: '8px', border: '1px solid #2563eb', outline: 'none', color: '#2563eb' }}
                    />
                  </div>

                  {/* Team 2 Card */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9fafb', padding: '10px 12px', borderRadius: '10px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex' }}>
                        <img src={m.team2.avatar1} alt="p3" style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid #6b7280' }} />
                        <img src={m.team2.avatar2} alt="p4" style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid #6b7280', marginLeft: '-8px' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>{m.team2.name1} & {m.team2.name2}</span>
                    </div>
                    <input 
                      type="number" 
                      value={m.score2} 
                      disabled={m.submitted}
                      onChange={(e) => handleScoreChange(m.id, 'score2', e.target.value)}
                      placeholder="0"
                      style={{ width: '44px', height: '44px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', color: '#111827' }}
                    />
                  </div>

                  <button 
                    onClick={() => handleSubmitScore(m.id)}
                    disabled={m.submitted}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: m.submitted ? 'default' : 'pointer', backgroundColor: m.submitted ? '#e5e7eb' : '#2563eb', color: m.submitted ? '#9ca3af' : '#fff' }}>
                    {m.submitted ? '✓ SCORE SUBMITTED' : 'SUBMIT SCORE'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: DYNAMIC STANDINGS */}
          {detailTab === 'STANDINGS' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
              <div style={{ textAlign: 'center', padding: '12px 0 20px 0', borderBottom: '1px solid #f3f4f6', marginBottom: '16px' }}>
                <span style={{ fontSize: '32px' }}>🏆</span>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#1e3a8a' }}>{activePlayersStats[0]?.name || 'Leader'}</h3>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Tournament Champion</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>#</th>
                    <th style={{ padding: '8px' }}>Player</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>W-L</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>DIFF</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {activePlayersStats.map((s, idx) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold', color: idx === 0 ? '#2563eb' : '#6b7280' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#111827' }}>{s.name}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#4b5563' }}>{s.wins}-{s.losses}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: s.diff >= 0 ? '#16a34a' : '#dc2626', fontWeight: '500' }}>{s.diff > 0 ? `+${s.diff}` : s.diff}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#2563eb' }}>{s.pointsFor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: MATCH LOGS */}
          {detailTab === 'LOGS' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', marginTop: 0, marginBottom: '12px' }}>Activity Logs</h3>
              {matchLogs.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, textAlign: 'center' }}>Belum ada skor yang dimasukkan.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {matchLogs.map((log, i) => (
                    <div key={i} style={{ backgroundColor: '#f9fafb', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#374151', border: '1px solid #f3f4f6' }}>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* 5. SCREEN 4: USER PROFILE SCREEN */}
      {currentView === 'PROFILE' && (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', textAlign: 'center', marginBottom: '16px' }}>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.name}`} alt="profile" style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px solid #2563eb', marginBottom: '12px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#111827' }}>{userProfile.name}</h2>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 16px 0' }}>{userProfile.role}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>{userProfile.tournamentsCreated}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Tournaments</div>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>{userProfile.matchesOrganized}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Matches Created</div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', marginTop: 0, marginBottom: '12px' }}>Account Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#f9fafb', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>⚙️ Club & Court Management</button>
              <button style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#f9fafb', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>🪙 Subscription & Coins ({userProfile.activeCoins})</button>
              <button style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#f9fafb', fontSize: '13px', color: '#dc2626', cursor: 'pointer' }}>🚪 Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. FIXED BOTTOM APP BAR NAVIGATION */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb', padding: '8px 0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 50, boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
        <button 
          onClick={() => setCurrentView('HOME')}
          style={{ backgroundColor: 'transparent', border: 'none', color: currentView === 'HOME' ? '#2563eb' : '#6b7280', fontSize: '11px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span>🏠</span> <span>Home</span>
        </button>
        
        {/* Floating Create Button */}
        <button 
          onClick={() => setCurrentView('CREATE')}
          style={{ backgroundColor: '#2563eb', border: 'none', color: '#ffffff', width: '44px', height: '44px', borderRadius: '50%', fontWeight: 'bold', fontSize: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', marginTop: '-16px', boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}>
          +
        </button>

        <button 
          onClick={() => setCurrentView('PROFILE')}
          style={{ backgroundColor: 'transparent', border: 'none', color: currentView === 'PROFILE' ? '#2563eb' : '#6b7280', fontSize: '11px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span>👤</span> <span>Profile</span>
        </button>
      </div>

    </div>
  );
}
