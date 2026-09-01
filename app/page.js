'use client';
import { useState } from 'react';

export default function PDLUPFullApp() {
  // Navigation State
  const [currentView, setCurrentView] = useState('HOME'); // 'HOME' | 'CREATE' | 'TOURNAMENT_DETAIL' | 'PROFILE'
  const [homeFilter, setHomeFilter] = useState('All'); // 'All' | 'Active' | 'Past'
  const [detailTab, setDetailTab] = useState('MATCHES'); // 'MATCHES' | 'STANDINGS' | 'LOGS'

  // Tournament List Database State
  const [tournaments, setTournaments] = useState([
    {
      id: 't-1',
      name: 'Dragon Padel Club',
      matchType: 'Mexicano',
      date: 'Aug 17, 2026 • 10:00 AM',
      courts: 1,
      playersCount: 5,
      status: 'Active',
      currentRound: 1,
      totalRounds: 5,
      points: 32
    },
    {
      id: 't-2',
      name: "Friday's Tournament",
      matchType: 'Americano',
      date: 'Aug 15, 2026 • 8:00 AM',
      courts: 2,
      playersCount: 12,
      status: 'Past',
      currentRound: 4,
      totalRounds: 4,
      points: 21
    }
  ]);

  const [activeTournamentId, setActiveTournamentId] = useState('t-1');

  // Form State for "Create Tournament" Page (Matching PDLUP Screenshots)
  const [formName, setFormName] = useState('');
  const [formMatchType, setFormMatchType] = useState('Americano');
  const [formDate, setFormDate] = useState('September 1, 2026 at 11:00 AM');
  const [formCourts, setFormCourts] = useState(1);
  const [formScoringType, setFormScoringType] = useState('Point Scoring');
  const [formPoints, setFormPoints] = useState('21 Points');
  const [playerInput, setPlayerInput] = useState('');
  const [playersList, setPlayersList] = useState([]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Active Tournament Matches Data
  const [matches, setMatches] = useState([
    {
      id: 'm-1',
      court: 'Court 1',
      badge: 'MIX',
      badgeColor: '#ec4899',
      team1: { name1: 'Thendri', name2: 'Siti', avatar1: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thendri', avatar2: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti' },
      team2: { name1: 'Budi', name2: 'Eka', avatar1: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi', avatar2: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eka' },
      score1: '22',
      score2: '10',
      submitted: true
    },
    {
      id: 'm-2',
      court: 'Court 2',
      badge: 'OPEN',
      badgeColor: '#2563eb',
      team1: { name1: 'Andi', name2: 'Fani', avatar1: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andi', avatar2: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fani' },
      team2: { name1: 'Rian', name2: 'Deni', avatar1: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rian', avatar2: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deni' },
      score1: '',
      score2: '',
      submitted: false
    }
  ]);

  // Standings / Leaderboard State
  const [standings, setStandings] = useState([
    { pos: 1, name: 'Emilia', m: 3, w: 3, l: 0, pts: 48, diff: '+18' },
    { pos: 2, name: 'Sophie', m: 3, w: 2, l: 1, pts: 42, diff: '+8' },
    { pos: 3, name: 'Anna', m: 3, w: 1, l: 2, pts: 35, diff: '-4' },
    { pos: 4, name: 'Lena', m: 3, w: 0, l: 3, pts: 28, diff: '-10' },
  ]);

  // Player Addition Handler
  const handleAddPlayer = () => {
    if (playerInput.trim() !== '') {
      setPlayersList([...playersList, playerInput.trim()]);
      setPlayerInput('');
    }
  };

  // Submit New Tournament Handler
  const handleCreateTournament = (e) => {
    e.preventDefault();
    const newId = `t-${Date.now()}`;
    const newTourney = {
      id: newId,
      name: formName || 'New Tournament',
      matchType: formMatchType,
      date: formDate,
      courts: formCourts,
      playersCount: playersList.length || 4,
      status: 'Active',
      currentRound: 1,
      totalRounds: 4,
      points: formPoints
    };

    setTournaments([newTourney, ...tournaments]);
    setActiveTournamentId(newId);
    setCurrentView('TOURNAMENT_DETAIL');
  };

  // Score Input Change Handler
  const handleScoreChange = (id, team, val) => {
    setMatches(matches.map(m => m.id === id ? { ...m, [team]: val } : m));
  };

  const handleSubmitScore = (id) => {
    setMatches(matches.map(m => m.id === id ? { ...m, submitted: true } : m));
  };

  const activeTourney = tournaments.find(t => t.id === activeTournamentId) || tournaments[0];

  return (
    <div style={{ backgroundColor: '#f3f4f6', color: '#1f2937', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', paddingBottom: '70px' }}>
      
      {/* 1. TOP NAVBAR HEADER (PDLUP BLUE / LIGHT STYLE) */}
      <header style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setCurrentView('HOME')}>
          <div style={{ backgroundColor: '#ffffff', color: '#2563eb', padding: '6px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>📍</span>
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, tracking: 'tight' }}>PDLUP</h1>
            <p style={{ fontSize: '10px', margin: 0, opacity: 0.9, fontWeight: '500' }}>Padel Matchmaker</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentView === 'TOURNAMENT_DETAIL' && (
            <button onClick={() => setCurrentView('HOME')} style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              ← Tournaments
            </button>
          )}
          <button style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>⚙️</button>
        </div>
      </header>

      {/* 2. MAIN VIEW 1: HOME (TOURNAMENT LIST SCREEN) */}
      {currentView === 'HOME' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px' }}>
          
          {/* Filter Bar Options */}
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
            <button style={{ backgroundColor: '#e5e7eb', border: 'none', padding: '6px 10px', borderRadius: '50%', color: '#4b5563', cursor: 'pointer' }}>⚙️</button>
          </div>

          {/* Tournament List Cards */}
          {tournaments.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '48px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>➕</div>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No tournaments yet. Create your first one!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tournaments.filter(t => homeFilter === 'All' || t.status === homeFilter).map(t => (
                <div 
                  key={t.id}
                  onClick={() => { setActiveTournamentId(t.id); setCurrentView('TOURNAMENT_DETAIL'); }}
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

      {/* 3. MAIN VIEW 2: CREATE TOURNAMENT WIZARD */}
      {currentView === 'CREATE' && (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>🏆</span> Create Tournament
            </h2>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <form onSubmit={handleCreateTournament}>
              
              {/* Tournament Name */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>Tournament Name</label>
                <input 
                  type="text"
                  placeholder="Tournament"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              {/* Match Type Dropdown Trigger */}
              <div style={{ marginBottom: '18px', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>Match Type</label>
                <div 
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
                  <span>{formMatchType}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>▼</span>
                </div>

                {/* PDLUP Full Match Types Dropdown Modal */}
                {showTypeDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 40, marginTop: '4px', maxHeight: '280px', overflowY: 'auto', padding: '8px' }}>
                    {[
                      { title: 'Americano', desc: 'Individual rotation. Play with & against everyone.' },
                      { title: 'Team Americano', desc: 'Fixed teams. Play against all teams.' },
                      { title: 'Mix Americano', desc: 'Mixed teams (👨👩). Play with & against everyone.' },
                      { title: 'Mexicano', desc: 'Balanced matches each round based on ranking.' },
                      { title: 'Team Mexicano', desc: 'Fixed teams. Balanced matchups each round.' },
                      { title: 'Mixicano', desc: 'Mixed teams (👨👩). Balanced matches each round.' },
                      { title: 'KOTH (King of the Hill)', desc: 'Winners move up courts, losers move down.' },
                      { title: 'Team KOTH', desc: 'Fixed teams. Winners move up courts.' },
                      { title: 'Knockout', desc: 'Elimination format. Teams compete, losers are out.' },
                      { title: 'Group Stage', desc: 'Round-robin in groups. Top teams advance to knockout.' },
                      { title: 'Custom', desc: 'Build your own tournament rules.' }
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => { setFormMatchType(item.title); setShowTypeDropdown(false); }}
                        style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#transparent'}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#111827' }}>{item.title}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tournament Date Picker Bar */}
              <div style={{ marginBottom: '18px' }}>
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

              {/* Number of Courts Counter */}
              <div style={{ marginBottom: '18px' }}>
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

              {/* Scoring Type & Points per Match */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
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

              {/* Add Players Input Section */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
                  Add Players ({playersList.length})
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input 
                    type="text"
                    placeholder="Type a name... or @username"
                    value={playerInput}
                    onChange={(e) => setPlayerInput(e.target.value)}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none' }}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddPlayer}
                    style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    👤+
                  </button>
                </div>

                {/* Added Players Chips */}
                {playersList.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', backgroundColor: '#f9fafb', padding: '10px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                    {playersList.map((p, i) => (
                      <span key={i} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500' }}>
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Advanced Settings Collapsible */}
              <div style={{ marginBottom: '20px' }}>
                <button 
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{ width: '100%', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>⚙️ Advanced Settings</span>
                  <span>{showAdvanced ? '▲' : '▼'}</span>
                </button>
                {showAdvanced && (
                  <div style={{ padding: '12px', marginTop: '6px', backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: '12px', color: '#4b5563' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <input type="checkbox" defaultChecked /> Enable Tiebreaker ranking rules
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" defaultChecked /> Enable +M bonus points for match win
                    </label>
                  </div>
                )}
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

      {/* 4. MAIN VIEW 3: ACTIVE TOURNAMENT DETAIL SCREEN */}
      {currentView === 'TOURNAMENT_DETAIL' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px' }}>
          
          {/* Tournament Header Summary */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#111827' }}>{activeTourney.name}</h2>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{activeTourney.matchType} • {activeTourney.courts} Courts • {activeTourney.playersCount} Players</p>
              </div>
              <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                Round {activeTourney.currentRound} of {activeTourney.totalRounds}
              </span>
            </div>

            {/* Round Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', backgroundColor: '#f9fafb', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
              <button style={{ border: 'none', background: 'transparent', color: '#2563eb', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>◀ Prev</button>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>ROUND {activeTourney.currentRound}</span>
              <button style={{ border: 'none', background: 'transparent', color: '#2563eb', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>Next ▶</button>
            </div>
          </div>

          {/* Sub Tab Navigation */}
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

          {/* Matches Tab Content */}
          {detailTab === 'MATCHES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {matches.map(m => (
                <div key={m.id} style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: m.submitted ? '1px solid #2563eb' : '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#111827' }}>{m.court}</span>
                    <span style={{ backgroundColor: m.badgeColor, color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>{m.badge}</span>
                  </div>

                  {/* Team 1 Card Row */}
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

                  {/* Team 2 Card Row */}
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

          {/* Standings Tab Content */}
          {detailTab === 'STANDINGS' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
              <div style={{ textAlign: 'center', padding: '12px 0 20px 0', borderBottom: '1px solid #f3f4f6', marginBottom: '16px' }}>
                <span style={{ fontSize: '32px' }}>🏆</span>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#1e3a8a' }}>{standings[0]?.name || 'Leader'}</h3>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Tournament Champion</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>#</th>
                    <th style={{ padding: '8px' }}>Player</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>W-L-T</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>DIFF</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map(s => (
                    <tr key={s.pos} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold', color: s.pos === 1 ? '#2563eb' : '#6b7280' }}>{s.pos}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#111827' }}>{s.name}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#4b5563' }}>{s.w}-{s.l}-0</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: s.diff.startsWith('+') ? '#16a34a' : '#dc2626', fontWeight: '500' }}>{s.diff}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#2563eb' }}>{s.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* 5. FIXED BOTTOM APP BAR NAVIGATION (PDLUP FLOATING STYLE) */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb', padding: '8px 0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 50, boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
        <button 
          onClick={() => setCurrentView('HOME')}
          style={{ backgroundColor: 'transparent', border: 'none', color: currentView === 'HOME' ? '#2563eb' : '#6b7280', fontSize: '11px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span>🏠</span> <span>Home</span>
        </button>
        
        {/* Floating Add Tournament Button */}
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
