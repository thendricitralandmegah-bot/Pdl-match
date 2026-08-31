'use client';
import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('setup');
  const [eventName, setEventName] = useState('PDL-MATCH Session');
  const [format, setFormat] = useState('Americano (21 Poin)');
  const [courts, setCourts] = useState('4 Court (16 Pemain)');
  const [roster, setRoster] = useState('Thendri\nBudi\nAndi\nSiti\nRian\nEka\nDeni\nFani');

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center p-4 md:p-8">
      {/* Header Bar / Brand */}
      <header className="w-full max-w-4xl flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-lime-500 text-black font-black text-xl px-3 py-1 rounded-lg tracking-wider shadow-lg shadow-lime-500/20">
            PDL
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{eventName}</h1>
            <p className="text-xs text-gray-400">{format} • {courts}</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full text-xs text-lime-400 font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span> Live Session
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="w-full max-w-4xl bg-gray-900 p-1.5 rounded-xl border border-gray-800 flex gap-2 mb-6">
        <button 
          onClick={() => setActiveTab('setup')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === 'setup' ? 'bg-lime-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>
          ⚙️ Setup & Reclub
        </button>
        <button 
          onClick={() => setActiveTab('courts')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === 'courts' ? 'bg-lime-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>
          🎾 Live Courts
        </button>
        <button 
          onClick={() => setActiveTab('standings')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === 'standings' ? 'bg-lime-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>
          🏆 Standings
        </button>
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl space-y-6">
        {activeTab === 'setup' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Match Configuration */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-lime-400">01.</span> Pengaturan Pertandingan
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Nama Event</label>
                  <input 
                    type="text" 
                    value={eventName} 
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Format Permainan</label>
                  <select 
                    value={format} 
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime-500">
                    <option>Americano (21 Poin)</option>
                    <option>Mexicano (Sistem Poin Bebas)</option>
                    <option>Fixed Partner Tournament</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Jumlah Lapangan</label>
                  <select 
                    value={courts} 
                    onChange={(e) => setCourts(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime-500">
                    <option>1 Court (4 Pemain)</option>
                    <option>2 Court (8 Pemain)</option>
                    <option>3 Court (12 Pemain)</option>
                    <option>4 Court (16 Pemain)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Roster & Import */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-lime-400">02.</span> Import Roster (Reclub)
                </h2>
                <textarea 
                  rows={6}
                  value={roster}
                  onChange={(e) => setRoster(e.target.value)}
                  placeholder="Paste daftar nama pemain dari Reclub..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-lime-500 font-mono"
                />
              </div>
              <button className="mt-4 w-full bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 rounded-xl transition shadow-lg shadow-lime-500/20 active:scale-95">
                Generate Match Schedule 🚀
              </button>
            </div>
          </div>
        )}

        {activeTab === 'courts' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
            <p className="text-lg">Jadwal pertandingan & input skor lapangan akan tampil di sini.</p>
          </div>
        )}

        {activeTab === 'standings' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
            <p className="text-lg">Klasemen pemain (Leaderboard) akan diperbarui secara real-time.</p>
          </div>
        )}
      </main>
    </div>
}
