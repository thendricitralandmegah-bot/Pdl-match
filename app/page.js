'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Filter,
  Gauge,
  MapPin,
  Plus,
  Settings,
  Sparkles,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const imageSet = {
  mark: '/pdlup-mark.webp',
  hero: '/pdlup-hero-court.webp',
  rally: '/pdlup-rally-detail.webp',
  clubhouse: '/pdlup-clubhouse.webp',
};

const filterOptions = ['All', 'Active', 'Past'];
const starterTournaments = [
  {
    id: 'starter-1',
    name: 'Friday Night Rally',
    date: 'Fri, 06 Sep',
    time: '19:00 – 21:00',
    location: 'Padel Haus Kemang',
    players: 12,
    maxPlayers: 16,
    level: 'Intermediate',
    status: 'Active',
    featured: true,
    image: imageSet.hero,
    host: 'Raka Pratama',
    rounds: '04 rounds',
  },
  {
    id: 'starter-2',
    name: 'Sunday Social Club',
    date: 'Sun, 08 Sep',
    time: '09:00 – 11:00',
    location: 'The Padel Court BSD',
    players: 8,
    maxPlayers: 12,
    level: 'Beginner friendly',
    status: 'Active',
    image: imageSet.clubhouse,
    host: 'Nadia Sari',
    rounds: '03 rounds',
  },
  {
    id: 'starter-3',
    name: 'Afterwork Americano',
    date: 'Thu, 29 Aug',
    time: '18:30 – 20:30',
    location: 'Urban Padel Senopati',
    players: 16,
    maxPlayers: 16,
    level: 'Intermediate',
    status: 'Past',
    image: imageSet.rally,
    host: 'Bagas Wibowo',
    rounds: '05 rounds',
  },
];

function formatDate(value) {
  if (!value) return 'Date to be confirmed';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', day: '2-digit', month: 'short' }).format(date);
}

function formatTime(value) {
  if (!value) return 'Time to be confirmed';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time to be confirmed';
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function normalizeTournament(row, index = 0) {
  const isPast = /completed|past|cancelled/i.test(row.status || '');
  const maxPlayers = Number(row.max_players ?? row.players_count ?? 16) || 16;
  const players = Number(row.players_count ?? row.players ?? 0) || 0;
  return {
    id: row.id,
    name: row.name || 'Untitled tournament',
    date: formatDate(row.scheduled_at || row.created_at),
    time: formatTime(row.scheduled_at || row.created_at),
    location: row.location || 'Club location to be confirmed',
    players,
    maxPlayers,
    level: row.level || row.format || row.match_type || 'Intermediate',
    status: isPast ? 'Past' : 'Active',
    image: [imageSet.hero, imageSet.clubhouse, imageSet.rally][index % 3],
    host: 'You',
    rounds: `${String(row.total_rounds || 4).padStart(2, '0')} rounds`,
  };
}

function StatusPill({ status }) {
  return (
    <span className={`status-pill ${status === 'Active' ? 'status-active' : 'status-past'}`}>
      <span className={`status-dot ${status === 'Active' ? 'dot-active' : 'dot-past'}`} />
      {status}
    </span>
  );
}

function MetaItem({ icon: Icon, children }) {
  return <span className="meta-item"><Icon className="meta-icon" strokeWidth={2.2} />{children}</span>;
}

function TournamentCard({ tournament, position, total, onOpen }) {
  const spots = Math.max(0, tournament.maxPlayers - tournament.players);
  return (
    <button type="button" onClick={onOpen} className={`tournament-card ${tournament.featured ? 'tournament-featured' : ''}`}>
      <div className={`tournament-image ${tournament.featured ? '' : 'tournament-image-muted'}`}>
        <img src={tournament.image} alt="" />
        <div className={`tournament-overlay ${tournament.featured ? 'overlay-dark' : 'overlay-light'}`} />
      </div>
      <div className={`tournament-card-content ${tournament.featured ? 'card-content-light' : 'card-content-dark'}`}>
        <div className="card-topline"><StatusPill status={tournament.status} /><span className="card-index">{String(position).padStart(2, '0')} / {String(total).padStart(2, '0')}</span></div>
        <div className="card-main">
          <div className="card-level">{tournament.level}</div>
          <h3>{tournament.name}</h3>
          <div className="meta-row"><MetaItem icon={CalendarDays}>{tournament.date}</MetaItem><MetaItem icon={Clock3}>{tournament.time}</MetaItem><MetaItem icon={MapPin}>{tournament.location}</MetaItem></div>
        </div>
        <div className="card-footer">
          <div><div className="footer-label">Players joined</div><div className="player-count"><strong>{tournament.players}</strong><span>/ {tournament.maxPlayers}</span>{spots > 0 && <em>{spots} spots left</em>}</div></div>
          <span className="round-arrow"><ArrowUpRight className="h-4" /></span>
        </div>
      </div>
    </button>
  );
}

function CreateTournamentModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('2026-09-13');
  const [time, setTime] = useState('19:00');
  const [location, setLocation] = useState('Padel Haus Kemang');
  const [level, setLevel] = useState('Intermediate');
  const [maxPlayers, setMaxPlayers] = useState('16');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const created = await onCreate({
      id: `local-${Date.now()}`,
      name: name.trim(),
      date: new Intl.DateTimeFormat('en-US', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(`${date}T12:00:00`)),
      time,
      location,
      players: 1,
      maxPlayers: Number(maxPlayers),
      level,
      status: 'Active',
      image: imageSet.rally,
      host: 'You',
      rounds: '04 rounds',
      scheduledAt: `${date}T${time}:00`,
    });
    setSaving(false);
    if (created) onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="create-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading"><div><div className="court-kicker">Build the next match</div><h2>Create tournament</h2><p>Set the basics. We’ll keep the roster and rounds easy to manage.</p></div><button type="button" onClick={onClose} className="close-button" aria-label="Close dialog"><X /></button></div>
        <form onSubmit={submit} className="create-form">
          <label><span>Tournament name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Saturday Rally Club" autoFocus /></label>
          <div className="form-two-col"><label><span>Date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label><span>Start time</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label></div>
          <label><span>Club / location</span><input value={location} onChange={(event) => setLocation(event.target.value)} /></label>
          <div className="form-two-col"><label><span>Player level</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option>Beginner friendly</option><option>Intermediate</option><option>Advanced</option></select></label><label><span>Max players</span><select value={maxPlayers} onChange={(event) => setMaxPlayers(event.target.value)}><option value="8">8 players</option><option value="12">12 players</option><option value="16">16 players</option><option value="20">20 players</option></select></label></div>
          <button type="submit" className="primary-action" disabled={saving}><Plus />{saving ? 'Saving tournament…' : 'Create tournament'}</button>
        </form>
      </div>
    </div>
  );
}

