'use client';
import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('setup');
  const [eventName, setEventName] = useState('PDL-MATCH Session');
  const [format, setFormat] = useState('Americano (21 Poin)');
  const [courts, setCourts] = useState('4 Court (16 Pemain)');
  const [roster, setRoster] = useState('Thendri\nBudi\nAndi\nSiti\nRian\nEka\nDeni\nFani');

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#ffffff', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header / Branding */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f293d', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#a3e635', color: '#000000', fontWeight: '900', fontSize: '20px', padding: '6px 14px', borderRadius: '8px', letterSpacing: '1px' }}>
              PDL
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{eventName}</h1>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>{format} • {courts}</p>
            </div>
          </div>
          <div style={{ backgroundColor: '#111827', border: '1px solid #374151', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', color: '#a3e635', fontWeight: 'bold' }}>
            ● LIVE SESSION
          </div>
        </header>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#111827', padding: '6px', borderRadius: '12px', border: '1px solid #1f293d', marginBottom: '24px', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('setup')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', backgroundColor: activeTab === 'setup' ? '#a3e635' : 'transparent', color: activeTab === 'setup' ? '#000' : '#9ca3af' }}>
            ⚙️ Setup & Reclub
          </button>
          <button 
            onClick={() => setActiveTab('courts')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', backgroundColor: activeTab === 'courts' ? '#a3e635' : 'transparent', color: activeTab === 'courts' ? '#000' : '#9ca3af' }}>
            🎾 Live Courts
          </button>
          <button 
            onClick={() => setActiveTab('standings')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', backgroundColor: activeTab === 'standings' ? '#a3e635' : 'transparent', color: activeTab === 'standings' ? '#000' : '#9ca3af' }}>
            🏆 Standings
          </button>
        </div>

        {/* Content Section */}
        {activeTab === 'setup' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Form Setup */}
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '16px', padding: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#a3e635', marginTop: 0, marginBottom: '16px' }}>01. Pengaturan Pertandingan</h2>
              
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 'bold' }}>NAMA EVENT</label>
                <input 
                  type="text" 
                  value={eventName} 
                  onChange={(e) => setEventName(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 'bold' }}>FORMAT PERMAINAN</label>
                <select 
                  value={format} 
                  onChange={(e) => setFormat(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option>Americano (21 Poin)</option>
                  <option>Mexicano (Sistem Poin Bebas)</option>
                  <option>Fixed Partner Tournament</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 'bold' }}>JUMLAH LAPANGAN</label>
                <select 
                  value={courts} 
                  onChange={(e) => setCourts(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option>1 Court (4 Pemain)</option>
                  <option>2 Court (8 Pemain)</option>
                  <option>3 Court (12 Pemain)</option>
                  <option>4 Court (16 Pemain)</option>
                </select>
              </div>
            </div>

            {/* Roster & Button */}
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#a3e635', marginTop: 0, marginBottom: '16px' }}>02. Import Roster (Reclub)</h2>
                <textarea 
                  rows={6}
                  value={roster}
                  onChange={(e) => setRoster(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '14px', fontFamily: 'monospace', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
              <button style={{ width: '100%', backgroundColor: '#a3e635', color: '#000', fontWeight: 'bold', fontSize: '15px', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', marginTop: '16px' }}>
                Generate Schedule 🚀
              </button>
            </div>
          </div>
        )}

        {activeTab === 'courts' && (
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            🎾 Jadwal pertandingan dan skor lapangan akan diperbarui secara otomatis di sini.
          </div>
        )}

        {activeTab === 'standings' && (
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            🏆 Klasemen pemain (Leaderboard) akan dihitung secara realtime berdasarkan hasil pertandingan.
          </div>
        )}

      </div>
    </div>
  );
}
