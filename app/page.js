'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Compass,
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
    owner_id: row.owner_id || null,
    share_slug: row.share_slug || null,
    name: row.name || 'Untitled tournament',
    date: formatDate(row.scheduled_at || row.created_at),
    time: formatTime(row.scheduled_at || row.created_at),
    location: row.location || 'Club location to be confirmed',
    players,
    maxPlayers,
    level: row.level || row.format || row.match_type || 'Intermediate',
    format: row.match_type || row.format || 'Americano',
    gender: row.gender || 'Any',
    visibility: row.visibility || 'Public',
    status: isPast ? 'Past' : 'Active',
    courtCount: Number(row.court_count ?? 1) || 1,
    totalRounds: Number(row.total_rounds ?? 4) || 4,
    targetPoints: Number(row.target_points ?? 21) || 21,
    scoringType: row.scoring_type || 'Point scoring',
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
          <div className="card-level">{tournament.format || 'Americano'} · {tournament.level}</div>
          <h3>{tournament.name}</h3>
          <div className="meta-row"><MetaItem icon={CalendarDays}>{tournament.date}</MetaItem><MetaItem icon={Clock3}>{tournament.time}</MetaItem><MetaItem icon={MapPin}>{tournament.location}</MetaItem></div>
        </div>
        <div className="card-footer">
          <div><div className="footer-label">Players in session</div><div className="player-count"><strong>{tournament.players}</strong><span>/ {tournament.maxPlayers}</span>{spots > 0 && <em>{spots} spots left</em>}</div></div>
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
  const [format, setFormat] = useState('Americano');
  const [gender, setGender] = useState('Any');
  const [visibility, setVisibility] = useState('Public');
  const [maxPlayers, setMaxPlayers] = useState('16');
  const [courtCount, setCourtCount] = useState('1');
  const [totalRounds, setTotalRounds] = useState('4');
  const [targetPoints, setTargetPoints] = useState('21');
  const [scoringType, setScoringType] = useState('Point scoring');
  const [playerOrder, setPlayerOrder] = useState('Keep as entered');
  const [playerInput, setPlayerInput] = useState('');
  const [playerNames, setPlayerNames] = useState([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const addPlayer = () => {
    const nextName = playerInput.trim();
    if (!nextName || playerNames.length >= Number(maxPlayers) || playerNames.some((player) => player.toLowerCase() === nextName.toLowerCase())) return;
    setPlayerNames((current) => [...current, nextName]);
    setPlayerInput('');
  };

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
      players: playerNames.length || 1,
      playerNames: playerOrder === 'Randomize' ? [...playerNames].sort(() => Math.random() - 0.5) : playerNames,
      maxPlayers: Number(maxPlayers),
      courtCount: Number(courtCount),
      totalRounds: Number(totalRounds),
      targetPoints: Number(targetPoints),
      scoringType,
      format,
      gender,
      visibility,
      level,
      status: 'Active',
      image: imageSet.rally,
      host: 'You',
      rounds: `${String(totalRounds).padStart(2, '0')} rounds`,
      scheduledAt: `${date}T${time}:00`,
    });
    setSaving(false);
    if (created) onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="create-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading"><div><div className="court-kicker">Plan the next session</div><h2>Create session</h2><p>Set the basics, add your players, and preview the rotation before you start.</p></div><button type="button" onClick={onClose} className="close-button" aria-label="Close dialog"><X /></button></div>
        <form onSubmit={submit} className="create-form">
          <label><span>Session name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Saturday Social Rally" autoFocus /></label>
          <div className="form-two-col"><label><span>Date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label><span>Start time</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label></div>
          <label><span>Venue / location</span><input value={location} onChange={(event) => setLocation(event.target.value)} /></label>
          <div className="form-two-col"><label><span>Session format</span><select value={format} onChange={(event) => setFormat(event.target.value)}><option>Americano</option><option>Mexicano</option><option>King of the Hill</option><option>Club</option><option>Bracket</option><option>Group Stage</option><option>Friendly</option><option>Custom</option></select></label><label><span>Player level</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option>Beginner friendly</option><option>Intermediate</option><option>Advanced</option></select></label></div>
          <div className="form-two-col"><label><span>Courts</span><div className="stepper-field"><button type="button" onClick={() => setCourtCount((current) => String(Math.max(1, Number(current) - 1)))} aria-label="Remove court">−</button><strong>{courtCount}</strong><button type="button" onClick={() => setCourtCount((current) => String(Math.min(4, Number(current) + 1)))} aria-label="Add court">+</button></div></label><label><span>Players</span><select value={maxPlayers} onChange={(event) => setMaxPlayers(event.target.value)}><option value="4">4 players</option><option value="8">8 players</option><option value="12">12 players</option><option value="16">16 players</option><option value="20">20 players</option><option value="24">24 players</option></select></label></div>
          <div className="session-section-label">Scoring configuration</div>
          <div className="form-two-col"><label><span>Scoring type</span><select value={scoringType} onChange={(event) => setScoringType(event.target.value)}><option>Point scoring</option><option>Normal scoring</option><option>Games & sets</option></select></label><label><span>Points per match</span><select value={targetPoints} onChange={(event) => setTargetPoints(event.target.value)}><option value="16">16 points</option><option value="21">21 points</option><option value="24">24 points</option><option value="32">32 points</option><option value="0">Undefined</option></select></label></div>
          <div className="session-section-label player-entry-heading"><span>Add players</span><strong>{playerNames.length} added</strong></div>
          <div className="player-entry-row"><input value={playerInput} onChange={(event) => setPlayerInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addPlayer(); } }} placeholder="Type a name or username" /><button type="button" onClick={addPlayer} className="secondary-action"><Plus /> Add</button></div>
          {playerNames.length > 0 && <div className="session-player-list">{playerNames.map((player, index) => <div className="session-player-row" key={`${player}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{player}</strong><button type="button" onClick={() => setPlayerNames((current) => current.filter((_, playerIndex) => playerIndex !== index))} aria-label={`Remove ${player}`}><X /></button></div>)}</div>}
          <button type="button" className="advanced-toggle" onClick={() => setAdvancedOpen((current) => !current)}><span>Advanced settings</span><ChevronRight className={advancedOpen ? 'rotate-chevron' : ''} /></button>
          {advancedOpen && <div className="advanced-settings"><label><span>Player order</span><select value={playerOrder} onChange={(event) => setPlayerOrder(event.target.value)}><option>Keep as entered</option><option>Randomize</option></select></label><label><span>Visibility</span><select value={visibility} onChange={(event) => setVisibility(event.target.value)}><option>Public</option><option>Private</option><option>Invite only</option></select></label><label><span>Gender</span><select value={gender} onChange={(event) => setGender(event.target.value)}><option>Any</option><option>Male</option><option>Female</option><option>Mixed</option></select></label></div>}
          <div className="session-simulation"><div><span>Session simulation</span><strong>~{Math.max(1, Number(totalRounds) || 1)} rounds · {courtCount} court{Number(courtCount) === 1 ? '' : 's'}</strong></div><small>{Math.max(0, Number(maxPlayers) - (Number(courtCount) * 4))} resting slot{Math.max(0, Number(maxPlayers) - (Number(courtCount) * 4)) === 1 ? '' : 's'} per round · {format}</small></div>
          <button type="submit" className="primary-action" disabled={saving || !name.trim()}><Plus />{saving ? 'Saving session…' : 'Create session'}</button>
        </form>
      </div>
    </div>
  );
}

function getTeamNames(team) {
  return Array.isArray(team) ? team.map((player) => typeof player === 'string' ? player : player?.name).filter(Boolean) : [];
}

function getPlayerId(player) {
  return typeof player === 'string' ? player : player?.id;
}

function isPlaceholderMatch(match) {
  const teamA = Array.isArray(match?.team_a) ? match.team_a.filter(Boolean) : [];
  const teamB = Array.isArray(match?.team_b) ? match.team_b.filter(Boolean) : [];
  return teamA.length === 0 && teamB.length === 0;
}

function pairKey(first, second) {
  return [first, second].sort().join('::');
}

function buildPairingHistory(matches, roster) {
  const history = { partners: new Map(), opponents: new Map(), played: new Map(), byes: new Map(), courts: new Map() };
  const roundPlayers = new Map();
  const increment = (map, key, amount = 1) => map.set(key, (map.get(key) || 0) + amount);
  matches.forEach((match) => {
    const teamA = (Array.isArray(match.team_a) ? match.team_a : []).map(getPlayerId).filter(Boolean);
    const teamB = (Array.isArray(match.team_b) ? match.team_b : []).map(getPlayerId).filter(Boolean);
    const allPlayers = [...teamA, ...teamB];
    const roundRoster = roundPlayers.get(match.round_number) || new Set();
    allPlayers.forEach((playerId) => roundRoster.add(playerId));
    roundPlayers.set(match.round_number, roundRoster);
    allPlayers.forEach((playerId) => {
      increment(history.played, playerId);
      increment(history.courts, `${playerId}::${match.court_number}`);
    });
    for (let index = 0; index < teamA.length; index += 1) {
      for (let next = index + 1; next < teamA.length; next += 1) increment(history.partners, pairKey(teamA[index], teamA[next]));
    }
    for (let index = 0; index < teamB.length; index += 1) {
      for (let next = index + 1; next < teamB.length; next += 1) increment(history.partners, pairKey(teamB[index], teamB[next]));
    }
    teamA.forEach((first) => teamB.forEach((second) => increment(history.opponents, pairKey(first, second))));
  });
  roundPlayers.forEach((roundRoster) => roster.forEach((player) => {
    if (!roundRoster.has(player.id)) increment(history.byes, player.id);
  }));
  return history;
}

function scorePairingCandidate(groups, history, courts) {
  let cost = 0;
  const participating = groups.flatMap((group) => [...group.teamA, ...group.teamB]);
  const playCounts = participating.map((player) => history.played.get(player.id) || 0);
  const byeCounts = participating.map((player) => history.byes.get(player.id) || 0);
  const minPlayed = playCounts.length ? Math.min(...playCounts) : 0;
  const maxPlayed = playCounts.length ? Math.max(...playCounts) : 0;
  const minByes = byeCounts.length ? Math.min(...byeCounts) : 0;
  const maxByes = byeCounts.length ? Math.max(...byeCounts) : 0;
  cost += (maxPlayed - minPlayed) * 35;
  cost += (maxByes - minByes) * 25;
  groups.forEach((group, groupIndex) => {
    const court = courts[groupIndex];
    const teams = [group.teamA, group.teamB];
    teams.forEach((team) => {
      for (let index = 0; index < team.length; index += 1) {
        for (let next = index + 1; next < team.length; next += 1) {
          cost += (history.partners.get(pairKey(team[index].id, team[next].id)) || 0) * 100;
        }
      }
    });
    group.teamA.forEach((first) => group.teamB.forEach((second) => {
      cost += (history.opponents.get(pairKey(first.id, second.id)) || 0) * 60;
    }));
    [...group.teamA, ...group.teamB].forEach((player) => {
      cost += (history.courts.get(`${player.id}::${court}`) || 0) * 10;
    });
  });
  return cost;
}

function buildRoundPairings(players, round, courtCount, matches = []) {
  const roster = players.filter((player) => player?.id && player?.name);
  if (roster.length < 4) return { pairings: [], waiting: roster.length, cost: 0 };
  const history = buildPairingHistory(matches, roster);
  const maxPlayers = Math.min(roster.length, courtCount * 4);
  const eligible = [...roster].sort((first, second) => {
    const playDelta = (history.played.get(first.id) || 0) - (history.played.get(second.id) || 0);
    const byeDelta = (history.byes.get(second.id) || 0) - (history.byes.get(first.id) || 0);
    return playDelta || byeDelta || String(first.id).localeCompare(String(second.id));
  }).slice(0, maxPlayers);
  const candidates = [];
  const addCandidate = (ordered) => {
    const groups = [];
    for (let index = 0; index + 3 < ordered.length; index += 4) {
      groups.push({ teamA: ordered.slice(index, index + 2), teamB: ordered.slice(index + 2, index + 4) });
    }
    if (groups.length) candidates.push(groups);
  };
  for (let offset = 0; offset < eligible.length; offset += 1) {
    const rotated = eligible.map((_, index) => eligible[(index + offset + round - 1) % eligible.length]);
    addCandidate(rotated);
    addCandidate([...rotated].reverse());
    addCandidate(rotated.filter((_, index) => index % 2 === 0).concat(rotated.filter((_, index) => index % 2 === 1)));
  }
  const courts = Array.from({ length: courtCount }, (_, index) => index + 1);
  let best = candidates[0];
  let bestCost = Number.POSITIVE_INFINITY;
  candidates.forEach((candidate) => {
    const cost = scorePairingCandidate(candidate, history, courts);
    const signature = candidate.flatMap((group) => [...group.teamA, ...group.teamB].map((player) => player.id)).join('|');
    const bestSignature = best?.flatMap((group) => [...group.teamA, ...group.teamB].map((player) => player.id)).join('|') || '';
    if (cost < bestCost || (cost === bestCost && signature < bestSignature)) {
      best = candidate;
      bestCost = cost;
    }
  });
  return { pairings: best || [], waiting: Math.max(0, roster.length - (best?.length || 0) * 4), cost: bestCost };
}

function TournamentDetail({ tournament, role, publicViewer, onClose, onInvite, onDelete }) {
  const [tab, setTab] = useState('Matches');
  const [round, setRound] = useState(1);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [scoreDrafts, setScoreDrafts] = useState({});
  const [loading, setLoading] = useState(Boolean(supabase && !String(tournament.id).startsWith('starter-')));
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [started, setStarted] = useState(tournament.status === 'Live');
  const isLocal = String(tournament.id).startsWith('starter-') || String(tournament.id).startsWith('local-');
  const canManage = role === 'admin';
  const canScore = role === 'admin' || role === 'scorer';
  const readOnly = publicViewer || !role;
  const progress = `${Math.min(100, (tournament.players / tournament.maxPlayers) * 100)}%`;
  const currentRoundMatches = matches.filter((match) => !isPlaceholderMatch(match) && Number(match.round_number) === round);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!supabase || isLocal) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const [matchResult, playerResult] = await Promise.all([
        supabase.from('matches').select('*').eq('tournament_id', tournament.id).order('round_number').order('court_number'),
        supabase.from('players').select('*').eq('tournament_id', tournament.id).order('created_at'),
      ]);
      if (cancelled) return;
      if (matchResult.error || playerResult.error) {
          setError(matchResult.error?.message || playerResult.error?.message || 'Could not load session data.');
      } else {
        const loadedMatches = matchResult.data || [];
        setMatches(loadedMatches);
        setPlayers(playerResult.data || []);
        setScoreDrafts(Object.fromEntries(loadedMatches.filter((match) => !isPlaceholderMatch(match)).map((match) => [match.id, { scoreA: match.score_a || 0, scoreB: match.score_b || 0 }])));
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [tournament.id, isLocal]);

  const joinMatch = async () => {
    if (players.length >= tournament.maxPlayers) { setError('This match is already full.'); return; }
    const fallbackName = sessionStorage.getItem('pdl-match-name') || '';
    const name = window.prompt('Your player name', fallbackName || 'Padel player')?.trim();
    if (!name) return;
    sessionStorage.setItem('pdl-match-name', name);
    setSaving(true);
    setError('');
    const player = { id: `local-player-${Date.now()}`, name, level: tournament.level, rating: 1000 };
    if (!isLocal && supabase) {
      const { data, error: insertError } = await supabase.from('players').insert({ tournament_id: tournament.id, name }).select().single();
      if (insertError) setError(insertError.message);
      else { setPlayers((current) => [...current, data]); setMessage('You joined the match.'); }
    } else {
      setPlayers((current) => [...current, player]);
      setMessage('You joined the match.');
    }
    setSaving(false);
  };

  const startMatch = async () => {
    if (!canManage) { setError('Only the host can start this match.'); return; }
    const rosterCount = players.length || tournament.players;
    if (rosterCount < 4) { setError('At least 4 players are required to start.'); return; }
    if (!isLocal && supabase) {
      const { error: updateError } = await supabase.from('tournaments').update({ status: 'Live' }).eq('id', tournament.id);
      if (updateError) { setError(updateError.message); return; }
    }
    setStarted(true);
    setMessage('Match is live. Generate the first round and start scoring.');
  };

  const addPlayer = async (event) => {
    event.preventDefault();
    if (!canManage) { setError('Only tournament admins can manage players.'); return; }
    const name = playerName.trim();
    if (!name) return;
    setSaving(true);
    setError('');
    if (isLocal || !supabase) {
      setPlayers((current) => [...current, { id: `local-player-${Date.now()}`, name }]);
      setPlayerName('');
      setSaving(false);
      setMessage('Player added to the local roster.');
      return;
    }
    const { data, error: insertError } = await supabase.from('players').insert({ tournament_id: tournament.id, name }).select().single();
    if (insertError) setError(insertError.message);
    else {
      setPlayers((current) => [...current, data]);
      setPlayerName('');
      setMessage(`${name} joined the roster.`);
    }
    setSaving(false);
  };

  const generateMatches = async () => {
    if (!canManage) { setError('Only tournament admins can generate matches.'); return; }
    if (generating) return;
    setGenerating(true);
    setError('');
    setMessage('');
    const courtCount = Math.max(1, Number(tournament.courtCount || 1));
    const placeholderMatches = matches.filter((match) => isPlaceholderMatch(match) && Number(match.round_number) === round);
    if (!isLocal && supabase && placeholderMatches.length) {
      const { error: cleanupError } = await supabase.from('matches').delete().in('id', placeholderMatches.map((match) => match.id));
      if (cleanupError) {
        setError(`Placeholder round gagal dibersihkan: ${cleanupError.message}`);
        setGenerating(false);
        return;
      }
    }
    if (placeholderMatches.length) setMatches((current) => current.filter((match) => !placeholderMatches.some((placeholder) => placeholder.id === match.id)));
    const existingCourts = new Set(currentRoundMatches.map((match) => Number(match.court_number)));
    const openCourts = Array.from({ length: courtCount }, (_, index) => index + 1).filter((court) => !existingCourts.has(court));
    if (!openCourts.length) {
      setMessage(`Round ${round} already has ${currentRoundMatches.length} match${currentRoundMatches.length === 1 ? '' : 'es'}.`);
      setGenerating(false);
      return;
    }
    const { pairings, waiting, cost } = buildRoundPairings(players, round, openCourts.length, matches);
    if (!pairings.length) {
      setError('Minimal 4 pemain diperlukan untuk generate match. Tambahkan pemain di tab Overview.');
      setGenerating(false);
      return;
    }
    const rows = pairings.map((pairing, index) => ({
      tournament_id: tournament.id,
      round_number: round,
      court_number: openCourts[index],
      badge: 'OPEN',
      team_a: pairing.teamA.map((player) => ({ id: player.id, name: player.name })),
      team_b: pairing.teamB.map((player) => ({ id: player.id, name: player.name })),
      score_a: 0,
      score_b: 0,
      is_completed: false,
    }));
    if (!isLocal && supabase) {
      const { data, error: insertError } = await supabase.from('matches').insert(rows).select();
      if (insertError) {
        setError(insertError.message);
        setGenerating(false);
        return;
      }
      setMatches((current) => [...current, ...(data || [])]);
      setScoreDrafts((current) => Object.assign({}, current, ...((data || []).map((match) => ({ [match.id]: { scoreA: 0, scoreB: 0 } })))));
    } else {
      const localRows = rows.map((row, index) => ({ ...row, id: `local-match-${Date.now()}-${index}` }));
      setMatches((current) => [...current, ...localRows]);
    }
    setMessage(`${rows.length} match${rows.length === 1 ? '' : 'es'} generated for Round ${round} with fair pairing (cost ${cost})${waiting ? ` · ${waiting} player${waiting === 1 ? '' : 's'} waiting` : ''}.`);
    setGenerating(false);
  };

  const calculateStandings = () => {
    const stats = new Map(players.map((player) => [player.id, { ...player, games: 0, wins: 0, losses: 0, ties: 0, points: 0, diff: 0, bonus: 0 }]));
    matches.filter((match) => match.is_completed).forEach((match) => {
      const teamA = (Array.isArray(match.team_a) ? match.team_a : []).map(getPlayerId).filter(Boolean);
      const teamB = (Array.isArray(match.team_b) ? match.team_b : []).map(getPlayerId).filter(Boolean);
      const scoreA = Number(match.score_a) || 0;
      const scoreB = Number(match.score_b) || 0;
      const resultA = scoreA === scoreB ? 'ties' : scoreA > scoreB ? 'wins' : 'losses';
      const resultB = scoreA === scoreB ? 'ties' : scoreB > scoreA ? 'wins' : 'losses';
      [...teamA, ...teamB].forEach((playerId) => { const item = stats.get(playerId); if (item) item.games += 1; });
      teamA.forEach((playerId) => { const item = stats.get(playerId); if (item) { item[resultA] += 1; item.points += scoreA; item.diff += scoreA - scoreB; } });
      teamB.forEach((playerId) => { const item = stats.get(playerId); if (item) { item[resultB] += 1; item.points += scoreB; item.diff += scoreB - scoreA; } });
    });
    return [...stats.values()].sort((first, second) => second.points - first.points || second.diff - first.diff || second.games - first.games || first.name.localeCompare(second.name));
  };
  const standings = calculateStandings();
  const activePlayerIds = new Set(currentRoundMatches.flatMap((match) => [...(Array.isArray(match.team_a) ? match.team_a : []), ...(Array.isArray(match.team_b) ? match.team_b : [])].map(getPlayerId)));
  const restPlayers = players.filter((player) => !activePlayerIds.has(player.id));
  const reshuffleRound = async () => {
    if (!canManage) { setError('Only tournament admins can reshuffle matches.'); return; }
    if (currentRoundMatches.some((match) => match.is_completed)) { setError('Selesaikan atau hapus skor round ini sebelum reshuffle.'); return; }
    if (!isLocal && supabase && currentRoundMatches.length) {
      const { error: deleteError } = await supabase.from('matches').delete().eq('tournament_id', tournament.id).eq('round_number', round);
      if (deleteError) { setError(deleteError.message); return; }
    }
    setMatches((current) => current.filter((match) => Number(match.round_number) !== round));
    setMessage('Round cleared. Generate matches again for a new cost-based pairing.');
  };
  const finishRound = () => {
    if (!currentRoundMatches.length) { setError('Generate match terlebih dahulu sebelum menyelesaikan round.'); return; }
    const unfinished = currentRoundMatches.filter((match) => !match.is_completed);
    if (unfinished.length) { setError('Isi dan simpan semua skor sebelum Finish.'); return; }
    setMessage('Round ' + round + ' selesai. Leaderboard sudah diperbarui.');
    if (round < (tournament.totalRounds || 4)) setRound((current) => current + 1);
  };
  const saveScore = async (match) => {
    if (!canScore) { setError('This tournament is read-only for your account.'); return; }
    const draft = scoreDrafts[match.id] || { scoreA: 0, scoreB: 0 };
    const scoreA = Number(draft.scoreA);
    const scoreB = Number(draft.scoreB);
    const maxScore = Number(tournament.targetPoints || 21);
    if (!Number.isFinite(scoreA) || !Number.isFinite(scoreB) || scoreA < 0 || scoreB < 0 || scoreA > maxScore || scoreB > maxScore) {
      setError(`Score must be between 0 and ${maxScore}.`);
      return;
    }
    if (scoreA === scoreB && scoreA > 0) {
      setError('A completed padel game cannot finish with a tie.');
      return;
    }
    const completed = scoreA > 0 || scoreB > 0;
    setSaving(true);
    setError('');
    if (!isLocal && supabase) {
      const { data, error: updateError } = await supabase.from('matches').update({ score_a: scoreA, score_b: scoreB, is_completed: completed }).eq('id', match.id).select().single();
      if (updateError) setError(updateError.message);
      else setMatches((current) => current.map((item) => item.id === match.id ? data : item));
    } else {
      setMatches((current) => current.map((item) => item.id === match.id ? { ...item, score_a: scoreA, score_b: scoreB, is_completed: completed } : item));
    }
    setMessage(completed ? 'Score saved and match marked complete.' : 'Score reset for this match.');
    setSaving(false);
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="detail-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="detail-cover"><img src={tournament.image} alt="" /><div className="detail-cover-gradient" /><button type="button" onClick={onClose} className="detail-close" aria-label="Close details"><X /></button><div className="detail-status"><StatusPill status={tournament.status} /></div></div>
        <div className="detail-body">
          <div className="detail-heading"><div><div className="court-kicker">{started ? 'Live session' : 'Session lobby'}</div><h2>{tournament.name}</h2><span className="detail-role">{publicViewer ? 'viewer' : role || 'viewer'} · {started ? 'LIVE' : 'OPEN'}</span></div><div className="detail-actions">{!started && canManage && <button type="button" onClick={startMatch} className="invite-action start-action"><Zap /> Start match</button>}{!started && !canManage && <button type="button" onClick={joinMatch} className="invite-action join-action" disabled={saving}><Plus /> Join match</button>}{canManage && <button type="button" onClick={onDelete} className="invite-action danger-action"><X /> Delete</button>}<button type="button" onClick={onInvite} className="invite-action"><Users /> Share link</button></div></div>
          <div className="detail-meta"><MetaItem icon={CalendarDays}>{tournament.date}</MetaItem><MetaItem icon={Clock3}>{tournament.time}</MetaItem><MetaItem icon={MapPin}>{tournament.location}</MetaItem><MetaItem icon={Trophy}>{tournament.format || 'Americano'}</MetaItem><MetaItem icon={Users}>{tournament.maxPlayers} players</MetaItem><MetaItem icon={Gauge}>{tournament.targetPoints || 21} pts</MetaItem></div>
          <div className="detail-tabs"><button type="button" className={tab === 'Overview' ? 'detail-tab-active' : ''} onClick={() => setTab('Overview')}>Overview</button><button type="button" className={tab === 'Matches' ? 'detail-tab-active' : ''} onClick={() => setTab('Matches')}>Live rounds <span>{matches.length}</span></button><button type="button" className={tab === 'Standings' ? 'detail-tab-active' : ''} onClick={() => setTab('Standings')}>Leaderboard</button><button type="button" className={tab === 'Activity' ? 'detail-tab-active' : ''} onClick={() => setTab('Activity')}>Activity</button></div>
          {message && <div className="detail-message"><Check /> {message}</div>}
          {error && <div className="detail-error"><X /> {error}</div>}
          {tab === 'Overview' && <div className="detail-overview"><div className="roster-progress"><div className="progress-top"><span>Roster progress</span><strong>{players.length || tournament.players} / {tournament.maxPlayers}</strong></div><div className="progress-track"><div style={{ width: players.length ? `${Math.min(100, (players.length / tournament.maxPlayers) * 100)}%` : progress }} /></div><p>{tournament.maxPlayers - (players.length || tournament.players) > 0 ? `${tournament.maxPlayers - (players.length || tournament.players)} places still open for this session.` : 'The roster is full. Time to get your rackets ready.'}</p></div>{canManage && <form className="player-add-form" onSubmit={addPlayer}><input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Add player name" /><button type="submit" className="secondary-action" disabled={saving}><Plus /> Add</button></form>}<div className="roster-chips">{players.length ? players.map((player) => <span key={player.id}>{player.name}{player.rating ? ` · ${player.rating}` : ''}</span>) : <small>No players added yet. Add a roster before generating balanced pairs.</small>}</div>{!canManage && <button type="button" onClick={joinMatch} className="primary-action join-roster-action" disabled={saving || players.length >= tournament.maxPlayers}>{players.length >= tournament.maxPlayers ? 'Match full' : 'Join this match'}</button>}</div>}
          {tab === 'Matches' && <div className="match-dashboard"><aside className="leaderboard-panel"><div className="panel-heading"><div><span className="panel-eyebrow">Leaderboard</span><h3>By points</h3></div><span className="panel-menu">⋮</span></div><div className="leaderboard-head"><span>PLAYER</span><span>G</span><span>W-L-T</span><span>DIFF</span><span>+M</span><span>P</span></div>{standings.length ? standings.map((player, index) => <div className="leaderboard-row" key={player.id}><span className="leaderboard-rank">{index + 1}.</span><strong>{player.name}</strong><span>{player.games}</span><span><i>{player.wins}</i>-{player.losses}-{player.ties}</span><span>{player.diff > 0 ? '+' : ''}{player.diff}</span><span>+{Math.max(0, player.bonus)}</span><b>{player.points}</b></div>) : <div className="leaderboard-empty">Add players to build the table.</div>}<div className="leaderboard-legend"><strong>W-L-T</strong> Win · Loss · Tie<br /><strong>DIFF</strong> Point difference<br /><strong>+M</strong> Compensation for fewer matches<br /><strong>P</strong> Total points</div></aside><section className="rounds-panel"><div className="rounds-heading"><div><span className="panel-eyebrow">Session rounds</span><h3>Round #{round}</h3></div><button type="button" className="round-view-button" onClick={() => setTab('Matches')} aria-label="View match rounds">▦</button></div><div className="round-selector"><button type="button" onClick={() => setRound((current) => Math.max(1, current - 1))} disabled={round <= 1}>‹</button>{Array.from({ length: Math.min(6, tournament.totalRounds || 4) }, (_, index) => index + 1).map((roundNumber) => <button type="button" key={roundNumber} className={round === roundNumber ? 'round-selected' : ''} onClick={() => setRound(roundNumber)}>{roundNumber}</button>)}<button type="button" onClick={() => setRound((current) => Math.min(tournament.totalRounds || 4, current + 1))} disabled={round >= (tournament.totalRounds || 4)}>›</button></div>{loading ? <div className="match-empty"><span className="spinner" /> Loading matches…</div> : currentRoundMatches.length ? <div className="reference-match-list">{currentRoundMatches.map((match) => { const draft = scoreDrafts[match.id] || { scoreA: match.score_a || 0, scoreB: match.score_b || 0 }; const teamA = getTeamNames(match.team_a); const teamB = getTeamNames(match.team_b); return <article className="reference-match-card" key={match.id}><div className="reference-scoreboard"><div className="reference-score"><strong>{draft.scoreA}</strong><span>{teamA.length ? teamA.map((name) => <em key={name}>{name}</em>) : <em>Waiting for players</em>}</span></div><div className="reference-score-divider">—</div><div className="reference-score reference-score-right"><strong>{draft.scoreB}</strong><span>{teamB.length ? teamB.map((name) => <em key={name}>{name}</em>) : <em>Waiting for players</em>}</span></div><span className="reference-court">Court {match.court_number}</span></div>{canScore && <div className="reference-score-edit"><label>Team A<input aria-label={`Score team A court ${match.court_number}`} inputMode="numeric" value={draft.scoreA} onChange={(event) => setScoreDrafts((current) => ({ ...current, [match.id]: { ...draft, scoreA: event.target.value } }))} /></label><label>Team B<input aria-label={`Score team B court ${match.court_number}`} inputMode="numeric" value={draft.scoreB} onChange={(event) => setScoreDrafts((current) => ({ ...current, [match.id]: { ...draft, scoreA: draft.scoreA, scoreB: event.target.value } }))} /></label><button type="button" className="save-score-action" onClick={() => saveScore(match)} disabled={saving}><Check /> Save</button></div>}</article>; })}</div> : <div className="match-empty"><Sparkles /><h3>No matches generated yet.</h3><p>Add players in Overview, then generate courts for this round.</p><button type="button" className="primary-action" onClick={() => setTab('Overview')}>Build roster first</button></div>}<div className="rest-players"><strong>Rest Players:</strong> {restPlayers.length ? restPlayers.map((player) => player.name).join(', ') : 'None — full rotation'}</div>{canManage && <div className="match-actions"><button type="button" className="primary-action" onClick={finishRound}><span>⚑</span> Finish</button><button type="button" className="secondary-action" onClick={reshuffleRound} disabled={saving || generating}><span>⤨</span> Reshuffle</button><button type="button" className="generate-match-button" onClick={generateMatches} disabled={generating}>{generating ? 'Generating…' : 'Generate matches'} <Sparkles /></button></div>}</section></div>}
          {tab === 'Standings' && <div className="standings-panel"><div className="standings-heading"><div><span className="panel-eyebrow">Current ranking</span><h3>Leaderboard</h3></div><span>{standings.length} players</span></div>{standings.length ? <div className="standings-table">{standings.map((player, index) => <div className="standing-row" key={player.id}><span>{String(index + 1).padStart(2, '0')}</span><strong>{player.name}</strong><span>{player.games} played</span><span>{player.wins}W - {player.losses}L - {player.ties}T</span><b>{player.points} pts</b><em>{player.diff > 0 ? '+' : ''}{player.diff} diff</em></div>)}</div> : <div className="match-empty"><Trophy /><h3>Standings appear after the first rally.</h3><p>Generate matches and record scores to build the table.</p></div>}</div>}
          {tab === 'Activity' && <div className="activity-panel"><div className="standings-heading"><div><span className="panel-eyebrow">Tournament history</span><h3>Activity</h3></div><span>{matches.filter((match) => match.is_completed).length} completed</span></div>{matches.filter((match) => match.is_completed).length ? <div className="activity-list">{matches.filter((match) => match.is_completed).map((match) => <div className="activity-row" key={match.id}><span className="activity-dot" /><span>Round {match.round_number} · Court {match.court_number}</span><strong>{match.score_a} – {match.score_b}</strong></div>)}</div> : <div className="match-empty"><Sparkles /><h3>No completed matches yet.</h3><p>Saved scores will appear here.</p></div>}</div>}
          <div className="detail-footer"><span>Hosted by <strong>{tournament.host}</strong></span><span>{tournament.rounds}</span></div>
        </div>
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
  const [tournamentRoles, setTournamentRoles] = useState({});

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
    if (!supabase) return undefined;
    let cancelled = false;
    const loadTournaments = async () => {
      const sharedSlug = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tournament') : null;
      let rows = [];
      let error = null;
      if (session) {
        const [{ data: owned, error: ownedError }, { data: memberships, error: memberError }] = await Promise.all([
          supabase.from('tournaments').select('*').eq('owner_id', session.user.id).order('created_at', { ascending: false }),
          supabase.from('tournament_members').select('tournament_id,role').eq('user_id', session.user.id)
        ]);
        error = ownedError || memberError;
        const roles = Object.fromEntries((memberships || []).map((member) => [member.tournament_id, member.role]));
        setTournamentRoles(roles);
        const ids = [...new Set([...(owned || []).map((row) => row.id), ...(memberships || []).map((member) => member.tournament_id)])];
        if (!error && ids.length) {
          const result = await supabase.from('tournaments').select('*').in('id', ids).order('created_at', { ascending: false });
          rows = result.data || [];
          error = result.error;
        }
      }
      if (error) {
        if (!cancelled) setDataError(error.message);
        return;
      }
      if (sharedSlug) {
        const sharedResult = await supabase.from('tournaments').select('*').eq('share_slug', sharedSlug).maybeSingle();
        if (!sharedResult.error && sharedResult.data) rows = [...rows, sharedResult.data];
      }
      if (!cancelled) {
        setDataError('');
        setTournaments((rows || []).filter((row, index, all) => all.findIndex((item) => item.id === row.id) === index).map((row, index) => normalizeTournament(row, index)));
      }
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

  const handleDeleteTournament = async (tournament) => {
    if (!session || tournament.owner_id !== session.user.id) {
      showNotice('Only the tournament owner can delete this tournament.');
      return;
    }
    if (!window.confirm(`Delete ${tournament.name} and all of its matches and players? This cannot be undone.`)) return;
    const { error } = await supabase.from('tournaments').delete().eq('id', tournament.id);
    if (error) {
      setDataError(error.message);
      showNotice(`Delete failed: ${error.message}`);
      return;
    }
    setTournaments((current) => current.filter((item) => item.id !== tournament.id));
    setSelectedTournament(null);
    showNotice('Session deleted.');
  };

  const handleShareTournament = async (tournament) => {
    const slug = tournament.share_slug || tournament.id;
    const url = `${window.location.origin}/?tournament=${encodeURIComponent(slug)}`;
    try {
      if (navigator.share) await navigator.share({ title: tournament.name, url });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(url); showNotice('Viewer link copied.'); }
      else window.prompt('Copy this viewer link', url);
    } catch (error) {
      if (error?.name !== 'AbortError') showNotice('Share link could not be copied.');
    }
  };

  const handleCreate = async (tournament) => {
    if (!supabase) {
      setAuthMessage('Supabase belum terkonfigurasi pada deployment ini.');
      showNotice('Supabase belum siap pada deployment ini.');
      return false;
    }
    if (!session) {
      setAuthMode('signin');
      setAuthMessage('Silakan sign in terlebih dahulu untuk membuat match.');
      document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' });
      showNotice('Sign in dulu untuk membuat match.');
      return false;
    }

    setDataError('');
    const slugBase = tournament.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'tournament';
    const { data, error } = await supabase.from('tournaments').insert({
      owner_id: session.user.id,
      name: tournament.name,
      format: tournament.level,
      court_count: Math.min(4, Math.max(1, Number(tournament.courtCount) || 1)),
      match_type: tournament.format || 'Americano',
      scheduled_at: tournament.scheduledAt,
      location: tournament.location,
      target_points: Math.min(32, Math.max(0, Number(tournament.targetPoints) || 21)),
      scoring_type: tournament.scoringType || 'Point scoring',
      total_rounds: Math.min(8, Math.max(1, Number(tournament.totalRounds) || 4)),
      gender: tournament.gender || 'Any',
      visibility: tournament.visibility || 'Public',
      share_slug: `${slugBase}-${Date.now()}`,
      status: 'Active',
    }).select().single();
    if (error) {
      setDataError(error.message);
      showNotice(`Session gagal dibuat: ${error.message}`);
      return false;
    }

    let savedPlayers = [];
    if (Array.isArray(tournament.playerNames) && tournament.playerNames.length) {
      const { data: playerData, error: playerError } = await supabase.from('players').insert(tournament.playerNames.map((name) => ({ tournament_id: data.id, name }))).select();
      if (playerError) {
        setDataError(`Session tersimpan, tetapi roster belum tersimpan: ${playerError.message}`);
        showNotice('Session tersimpan, tetapi roster perlu ditambahkan dari dashboard.');
        return false;
      }
      savedPlayers = playerData || [];
    }

    const courtCount = Math.max(1, Number(tournament.courtCount) || 1);
    const { pairings, waiting } = buildRoundPairings(savedPlayers, 1, courtCount, []);
    if (pairings.length) {
      const firstRoundRows = pairings.map((pairing, index) => ({
        tournament_id: data.id,
        round_number: 1,
        court_number: index + 1,
        badge: 'OPEN',
        team_a: pairing.teamA.map((player) => ({ id: player.id, name: player.name })),
        team_b: pairing.teamB.map((player) => ({ id: player.id, name: player.name })),
        score_a: 0,
        score_b: 0,
        is_completed: false,
      }));
      const { error: matchError } = await supabase.from('matches').insert(firstRoundRows);
      if (matchError) {
        setDataError(`Session dan roster tersimpan, tetapi pairing round pertama gagal dibuat: ${matchError.message}`);
        showNotice('Session tersimpan, tetapi pairing round pertama perlu dibuat dari dashboard.');
        return false;
      }
    }

    const saved = { ...tournament, id: data.id, owner_id: session.user.id, share_slug: data.share_slug, host: 'You', players: savedPlayers.length || tournament.players };
    setTournaments((current) => [saved, ...current]);
    showNotice(pairings.length ? `Session dibuat dengan ${pairings.length} pairing di Round 1${waiting ? ` · ${waiting} pemain menunggu` : ''}.` : 'Session dibuat. Tambahkan minimal 4 pemain untuk generate pairing.');
    return true;
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-orbit orbit-one" /><div className="header-orbit orbit-two" />
        <div className="container header-inner"><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="brand-button"><span className="brand-mark"><img src={imageSet.mark} alt="PD-Match Dadakan" /></span><span><strong>PD-Match Dadakan</strong><small>Spontaneous padel club</small></span></button><div className="header-actions">{authLoading ? <span className="session-check">Checking session…</span> : session ? <button type="button" onClick={() => showNotice('Tap Profile below to manage your account.')} className="account-button">{session.user.email}</button> : <button type="button" onClick={() => { setAuthMessage(''); setAuthMode('signin'); document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' }); }} className="header-signin">Sign in</button>}<button type="button" onClick={() => showNotice('Settings are queued for the next rally.')} className="settings-button" aria-label="Settings"><Settings /></button></div></div>
        <div className="container hero-content"><div className="hero-grid"><div className="hero-copy reveal-up"><div className="welcome-label"><span /> Welcome back</div><h1>Your next<br className="desktop-break" /> rally starts here<span>.</span></h1><p>Plan the session, balance the rotation, and keep every rally moving.</p><div className="hero-actions"><button type="button" onClick={() => setShowCreate(true)} className="hero-primary"><Plus /> Create session</button><button type="button" onClick={() => document.getElementById('tournaments')?.scrollIntoView({ behavior: 'smooth' })} className="hero-secondary">Browse matches <ArrowUpRight /></button></div></div><div className="hero-visual reveal-up reveal-delay-2"><div className="hero-photo"><img src={imageSet.hero} alt="Players on a padel court" /><div /></div><div className="community-pulse"><span><Zap /></span><span><small>Community pulse</small><strong>{joinedCount} players in rotation</strong></span></div></div></div></div>
      </header>

      <main className="container main-content">
        <section className="stats-grid reveal-up reveal-delay-1"><div className="stat-card"><div><span>Active sessions</span><Trophy /></div><strong>{activeCount}</strong><p>Open for your next session</p></div><div className="stat-card"><div><span>Players in rotation</span><Users /></div><strong>{joinedCount}</strong><p>Across your current groups</p></div><div className="stat-card stat-card-lime"><div><span>Match balance</span><Gauge /></div><strong>94<small>%</small></strong><p>Average group satisfaction</p></div></section>
        <section id="tournaments" className="tournaments-section"><div className="section-heading"><div><div className="court-kicker">Your playbook</div><h2>Sessions in your orbit<span>.</span></h2></div><div className="filter-group"><span>Filter by</span><div className="filter-control"><Filter />{filterOptions.map((option) => <button type="button" key={option} onClick={() => setFilter(option)} className={filter === option ? 'filter-selected' : ''}>{option}</button>)}</div></div></div><div className="tournament-grid">{visibleTournaments.map((tournament, index) => <div key={tournament.id} className={`reveal-up ${index === 1 ? 'reveal-delay-1' : index === 2 ? 'reveal-delay-2' : ''}`}><TournamentCard tournament={tournament} position={index + 1} total={visibleTournaments.length} onOpen={() => setSelectedTournament(tournament)} /></div>)}</div>{visibleTournaments.length === 0 && <div className="empty-state"><Sparkles /><h3>No matches in this lane yet.</h3><p>Create a session and give your group a reason to pick up their rackets.</p><button type="button" onClick={() => setShowCreate(true)} className="primary-action inline-action"><Plus /> Create one</button></div>}</section>
        <section className="ritual-section"><div><div className="court-kicker">Small rituals, better rallies</div><h2>A better match starts before the first serve<span>.</span></h2><p>PD-Match Dadakan keeps the boring parts moving in the background, so your group can focus on showing up and playing well.</p><button type="button" onClick={() => showNotice('Match insights are queued for the next rally.')} className="link-action">See how it works <ChevronRight /></button></div><div className="signal-card"><div className="signal-inner"><div className="signal-top"><span><Zap /></span><div><small>Your group signal</small><strong>4 players are ready to rally this week.</strong></div></div><div className="signal-bottom"><div><strong>02:14</strong><span>Average time to fill a match</span></div><em>On track</em></div></div></div></section>
        <section id="profile" className="profile-section"><ProfilePanel session={session} authMode={authMode} setAuthMode={setAuthMode} email={authEmail} setEmail={setAuthEmail} password={authPassword} setPassword={setAuthPassword} message={authMessage} onSubmit={handleAuthSubmit} onSignOut={handleSignOut} /></section>
        {dataError && <div className="error-banner">Supabase: {dataError}</div>}
      </main>

      <nav className="bottom-nav"><div className="container bottom-nav-inner"><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="nav-item nav-active"><span><Zap /></span><small>Home</small></button><button type="button" onClick={() => document.getElementById('tournaments')?.scrollIntoView({ behavior: 'smooth' })} className="nav-item"><span><Compass /></span><small>Discover</small></button><button type="button" onClick={() => setShowCreate(true)} className="create-fab" aria-label="Create session"><Plus /></button><button type="button" onClick={() => document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' })} className="nav-item"><span><CircleUserRound /></span><small>Profile</small></button></div></nav>
      {showCreate && <CreateTournamentModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {selectedTournament && <TournamentDetail tournament={selectedTournament} role={session ? (selectedTournament.owner_id === session.user.id ? 'admin' : tournamentRoles[selectedTournament.id] || null) : null} publicViewer={!session} onClose={() => setSelectedTournament(null)} onInvite={() => handleShareTournament(selectedTournament)} onDelete={() => handleDeleteTournament(selectedTournament)} />}
      {notice && <div className="toast-notice"><Check /> {notice}</div>}
    </div>
  );
}