function TournamentDetail({ tournament, onClose, onInvite }) {
  const progress = `${Math.min(100, (tournament.players / tournament.maxPlayers) * 100)}%`;
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="detail-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="detail-cover"><img src={tournament.image} alt="" /><div className="detail-cover-gradient" /><button type="button" onClick={onClose} className="detail-close" aria-label="Close details"><X /></button><div className="detail-status"><StatusPill status={tournament.status} /></div></div>
        <div className="detail-body"><div className="detail-heading"><div><div className="court-kicker">Tournament details</div><h2>{tournament.name}</h2></div><button type="button" onClick={onInvite} className="invite-action"><Users /> Invite players</button></div><div className="detail-meta"><MetaItem icon={CalendarDays}>{tournament.date}</MetaItem><MetaItem icon={Clock3}>{tournament.time}</MetaItem><MetaItem icon={MapPin}>{tournament.location}</MetaItem></div><div className="roster-progress"><div className="progress-top"><span>Roster progress</span><strong>{tournament.players} / {tournament.maxPlayers}</strong></div><div className="progress-track"><div style={{ width: progress }} /></div><p>{tournament.maxPlayers - tournament.players > 0 ? `${tournament.maxPlayers - tournament.players} places still open for this session.` : 'The roster is full. Time to get your rackets ready.'}</p></div><div className="detail-footer"><span>Hosted by <strong>{tournament.host}</strong></span><span>{tournament.rounds}</span></div></div>
      </div>
    </div>
  );
}

