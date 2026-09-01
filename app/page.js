'use client';
import { useState } from 'react';

export default function PDLUPMatchApp() {
  const [activeTab, setActiveTab] = useState('MATCHES');
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = 5;

  // Data Lapangan & Match (Persis seperti screenshot PDLUP Anda)
  const [matches, setMatches] = useState([
    {
      id: 'c1',
      courtName: 'Court 1',
      badge: 'MIX',
      badgeColor: '#ec4899', // Pink
      team1: {
        player1: { name: 'Thendri', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thendri' },
        player2: { name: 'Siti', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti' }
      },
      team2: {
        player1: { name: 'Budi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi' },
        player2: { name: 'Eka', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eka' }
      },
      score1: '',
      score2: '',
      submitted: false
    },
    {
      id: 'c2',
      courtName: 'Court 2',
      badge: 'MIX',
      badgeColor: '#ec4899',
      team1: {
        player1: { name: 'Andi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andi' },
        player2: { name: 'Fani', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fani' }
      },
      team2: {
        player1: { name: 'Rian', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rian' },
        player2: { name: 'Deni', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deni' }
      },
      score1: '',
      score2: '',
      submitted: false
    }
  ]);

  // Klasemen Standings
  const [standings, setStandings] = useState([
    { rank: 1, name: 'Thendri', matches: 1, points: 21, diff: '+9' },
    { rank: 2, name: 'Siti', matches: 1, points: 21, diff: '+9' },
    { rank: 3, name: 'Budi', matches: 1, points: 12, diff: '-9' },
    { rank: 4, name: 'Eka', matches: 1, points: 12, diff: '-9' },
  ]);

  const handleScoreChange = (id, team, value) => {
    setMatches(matches.map(m => {
      if (m.id === id) {
        return { ...m, [team]: value };
      }
      return m;
    }));
  };

  const handleSubmitScore = (id) => {
    setMatches(matches.map(m => {
      if (m.id === id) {
        return { ...m, submitted: true };
      }
      return m;
    }));
  };

  return (
    <div style={{ backgroundColor: '#0b0f17', color: '#f3f4f6', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', paddingBottom: '80px' }}>
      
      {/* 1. Top Bar Header */}
      <div style={{ backgroundColor: '#111827', borderBottom: '1px solid #1f2937', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ backgroundColor: '#ccff00', color: '#000', fontWeight: '900', fontSize: '18px', padding: '4px 10px', borderRadius: '6px', letterSpacing: '1px' }}>
            PDLUP
          </div>
          <span style={{ fontSize: '12px', color: '#ccff00', backgroundColor: 'rgba(204,255,0,0.1)', border: '1px solid #ccff00', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
            🪙 10
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button style={{ backgroundColor: '#ccff00', color: '#000', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>SHARE LINK 🔗</button>
          <button style={{ backgroundColor: '#1f2937', color: '#9ca3af', border: '1px solid #374151', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>INFO</button>
          <button style={{ backgroundColor: '#1f2937', color: '#9ca3af', border: '1px solid #374151', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>RESULTS</button>
        </div>
      </div>

      {/* 2. Sub-Header Event Details */}
      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#fff' }}>PD-Kan Mix Match Vol. 7</h1>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>Mix Americano • Golden Padel Batam</p>
            </div>
            <span style={{ backgroundColor: '#ccff00', color: '#000', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px' }}>
              Round {currentRound} of {totalRounds}
            </span>
          </div>

          {/* Round Selector Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', backgroundColor: '#0b0f17', padding: '8px 12px', borderRadius: '8px' }}>
            <button 
              disabled={currentRound === 1}
              onClick={() => setCurrentRound(currentRound - 1)}
              style={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', opacity: currentRound === 1 ? 0.4 : 1 }}>
              ◀ Prev
            </button>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ccff00' }}>ROUND {currentRound}</span>
            <button 
              disabled={currentRound === totalRounds}
              onClick={() => setCurrentRound(currentRound + 1)}
              style={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', opacity: currentRound === totalRounds ? 0.4 : 1 }}>
              Next ▶
            </button>
          </div>
        </div>

        {/* 3. Main Navigation Tabs */}
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
            {matches.map(match => (
              <div key={match.id} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '16px', position: 'relative' }}>
                
                {/* Court Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>{match.courtName}</span>
                  <span style={{ backgroundColor: match.badgeColor, color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                    {match.badge}
                  </span>
                </div>

                {/* Team 1 Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0b0f17', padding: '10px 12px', borderRadius: '10px', marginBottom: '8px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', marginRigt: '4px' }}>
                      <img src={match.team1.player1.avatar} alt="p1" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #ccff00' }} />
                      <img src={match.team1.player2.avatar} alt="p2" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #ccff00', marginLeft: '-10px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{match.team1.player1.name}</div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#9ca3af' }}>{match.team1.player2.name}</div>
                    </div>
                  </div>
                  <input 
                    type="number"
                    value={match.score1}
                    disabled={match.submitted}
                    onChange={(e) => handleScoreChange(match.id, 'score1', e.target.value)}
                    placeholder="0"
                    style={{ width: '48px', height: '48px', backgroundColor: '#111827', border: '1px solid #ccff00', borderRadius: '8px', color: '#ccff00', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}
                  />
                </div>

                <div style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280', fontWeight: 'bold', margin: '4px 0' }}>VS</div>

                {/* Team 2 Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0b0f17', padding: '10px 12px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', marginRigt: '4px' }}>
                      <img src={match.team2.player1.avatar} alt="p3" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #3b82f6' }} />
                      <img src={match.team2.player2.avatar} alt="p4" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #3b82f6', marginLeft: '-10px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{match.team2.player1.name}</div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#9ca3af' }}>{match.team2.player2.name}</div>
                    </div>
                  </div>
                  <input 
                    type="number"
                    value={match.score2}
                    disabled={match.submitted}
                    onChange={(e) => handleScoreChange(match.id, 'score2', e.target.value)}
                    placeholder="0"
                    style={{ width: '48px', height: '48px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}
                  />
                </div>

                {/* Submit Button */}
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

        {activeTab === 'STANDINGS' && (
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#ccff00', marginTop: 0, marginBottom: '12px' }}>LEADERBOARD</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937', color: '#9ca3af', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>POS</th>
                  <th style={{ padding: '8px' }}>PLAYER</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>M</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>PTS</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>DIFF</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s) => (
                  <tr key={s.rank} style={{ borderBottom: '1px solid #0b0f17' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 'bold', color: s.rank === 1 ? '#ccff00' : '#9ca3af' }}>#{s.rank}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{s.name}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{s.matches}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#ccff00', fontWeight: 'bold' }}>{s.points}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: s.diff.startsWith('+') ? '#ccff00' : '#ef4444' }}>{s.diff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'LOGS' && (
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
            Aktivitas pembaruan skor dan riwayat match akan tercatat di sini.
          </div>
        )}

      </div>

      {/* 5. Fixed Bottom Navigation Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#111827', borderTop: '1px solid #1f2937', padding: '10px 0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 10 }}>
        <button style={{ backgroundColor: 'transparent', border: 'none', color: '#ccff00', fontSize: '11px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          🏠 <span>HOME</span>
        </button>
        <button style={{ backgroundColor: '#ccff00', border: 'none', color: '#000', width: '40px', height: '40px', borderRadius: '50%', fontWeight: 'bold', fontSize: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', marginTop: '-15px', boxShadow: '0 0 10px rgba(204,255,0,0.4)' }}>
          +
        </button>
        <button style={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af', fontSize: '11px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          🚪 <span>LOGOUT</span>
        </button>
      </div>

    </div>
  );
}
