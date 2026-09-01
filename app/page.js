'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Realtime Client Init
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function PDLUPEngineApp() {
  const [currentView, setCurrentView] = useState('HOME'); // 'HOME' | 'CREATE' | 'TOURNAMENT_DETAIL' | 'PROFILE'
  const [homeFilter, setHomeFilter] = useState('All');
  const [detailTab, setDetailTab] = useState('MATCHES'); // 'MATCHES' | 'STANDINGS' | 'LOGS'

  // Data Stores
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundsMatches, setRoundsMatches] = useState({});
  const [standings, setStandings] = useState([]);
  const [matchLogs, setMatchLogs] = useState([]);

  // Form State "Create Tournament"
  const [formName, setFormName] = useState('');
  const [formMatchType, setFormMatchType] = useState('Americano');
  const [formDate, setFormDate] = useState('Sept 1, 2026 • 11:00 AM');
  const [formCourts, setFormCourts] = useState(1);
  const [formScoringType, setFormScoringType] = useState('Point Scoring');
  const [formPoints, setFormPoints] = useState('21 Points');
  const [playerInput, setPlayerInput] = useState('');
  const [playersList, setPlayersList] = useState(['Thendri', 'Budi', 'Andi', 'Siti', 'Rian', 'Eka', 'Deni', 'Fani']);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Profile Data
  const [userProfile] = useState({
    name: 'Thendri',
    role: 'Padel Community Organizer',
    tournamentsCreated: 14,
    matchesOrganized: 56,
    coins: 10
  });

  // Load Tournaments from Supabase or Local Fallback
  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    if (supabase) {
      const { data, error } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setTournaments(data);
        return;
      }
    }
  };

  // Realtime Subscription Setup
  useEffect(() => {
    if (supabase && activeTournament) {
      const channel = supabase
        .channel('realtime_matches')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${activeTournament.id}` }, (payload) => {
          fetchMatchesAndStandings(activeTournament.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeTournament]);

  const fetchMatchesAndStandings = async (tournamentId) => {
    if (!supabase) return;
    
    // Fetch Matches
    const { data: matchesData } = await supabase.from('matches').select('*').eq('tournament_id', tournamentId);
    if (matchesData) {
      const grouped = {};
      matchesData.forEach(m => {
        if (!grouped[m.round_number]) grouped[m.round_number] = [];
        grouped[m.round_number].push({
          id: m.id,
          courtName: `Court ${m.court_number}`,
          badge: m.badge || 'OPEN',
          badgeColor: m.badge === 'MIX' ? '#ec4899' : '#2563eb',
          team1: { name1: m.team_a[0], name2: m.team_a[1], avatar1: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.team_a[0]}`, avatar2: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.team_a[1]}` },
          team2: { name1: m.team_b[0], name2: m.team_b[1], avatar1: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.team_b[0]}`, avatar2: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.team_b[1]}` },
          score1: m.score_a === 0 && !m.is_completed ? '' : m.score_a.toString(),
          score2: m.score_b === 0 && !m.is_completed ? '' : m.score_b.toString(),
          submitted: m.is_completed
        });
      });
      setRoundsMatches(grouped);
    }

    // Fetch Players / Standings
    const { data: playersData } = await supabase.from('players').select('*').eq('tournament_id', tournamentId).order('points_for', { ascending: false });
    if (playersData) {
      const formattedStandings = playersData.map((p, idx) => ({
        pos: idx + 1,
        id: p.id,
        name: p.name,
        w: p.wins,
        l: p.matches_played - p.wins,
        pts: p.points_for,
        diff: (p.points_for - p.points_against) > 0 ? `+${p.points_for - p.points_against}` : `${p.points_for - p.points_against}`
      }));
      setStandings(formattedStandings);
    }
  };

  // Add & Remove Players
  const handleAddPlayer = () => {
    if (playerInput.trim() !== '') {
      setPlayersList([...playersList, playerInput.trim()]);
      setPlayerInput('');
    }
  };

  const handleRemovePlayer = (index) => {
    setPlayersList(playersList.filter((_, i) => i !== index));
  };

  // ALGORITMA MATEMATIK AMERICANO & MEXICANO GENERATOR
  const handleCreateTournamentSubmit = async (e) => {
    e.preventDefault();
    if (playersList.length < 4) {
      alert("Masukkan minimal 4 pemain!");
      return;
    }

    const tName = formName.trim() || 'New Tournament';
    const totalRoundsCount = 4;
    const targetPts = parseInt(formPoints) || 21;

    let createdTourneyId = `t-${Date.now()}`;

    // 1. Simpan ke Supabase jika terhubung
    if (supabase) {
      const { data: tourneyData, error } = await supabase.from('tournaments').insert([{
        name: tName,
        match_type: formMatchType,
        target_points: targetPts,
        court_count: formCourts
      }]).select().single();

      if (!error && tourneyData) {
        createdTourneyId = tourneyData.id;

        // Insert Players
        const playerInserts = playersList.map(name => ({
          tournament_id: createdTourneyId,
          name,
          matches_played: 0,
          wins: 0,
          points_for: 0,
          points_against: 0
        }));
        await supabase.from('players').insert(playerInserts);
      }
    }

    // 2. Build Rounds Engine
    const generatedRounds = {};
    const matchInsertsSupabase = [];

    for (let r = 1; r <= totalRoundsCount; r++) {
      const shuffled = [...playersList].sort(() => Math.random() - 0.5);
      const courtMatches = [];

      for (let c = 0; c < formCourts; c++) {
        const offset = c * 4;
        if (offset + 3 < shuffled.length) {
          const t1 = [shuffled[offset], shuffled[offset + 1]];
          const t2 = [shuffled[offset + 2], shuffled[offset + 3]];

          courtMatches.push({
            id: `r${r}-c${c + 1}`,
            courtName: `Court ${c + 1}`,
            badge: formMatchType.toUpperCase().includes('MIX') ? 'MIX' : 'OPEN',
            badgeColor: formMatchType.toUpperCase().includes('MIX') ? '#ec4899' : '#2563eb',
            team1: { name1: t1[0], name2: t1[1], avatar1: `https://api.dicebear.com/7.x/avataaars/svg?seed=${t1[0]}`, avatar2: `https://api.dicebear.com/7.x/avataaars/svg?seed=${t1[1]}` },
            team2: { name1: t2[0], name2: t2[1], avatar1: `https://api.dicebear.com/7.x/avataaars/svg?seed=${t2[0]}`, avatar2: `https://api.dicebear.com/7.x/avataaars/svg?seed=${t2[1]}` },
            score1: '',
            score2: '',
            submitted: false
          });

          if (supabase) {
            matchInsertsSupabase.push({
              tournament_id: createdTourneyId,
              round_number: r,
              court_number: c + 1,
              badge: formMatchType.toUpperCase().includes('MIX') ? 'MIX' : 'OPEN',
              team_a: t1,
              team_b: t2,
              score_a: 0,
              score_b: 0,
              is_completed: false
            });
          }
        }
      }
      generatedRounds[r] = courtMatches;
    }

    if (supabase && matchInsertsSupabase.length > 0) {
      await supabase.from('matches').insert(matchInsertsSupabase);
    }

    const newTourneyObj = {
      id: createdTourneyId,
      name: tName,
      matchType: formMatchType,
      date: formDate,
      courts: formCourts,
      playersCount: playersList.length,
      status: 'Active',
      currentRound: 1,
      totalRounds: totalRoundsCount
    };

    setTournaments([newTourneyObj, ...tournaments]);
    setActiveTournament(newTourneyObj);
    setRoundsMatches(generatedRounds);
    
    // Initial Standings Local Fallback
    const initStandings = playersList.map((name, i) => ({
      pos: i + 1,
      name,
      w: 0,
      l: 0,
      pts: 0,
      diff: '0'
    }));
    setStandings(initStandings);

    setCurrentRound(1);
    setCurrentView('TOURNAMENT_DETAIL');
  };

  // Score Input Change
  const handleScoreChange = (matchId, team, val) => {
    const activeMatches = roundsMatches[currentRound] || [];
    const updated = activeMatches.map(m => m.id === matchId ? { ...m, [team]: val } : m);
    setRoundsMatches({ ...roundsMatches, [currentRound]: updated });
  };

  // Submit Score & Recalculate Standings Realtime
  const handleSubmitScore = async (matchId) => {
    const activeMatches = roundsMatches[currentRound] || [];
    const match = activeMatches.find(m => m.id === matchId);

    if (!match || match.score1 === '' || match.score2 === '') {
      alert("Masukkan skor kedua tim terlebih dahulu!");
      return;
    }

    const s1 = parseInt(match.score1) || 0;
    const s2 = parseInt(match.score2) || 0;

    // Local State Lock
    const updatedMatches = activeMatches.map(m => m.id === matchId ? { ...m, submitted: true } : m);
    setRoundsMatches({ ...roundsMatches, [currentRound]: updatedMatches });

    // Sync to Supabase Database
    if (supabase && activeTournament) {
      await supabase.from('matches').update({
        score_a: s1,
        score_b: s2,
        is_completed: true
      }).eq('id', matchId);
    }

    // Recalculate Standings Local Engine
    const t1P = [match.team1.name1, match.team1.name2];
    const t2P = [match.team2.name1, match.team2.name2];

    setStandings(prev => {
      const updated = prev.map(p => {
        let newP = { ...p };
        if (t1P.includes(p.name)) {
          newP.pts += s1;
          if (s1 > s2) newP.w += 1;
          else if (s2 > s1) newP.l += 1;
        } else if (t2P.includes(p.name)) {
          newP.pts += s2;
          if (s2 > s1) newP.w += 1;
          else if (s1 > s2) newP.l += 1;
        }
        return newP;
      }).sort((a, b) => b.pts - a.pts || b.w - a.w);

      return updated.map((item, index) => ({ ...item, pos: index + 1 }));
    });

    const logEntry = `Round ${currentRound} (${match.courtName}): ${t1P.join(' & ')} [${s1} - ${s2}] ${t2P.join(' & ')}`;
    setMatchLogs([logEntry, ...matchLogs]);
  };

  return (
    <div style={{ backgroundColor: '#f3f4f6', color: '#1f2937', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', paddingBottom: '75px' }}>
      
      {/* 1. TOP NAVBAR */}
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

      {/* 2. SCREEN 1: HOME */}
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
                  onClick={() => { setActiveTournament(t); fetchMatchesAndStandings(t.id); setCurrentView('TOURNAMENT_DETAIL'); }}
                  style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#111827' }}>{t.name}</h2>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{t.match_type || t.matchType} • {t.court_count || t.courts} Courts • {t.playersCount || 8} Players</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 0' }}>📅 {t.date || 'Sept 1, 2026'}</p>
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
                      { title: 'Team Mexicano', desc: 'Fixed teams. Balanced matchups each round.' }
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>Number of Courts</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" onClick={() => setFormCourts(Math.max(1, formCourts - 1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>-</button>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{formCourts}</span>
                  <button type="button" onClick={() => setFormCourts(formCourts + 1)} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>+</button>
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
                  Add Players ({playersList.length})
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input 
                    type="text"
                    placeholder="Type a name..."
                    value={playerInput}
                    onChange={(e) => setPlayerInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPlayer())}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none' }}
                  />
                  <button type="button" onClick={handleAddPlayer} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>👤+</button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', backgroundColor: '#f9fafb', padding: '10px', borderRadius: '8px', border: '1px solid #f3f4f6', minHeight: '40px' }}>
                  {playersList.map((p, i) => (
                    <span key={i} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {p}
                      <span onClick={() => handleRemovePlayer(i)} style={{ cursor: 'pointer', fontWeight: 'bold', color: '#93c5fd' }}>×</span>
                    </span>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', fontSize: '15px', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                + Create Tournament
              </button>

            </form>
          </div>
        </div>
      )}

      {/* 4. SCREEN 3: ACTIVE TOURNAMENT DETAIL */}
      {currentView === 'TOURNAMENT_DETAIL' && activeTournament && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px' }}>
          
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#111827' }}>{activeTournament.name}</h2>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{activeTournament.match_type || activeTournament.matchType} • {activeTournament.court_count || activeTournament.courts} Courts</p>
              </div>
              <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                Round {currentRound} of {activeTournament.totalRounds || 4}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', backgroundColor: '#f9fafb', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
              <button disabled={currentRound === 1} onClick={() => setCurrentRound(currentRound - 1)} style={{ border: 'none', background: 'transparent', color: currentRound === 1 ? '#9ca3af' : '#2563eb', fontWeight: 'bold', fontSize: '12px', cursor: currentRound === 1 ? 'default' : 'pointer' }}>◀ Prev</button>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>ROUND {currentRound}</span>
              <button disabled={currentRound === (activeTournament.totalRounds || 4)} onClick={() => setCurrentRound(currentRound + 1)} style={{ border: 'none', background: 'transparent', color: currentRound === (activeTournament.totalRounds || 4) ? '#9ca3af' : '#2563eb', fontWeight: 'bold', fontSize: '12px', cursor: currentRound === (activeTournament.totalRounds || 4) ? 'default' : 'pointer' }}>Next ▶</button>
            </div>
          </div>

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

          {detailTab === 'MATCHES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(roundsMatches[currentRound] || []).map(m => (
                <div key={m.id} style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: m.submitted ? '1px solid #2563eb' : '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#111827' }}>{m.courtName}</span>
                    <span style={{ backgroundColor: m.badgeColor, color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>{m.badge}</span>
                  </div>

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
                    <th style={{ padding: '8px', textAlign: 'center' }}>W-L</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>DIFF</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold', color: idx === 0 ? '#2563eb' : '#6b7280' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#111827' }}>{s.name}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#4b5563' }}>{s.w}-{s.l}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#16a34a', fontWeight: '500' }}>{s.diff}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#2563eb' }}>{s.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'LOGS' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', marginTop: 0, marginBottom: '12px' }}>Realtime Activity Logs</h3>
              {matchLogs.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, textAlign: 'center' }}>Log skor akan tercatat otomatis dari Supabase.</p>
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

      {/* 5. SCREEN 4: USER PROFILE */}
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
        </div>
      )}

      {/* 6. BOTTOM NAVIGATION */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb', padding: '8px 0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 50, boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
        <button onClick={() => setCurrentView('HOME')} style={{ backgroundColor: 'transparent', border: 'none', color: currentView === 'HOME' ? '#2563eb' : '#6b7280', fontSize: '11px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span>🏠</span> <span>Home</span>
        </button>
        <button onClick={() => setCurrentView('CREATE')} style={{ backgroundColor: '#2563eb', border: 'none', color: '#ffffff', width: '44px', height: '44px', borderRadius: '50%', fontWeight: 'bold', fontSize: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', marginTop: '-16px', boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}>
          +
        </button>
        <button onClick={() => setCurrentView('PROFILE')} style={{ backgroundColor: 'transparent', border: 'none', color: currentView === 'PROFILE' ? '#2563eb' : '#6b7280', fontSize: '11px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span>👤</span> <span>Profile</span>
        </button>
      </div>

    </div>
  );
}