function ProfilePanel({ session, authMode, setAuthMode, email, setEmail, password, setPassword, message, onSubmit, onSignOut }) {
  if (session) {
    return <section className="profile-panel"><div className="profile-mark"><img src={imageSet.mark} alt="PD-Match Dadakan" /></div><div className="court-kicker">Your player profile</div><h2>You’re in.</h2><p className="profile-email">{session.user.email}</p><div className="profile-stat-row"><div><strong>04</strong><span>Matches</span></div><div><strong>01</strong><span>Groups</span></div><div><strong>94%</strong><span>Balance</span></div></div><button type="button" className="secondary-action full-width" onClick={onSignOut}>Sign out</button></section>;
  }
  return <section className="profile-panel auth-panel"><div className="court-kicker">Your next rally starts here</div><h2>{authMode === 'signup' ? 'Create your account' : 'Sign in to PD-Match Dadakan'}</h2><p>Save tournaments, rosters, and match scores across devices.</p><form onSubmit={onSubmit} className="auth-form"><label><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label><label><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} /></label><button type="submit" className="primary-action">{authMode === 'signup' ? 'Create account' : 'Sign in'}</button>{message && <div className="auth-message">{message}</div>}</form><button type="button" className="text-action" onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}>{authMode === 'signup' ? 'Already have an account? Sign in' : 'New to PD-Match Dadakan? Create an account'}</button></section>;
}

export default function Home() {
  const [filter, setFilter] = useState('All');
  const [tournaments, setTournaments] = useState(starterTournaments);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [authMode, setAuthMode] = useState('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session || !supabase) {
      setTournaments(starterTournaments);
      return undefined;
    }
    let cancelled = false;
    const loadTournaments = async () => {
      const { data, error } = await supabase.from('tournaments').select('*').eq('owner_id', session.user.id).order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        setDataError(error.message);
        return;
      }
      setDataError('');
      setTournaments((data || []).map((row, index) => normalizeTournament(row, index)));
    };
    loadTournaments();
    return () => { cancelled = true; };
  }, [session]);

  const visibleTournaments = useMemo(() => filter === 'All' ? tournaments : tournaments.filter((tournament) => tournament.status === filter), [filter, tournaments]);
  const activeCount = tournaments.filter((tournament) => tournament.status === 'Active').length;
  const joinedCount = tournaments.reduce((sum, tournament) => sum + tournament.players, 0);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthMessage('');
    if (!supabase) {
      setAuthMessage('Supabase is not configured on this deployment yet.');
      return;
    }
    const result = authMode === 'signup'
      ? await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { display_name: authEmail.split('@')[0] } } })
      : await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (result.error) {
      setAuthMessage(result.error.message);
      return;
    }
    if (result.data.session) {
      setSession(result.data.session);
      setAuthMessage('Login berhasil.');
      showNotice('You are back in the rotation.');
    } else {
      setAuthMessage('Akun dibuat. Cek email Anda untuk verifikasi.');
    }
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setAuthMessage('');
    showNotice('Signed out safely.');
  };

  const handleCreate = async (tournament) => {
    if (!supabase || !session) {
      setTournaments((current) => [tournament, ...current]);
      showNotice('Tournament created locally. Sign in to sync it across devices.');
      return true;
    }
    const slugBase = tournament.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'tournament';
    const { data, error } = await supabase.from('tournaments').insert({
      owner_id: session.user.id,
      name: tournament.name,
      format: tournament.level,
      court_count: 1,
      match_type: 'Americano',
      target_points: 21,
      total_rounds: 4,
      share_slug: `${slugBase}-${Date.now()}`,
      status: 'Active',
    }).select().single();
    if (error) {
      setDataError(error.message);
      showNotice('Could not save tournament. Check the Supabase policy.');
      return false;
    }
    const saved = { ...tournament, id: data.id };
    setTournaments((current) => [saved, ...current]);
    showNotice('Tournament created and synced.');
    return true;
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-orbit orbit-one" /><div className="header-orbit orbit-two" />
        <div className="container header-inner"><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="brand-button"><span className="brand-mark"><img src={imageSet.mark} alt="PD-Match Dadakan" /></span><span><strong>PD-Match Dadakan</strong><small>Spontaneous padel club</small></span></button><div className="header-actions">{authLoading ? <span className="session-check">Checking session…</span> : session ? <button type="button" onClick={() => showNotice('Tap Profile below to manage your account.')} className="account-button">{session.user.email}</button> : <button type="button" onClick={() => { setAuthMessage(''); setAuthMode('signin'); document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' }); }} className="header-signin">Sign in</button>}<button type="button" onClick={() => showNotice('Settings are queued for the next rally.')} className="settings-button" aria-label="Settings"><Settings /></button></div></div>
        <div className="container hero-content"><div className="hero-grid"><div className="hero-copy reveal-up"><div className="welcome-label"><span /> Welcome back</div><h1>Your next<br className="desktop-break" /> rally starts here<span>.</span></h1><p>Create balanced matches, track scores, and keep the group moving.</p><div className="hero-actions"><button type="button" onClick={() => setShowCreate(true)} className="hero-primary"><Plus /> Create tournament</button><button type="button" onClick={() => document.getElementById('tournaments')?.scrollIntoView({ behavior: 'smooth' })} className="hero-secondary">Browse matches <ArrowUpRight /></button></div></div><div className="hero-visual reveal-up reveal-delay-2"><div className="hero-photo"><img src={imageSet.hero} alt="Players on a padel court" /><div /></div><div className="community-pulse"><span><Zap /></span><span><small>Community pulse</small><strong>{joinedCount} players in rotation</strong></span></div></div></div></div>
      </header>

      <main className="container main-content">
        <section className="stats-grid reveal-up reveal-delay-1"><div className="stat-card"><div><span>Active tournaments</span><Trophy /></div><strong>{activeCount}</strong><p>Open for your next session</p></div><div className="stat-card"><div><span>Players in rotation</span><Users /></div><strong>{joinedCount}</strong><p>Across your current groups</p></div><div className="stat-card stat-card-lime"><div><span>Match balance</span><Gauge /></div><strong>94<small>%</small></strong><p>Average group satisfaction</p></div></section>
        <section id="tournaments" className="tournaments-section"><div className="section-heading"><div><div className="court-kicker">Your playbook</div><h2>Tournaments in your orbit<span>.</span></h2></div><div className="filter-group"><span>Filter by</span><div className="filter-control"><Filter />{filterOptions.map((option) => <button type="button" key={option} onClick={() => setFilter(option)} className={filter === option ? 'filter-selected' : ''}>{option}</button>)}</div></div></div><div className="tournament-grid">{visibleTournaments.map((tournament, index) => <div key={tournament.id} className={`reveal-up ${index === 1 ? 'reveal-delay-1' : index === 2 ? 'reveal-delay-2' : ''}`}><TournamentCard tournament={tournament} position={index + 1} total={visibleTournaments.length} onOpen={() => setSelectedTournament(tournament)} /></div>)}</div>{visibleTournaments.length === 0 && <div className="empty-state"><Sparkles /><h3>No matches in this lane yet.</h3><p>Create a tournament and give your group a reason to pick up their rackets.</p><button type="button" onClick={() => setShowCreate(true)} className="primary-action inline-action"><Plus /> Create one</button></div>}</section>
        <section className="ritual-section"><div><div className="court-kicker">Small rituals, better rallies</div><h2>A better match starts before the first serve<span>.</span></h2><p>PD-Match Dadakan keeps the boring parts moving in the background, so your group can focus on showing up and playing well.</p><button type="button" onClick={() => showNotice('Match insights are queued for the next rally.')} className="link-action">See how it works <ChevronRight /></button></div><div className="signal-card"><div className="signal-inner"><div className="signal-top"><span><Zap /></span><div><small>Your group signal</small><strong>4 players are ready to rally this week.</strong></div></div><div className="signal-bottom"><div><strong>02:14</strong><span>Average time to fill a match</span></div><em>On track</em></div></div></div></section>
        <section id="profile" className="profile-section"><ProfilePanel session={session} authMode={authMode} setAuthMode={setAuthMode} email={authEmail} setEmail={setAuthEmail} password={authPassword} setPassword={setAuthPassword} message={authMessage} onSubmit={handleAuthSubmit} onSignOut={handleSignOut} /></section>
        {dataError && <div className="error-banner">Supabase: {dataError}</div>}
      </main>

      <nav className="bottom-nav"><div className="container bottom-nav-inner"><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="nav-item nav-active"><span><Zap /></span><small>Home</small></button><button type="button" onClick={() => setShowCreate(true)} className="create-fab" aria-label="Create tournament"><Plus /></button><button type="button" onClick={() => document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' })} className="nav-item"><span><CircleUserRound /></span><small>Profile</small></button></div></nav>
      {showCreate && <CreateTournamentModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {selectedTournament && <TournamentDetail tournament={selectedTournament} onClose={() => setSelectedTournament(null)} onInvite={() => showNotice('Invite link copied to clipboard.')} />}
      {notice && <div className="toast-notice"><Check /> {notice}</div>}
    </div>
  );
}
