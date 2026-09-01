'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const MATCH_TYPES = [
  { title: 'Americano', desc: 'Rotasi individu dengan pasangan yang berganti.' },
  { title: 'Mexicano', desc: 'Pairing menyesuaikan klasemen setiap ronde.' },
  { title: 'Team Americano', desc: 'Tim tetap bertanding sepanjang turnamen.' },
  { title: 'Mix Americano', desc: 'Rotasi pasangan campuran.' },
  { title: 'Team Mexicano', desc: 'Tim tetap dengan pairing berbasis klasemen.' }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function normalizeTournament(tournament) {
  const totalRounds = Number(tournament.total_rounds ?? tournament.totalRounds ?? 4);
  const courts = Number(tournament.court_count ?? tournament.courts ?? 1);
  return {
    ...tournament,
    id: tournament.id,
    name: tournament.name || 'Untitled Tournament',
    matchType: tournament.match_type || tournament.matchType || 'Americano',
    courts: courts > 0 ? courts : 1,
    totalRounds: totalRounds > 0 ? totalRounds : 4,
    playersCount: Number(tournament.players_count ?? tournament.playersCount ?? 0),
    status: tournament.status || 'Active'
  };
}

function avatarUrl(name) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Player')}&backgroundColor=2563eb&fontFamily=Arial`;
}

function rotate(items, amount) {
  if (!items.length) return [];
  const offset = ((amount % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function makeCandidate(players, round, courts, shift, reverse) {
  const ordered = rotate(players, shift);
  if (reverse) ordered.reverse();
  const active = ordered.slice(0, courts * 4);
  const matches = [];
  for (let courtIndex = 0; courtIndex < courts; courtIndex += 1) {
    const offset = courtIndex * 4;
    if (offset + 3 >= active.length) continue;
    matches.push({
      round,
      court: courtIndex + 1,
      team1: [active[offset], active[offset + 1]],
      team2: [active[offset + 2], active[offset + 3]]
    });
  }
  return matches;
}

function candidateScore(matches, partnerHistory, opponentHistory) {
  let score = 0;
  matches.forEach((match) => {
    const pairings = [
      [match.team1[0], match.team1[1]],
      [match.team2[0], match.team2[1]]
    ];
    pairings.forEach(([one, two]) => {
      if (partnerHistory.has([one, two].sort().join('::'))) score += 100;
    });
    match.team1.forEach((one) => match.team2.forEach((two) => {
      if (opponentHistory.has([one, two].sort().join('::'))) score += 10;
    }));
  });
  return score;
}

function buildSchedule(players, roundsCount, courts) {
  const partnerHistory = new Set();
  const opponentHistory = new Set();
  const rounds = {};
  const matchRows = [];

  for (let round = 1; round <= roundsCount; round += 1) {
    let bestMatches = [];
    let bestScore = Number.POSITIVE_INFINITY;
    for (let shift = 0; shift < players.length; shift += 1) {
      for (const reverse of [false, true]) {
        const candidate = makeCandidate(players, round, courts, shift + round * 2, reverse);
        const score = candidateScore(candidate, partnerHistory, opponentHistory);
        if (score < bestScore) {
          bestScore = score;
          bestMatches = candidate;
        }
      }
    }

    rounds[round] = bestMatches.map((match, matchIndex) => ({
      id: `local-r${round}-c${match.court}`,
      courtName: `Court ${match.court}`,
      badge: 'OPEN',
      badgeColor: '#2563eb',
      team1: {
        name1: match.team1[0],
        name2: match.team1[1],
        avatar1: avatarUrl(match.team1[0]),
        avatar2: avatarUrl(match.team1[1])
      },
      team2: {
        name1: match.team2[0],
        name2: match.team2[1],
        avatar1: avatarUrl(match.team2[0]),
        avatar2: avatarUrl(match.team2[1])
      },
      score1: '',
      score2: '',
      submitted: false,
      matchIndex
    }));

    bestMatches.forEach((match) => {
      partnerHistory.add([match.team1[0], match.team1[1]].sort().join('::'));
      partnerHistory.add([match.team2[0], match.team2[1]].sort().join('::'));
      match.team1.forEach((one) => match.team2.forEach((two) => {
        opponentHistory.add([one, two].sort().join('::'));
      }));
      matchRows.push({
        round_number: round,
        court_number: match.court,
        badge: 'OPEN',
        team_a: match.team1,
        team_b: match.team2,
        score_a: 0,
        score_b: 0,
        is_completed: false
      });
    });
  }

  return { rounds, matchRows };
}

function calculateStandings(players, matches) {
  const stats = {};
  players.forEach((player) => {
    const name = typeof player === 'string' ? player : player.name;
    stats[name] = {
      id: typeof player === 'string' ? name : player.id,
      name,
      w: 0,
      l: 0,
      pts: 0,
      against: 0,
      played: 0
    };
  });

  matches.forEach((match) => {
    if (!match.is_completed && !match.submitted) return;
    const score1 = Number(match.score_a ?? match.score1 ?? 0);
    const score2 = Number(match.score_b ?? match.score2 ?? 0);
    const team1 = match.team_a || [match.team1?.name1, match.team1?.name2];
    const team2 = match.team_b || [match.team2?.name1, match.team2?.name2];
    team1.forEach((name) => {
      if (!stats[name]) return;
      stats[name].played += 1;
      stats[name].pts += score1;
      stats[name].against += score2;
      if (score1 > score2) stats[name].w += 1;
      if (score1 < score2) stats[name].l += 1;
    });
    team2.forEach((name) => {
      if (!stats[name]) return;
      stats[name].played += 1;
      stats[name].pts += score2;
      stats[name].against += score1;
      if (score2 > score1) stats[name].w += 1;
      if (score2 < score1) stats[name].l += 1;
    });
  });

  return Object.values(stats)
    .map((item) => ({ ...item, diff: item.pts - item.against }))
    .sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.w - a.w || a.name.localeCompare(b.name))
    .map((item, index) => ({ ...item, pos: index + 1 }));
}

function mapRemoteMatch(match) {
  const teamA = Array.isArray(match.team_a) ? match.team_a : [];
  const teamB = Array.isArray(match.team_b) ? match.team_b : [];
  return {
    id: match.id,
    courtName: `Court ${match.court_number}`,
    badge: match.badge || 'OPEN',
    badgeColor: match.badge === 'MIX' ? '#db2777' : '#2563eb',
    team1: {
      name1: teamA[0] || 'TBD',
      name2: teamA[1] || 'TBD',
      avatar1: avatarUrl(teamA[0]),
      avatar2: avatarUrl(teamA[1])
    },
    team2: {
      name1: teamB[0] || 'TBD',
      name2: teamB[1] || 'TBD',
      avatar1: avatarUrl(teamB[0]),
      avatar2: avatarUrl(teamB[1])
    },
    score1: match.score_a === 0 && !match.is_completed ? '' : String(match.score_a ?? 0),
    score2: match.score_b === 0 && !match.is_completed ? '' : String(match.score_b ?? 0),
    submitted: Boolean(match.is_completed)
  };
}

export default function PDLUPEngineApp() {
  const [currentView, setCurrentView] = useState('HOME');
  const [homeFilter, setHomeFilter] = useState('All');
  const [detailTab, setDetailTab] = useState('MATCHES');
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundsMatches, setRoundsMatches] = useState({});
  const [standings, setStandings] = useState([]);
  const [matchLogs, setMatchLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shareNotice, setShareNotice] = useState('');
  const [showManage, setShowManage] = useState(false);
  const [managePlayers, setManagePlayers] = useState([]);
  const [managePlayerInput, setManagePlayerInput] = useState('');
  const [manageCourts, setManageCourts] = useState(1);
  const [isManaging, setIsManaging] = useState(false);

  const [formName, setFormName] = useState('');
  const [formMatchType, setFormMatchType] = useState('Americano');
  const [formCourts, setFormCourts] = useState(1);
  const [formRounds, setFormRounds] = useState(8);
  const [formPoints, setFormPoints] = useState('21');
  const [playerInput, setPlayerInput] = useState('');
  const [playersList, setPlayersList] = useState(['Thendri', 'Budi', 'Andi', 'Siti', 'Rian', 'Eka', 'Deni', 'Fani']);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const totalRounds = activeTournament?.totalRounds || 4;
  const activeMatches = roundsMatches[currentRound] || [];
  const filteredTournaments = useMemo(() => {
    if (homeFilter === 'All') return tournaments;
    return tournaments.filter((tournament) => tournament.status === homeFilter);
  }, [homeFilter, tournaments]);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (!supabase || !activeTournament) return undefined;
    const channel = supabase
      .channel(`matches-${activeTournament.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `tournament_id=eq.${activeTournament.id}`
      }, () => fetchMatchesAndStandings(activeTournament.id))
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTournament]);

  async function fetchTournaments() {
    setIsLoading(true);
    setErrorMessage('');
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setErrorMessage(`Gagal memuat tournament: ${error.message}`);
    } else {
      const enrichedTournaments = await Promise.all((data || []).map(async (tournament) => {
        const { count } = await supabase
          .from('players')
          .select('id', { count: 'exact', head: true })
          .eq('tournament_id', tournament.id);
        return normalizeTournament({ ...tournament, players_count: count ?? tournament.players_count ?? 0 });
      }));
      setTournaments(enrichedTournaments);
      const sharedSlug = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tournament') : null;
      const sharedTournament = sharedSlug ? enrichedTournaments.find((item) => item.share_slug === sharedSlug || item.id === sharedSlug) : null;
      if (sharedTournament) openTournament(sharedTournament);
    }
    setIsLoading(false);
  }

  async function fetchMatchesAndStandings(tournamentId, tournamentForSetup = activeTournament) {
    if (!supabase) return;
    const [{ data: matchesData, error: matchesError }, { data: playersData, error: playersError }] = await Promise.all([
      supabase.from('matches').select('*').eq('tournament_id', tournamentId).order('round_number').order('court_number'),
      supabase.from('players').select('*').eq('tournament_id', tournamentId).order('name')
    ]);
    if (matchesError || playersError) {
      setErrorMessage(matchesError?.message || playersError?.message || 'Gagal memuat data tournament.');
      return;
    }
    const grouped = {};
    (matchesData || []).forEach((match) => {
      if (!grouped[match.round_number]) grouped[match.round_number] = [];
      grouped[match.round_number].push(mapRemoteMatch(match));
    });
    setRoundsMatches(grouped);
    setManagePlayers((playersData || []).map((player) => ({ id: player.id, name: player.name })));
    setManageCourts(normalizeTournament(tournamentForSetup || {}).courts || 1);
    setStandings(calculateStandings((playersData || []).map((player) => ({ id: player.id, name: player.name })), matchesData || []));
    setMatchLogs((matchesData || [])
      .filter((match) => match.is_completed)
      .sort((a, b) => (b.round_number - a.round_number) || (b.court_number - a.court_number))
      .map((match) => {
        const teamA = Array.isArray(match.team_a) ? match.team_a.join(' & ') : 'Team A';
        const teamB = Array.isArray(match.team_b) ? match.team_b.join(' & ') : 'Team B';
        return `Round ${match.round_number} · Court ${match.court_number} · ${teamA} ${match.score_a}–${match.score_b} ${teamB}`;
      }));
  }

  function handleAddPlayer() {
    const name = playerInput.trim();
    if (!name) return;
    if (playersList.some((player) => player.toLowerCase() === name.toLowerCase())) {
      setErrorMessage('Nama pemain tersebut sudah ada.');
      return;
    }
    setPlayersList((current) => [...current, name]);
    setPlayerInput('');
    setErrorMessage('');
  }

  function handleRemovePlayer(index) {
    setPlayersList((current) => current.filter((_, playerIndex) => playerIndex !== index));
  }

  async function handleCreateTournamentSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    const name = formName.trim() || 'New Tournament';
    const courts = clamp(Number(formCourts) || 1, 1, 20);
    const rounds = clamp(Number(formRounds) || 1, 1, 30);
    const targetPoints = clamp(Number(formPoints) || 21, 1, 99);
    if (playersList.length < 4) {
      setErrorMessage('Tambahkan minimal 4 pemain untuk membuat tournament.');
      return;
    }
    if (playersList.length < courts * 4) {
      setErrorMessage(`Jumlah pemain belum cukup untuk ${courts} court. Tambahkan minimal ${courts * 4} pemain.`);
      return;
    }

    setIsSaving(true);
    try {
      const schedule = buildSchedule(playersList, rounds, courts);
      let tournamentId = `local-${Date.now()}`;
      let savedMatches = [];

      if (supabase) {
        const { data: tournamentData, error: tournamentError } = await supabase
          .from('tournaments')
          .insert([{
            name,
            match_type: formMatchType,
            target_points: targetPoints,
            court_count: courts,
            total_rounds: rounds,
            status: 'Active'
          }])
          .select()
          .single();
        if (tournamentError) throw tournamentError;
        tournamentId = tournamentData.id;

        const { error: playersError } = await supabase.from('players').insert(
          playersList.map((playerName) => ({
            tournament_id: tournamentId,
            name: playerName,
            matches_played: 0,
            wins: 0,
            points_for: 0,
            points_against: 0
          }))
        );
        if (playersError) throw playersError;

        const { data: matchData, error: matchesError } = await supabase
          .from('matches')
          .insert(schedule.matchRows.map((row) => ({ ...row, tournament_id: tournamentId })))
          .select();
        if (matchesError) throw matchesError;
        savedMatches = matchData || [];
      }

      const localRounds = { ...schedule.rounds };
      if (savedMatches.length) {
        savedMatches.forEach((remoteMatch) => {
          const roundMatches = localRounds[remoteMatch.round_number] || [];
          const localMatch = roundMatches.find((match) => match.courtName === `Court ${remoteMatch.court_number}`);
          if (localMatch) localMatch.id = remoteMatch.id;
        });
      }

      const newTournament = normalizeTournament({
        id: tournamentId,
        name,
        match_type: formMatchType,
        court_count: courts,
        total_rounds: rounds,
        players_count: playersList.length,
        status: 'Active',
        created_at: new Date().toISOString()
      });
      setTournaments((current) => [newTournament, ...current.filter((item) => item.id !== tournamentId)]);
      setActiveTournament(newTournament);
      setRoundsMatches(localRounds);
      setStandings(calculateStandings(playersList, []));
      setMatchLogs([]);
      setCurrentRound(1);
      setDetailTab('MATCHES');
      setCurrentView('TOURNAMENT_DETAIL');
      if (supabase) await fetchMatchesAndStandings(tournamentId, newTournament);
    } catch (error) {
      setErrorMessage(error.message || 'Tournament gagal dibuat.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleScoreChange(matchId, team, value) {
    if (!/^\d*$/.test(value)) return;
    setRoundsMatches((current) => ({
      ...current,
      [currentRound]: (current[currentRound] || []).map((match) => match.id === matchId ? { ...match, [team]: value } : match)
    }));
  }

  async function handleSubmitScore(matchId) {
    const match = activeMatches.find((item) => item.id === matchId);
    if (!match || match.score1 === '' || match.score2 === '') {
      setErrorMessage('Masukkan skor kedua tim terlebih dahulu.');
      return;
    }
    const score1 = Number(match.score1);
    const score2 = Number(match.score2);
    const targetPoints = Number(activeTournament?.target_points || formPoints || 21);
    if (score1 < 0 || score2 < 0 || score1 > 99 || score2 > 99 || score1 === score2) {
      setErrorMessage('Skor harus valid dan tidak boleh seri.');
      return;
    }
    if (score1 > targetPoints + 30 || score2 > targetPoints + 30) {
      setErrorMessage(`Skor terlihat terlalu besar untuk target ${targetPoints} poin.`);
      return;
    }

    setErrorMessage('');
    if (supabase && activeTournament && !String(match.id).startsWith('local-')) {
      const { error } = await supabase.from('matches').update({
        score_a: score1,
        score_b: score2,
        is_completed: true
      }).eq('id', match.id);
      if (error) {
        setErrorMessage(`Skor gagal disimpan: ${error.message}`);
        return;
      }
      const team1Names = [match.team1.name1, match.team1.name2];
      const team2Names = [match.team2.name1, match.team2.name2];
      const { data: playerRows, error: playerRowsError } = await supabase
        .from('players')
        .select('id,name,matches_played,wins,points_for,points_against')
        .eq('tournament_id', activeTournament.id)
        .in('name', [...team1Names, ...team2Names]);
      if (playerRowsError) {
        setErrorMessage(`Skor tersimpan, tetapi statistik belum diperbarui: ${playerRowsError.message}`);
      } else {
        const statUpdates = (playerRows || []).map((player) => {
          const isTeam1 = team1Names.includes(player.name);
          const pointsFor = isTeam1 ? score1 : score2;
          const pointsAgainst = isTeam1 ? score2 : score1;
          const won = (isTeam1 && score1 > score2) || (!isTeam1 && score2 > score1);
          return supabase.from('players').update({
            matches_played: Number(player.matches_played || 0) + 1,
            wins: Number(player.wins || 0) + (won ? 1 : 0),
            points_for: Number(player.points_for || 0) + pointsFor,
            points_against: Number(player.points_against || 0) + pointsAgainst
          }).eq('id', player.id);
        });
        await Promise.all(statUpdates);
      }
      await fetchMatchesAndStandings(activeTournament.id);
    } else {
      const updated = activeMatches.map((item) => item.id === matchId
        ? { ...item, score1: String(score1), score2: String(score2), submitted: true }
        : item);
      const nextRounds = { ...roundsMatches, [currentRound]: updated };
      setRoundsMatches(nextRounds);
      setStandings(calculateStandings(playersList, Object.values(nextRounds).flat()));
    }

    const team1 = `${match.team1.name1} & ${match.team1.name2}`;
    const team2 = `${match.team2.name1} & ${match.team2.name2}`;
    setMatchLogs((current) => [`Round ${currentRound} · ${match.courtName} · ${team1} ${score1}–${score2} ${team2}`, ...current]);
  }

  async function handleShareTournament() {
    if (!activeTournament) return;
    const slug = activeTournament.share_slug || activeTournament.id;
    const shareUrl = `${window.location.origin}${window.location.pathname}?tournament=${encodeURIComponent(slug)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: activeTournament.name, text: `Live tournament: ${activeTournament.name}`, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setShareNotice('Share link copied');
        window.setTimeout(() => setShareNotice(''), 2600);
      } else {
        window.prompt('Copy this share link', shareUrl);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') setErrorMessage('Share link belum dapat dibagikan dari browser ini.');
    }
  }

  async function handleManageAddPlayer() {
    const name = managePlayerInput.trim();
    if (!name || !activeTournament) return;
    if (managePlayers.some((player) => player.name.toLowerCase() === name.toLowerCase())) {
      setErrorMessage('Nama pemain tersebut sudah ada.');
      return;
    }
    setIsManaging(true);
    try {
      let newPlayer = { id: `local-player-${Date.now()}`, name };
      if (supabase && !String(activeTournament.id).startsWith('local-')) {
        const { data, error } = await supabase
          .from('players')
          .insert([{ tournament_id: activeTournament.id, name, matches_played: 0, wins: 0, points_for: 0, points_against: 0 }])
          .select('id,name')
          .single();
        if (error) throw error;
        newPlayer = data;
      }
      setManagePlayers((current) => [...current, newPlayer]);
      setManagePlayerInput('');
      setErrorMessage('');
      if (supabase && !String(activeTournament.id).startsWith('local-')) {
        await fetchMatchesAndStandings(activeTournament.id, activeTournament);
      }
    } catch (error) {
      setErrorMessage(`Pemain gagal ditambahkan: ${error.message}`);
    } finally {
      setIsManaging(false);
    }
  }

  async function handleManageRemovePlayer(player) {
    if (!activeTournament) return;
    if (managePlayers.length <= 4) {
      setErrorMessage('Tournament harus memiliki minimal 4 pemain.');
      return;
    }
    setIsManaging(true);
    try {
      if (supabase && !String(player.id).startsWith('local-')) {
        const { error } = await supabase.from('players').delete().eq('id', player.id);
        if (error) throw error;
      }
      setManagePlayers((current) => current.filter((item) => item.id !== player.id));
      setErrorMessage('');
      if (supabase && !String(activeTournament.id).startsWith('local-')) {
        await fetchMatchesAndStandings(activeTournament.id, activeTournament);
      }
    } catch (error) {
      setErrorMessage(`Pemain gagal dihapus: ${error.message}`);
    } finally {
      setIsManaging(false);
    }
  }

  async function handleRegenerateSchedule() {
    if (!activeTournament) return;
    const courts = clamp(Number(manageCourts) || 1, 1, 20);
    const rounds = clamp(Number(activeTournament.totalRounds) || 1, 1, 30);
    const currentMatches = Object.values(roundsMatches).flat();
    if (currentMatches.some((match) => match.submitted)) {
      setErrorMessage('Jadwal tidak dapat dibuat ulang setelah ada skor yang selesai. Buat tournament baru untuk jadwal berbeda.');
      return;
    }
    if (managePlayers.length < courts * 4) {
      setErrorMessage(`Jumlah pemain belum cukup untuk ${courts} court. Tambahkan minimal ${courts * 4} pemain.`);
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(`Regenerate ${rounds} rounds untuk ${managePlayers.length} players dan ${courts} courts? Match yang belum selesai akan diganti.`)) return;

    setIsManaging(true);
    try {
      const schedule = buildSchedule(managePlayers.map((player) => player.name), rounds, courts);
      let nextRounds = { ...schedule.rounds };
      if (supabase && !String(activeTournament.id).startsWith('local-')) {
        const { error: deleteError } = await supabase
          .from('matches')
          .delete()
          .eq('tournament_id', activeTournament.id)
          .eq('is_completed', false);
        if (deleteError) throw deleteError;
        const { data: insertedMatches, error: insertError } = await supabase
          .from('matches')
          .insert(schedule.matchRows.map((row) => ({ ...row, tournament_id: activeTournament.id })))
          .select();
        if (insertError) throw insertError;
        (insertedMatches || []).forEach((remoteMatch) => {
          const roundMatches = nextRounds[remoteMatch.round_number] || [];
          const localMatch = roundMatches.find((match) => match.courtName === `Court ${remoteMatch.court_number}`);
          if (localMatch) localMatch.id = remoteMatch.id;
        });
      }
      setRoundsMatches(nextRounds);
      setCurrentRound(1);
      setMatchLogs([]);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(`Jadwal gagal dibuat ulang: ${error.message}`);
    } finally {
      setIsManaging(false);
    }
  }

  async function handleSaveCourtCount() {
    if (!activeTournament) return;
    const courts = clamp(Number(manageCourts) || 1, 1, 20);
    if (managePlayers.length < courts * 4) {
      setErrorMessage(`Jumlah pemain belum cukup untuk ${courts} court. Tambahkan minimal ${courts * 4} pemain.`);
      return;
    }
    setIsManaging(true);
    try {
      if (supabase && !String(activeTournament.id).startsWith('local-')) {
        const { error } = await supabase.from('tournaments').update({ court_count: courts }).eq('id', activeTournament.id);
        if (error) throw error;
      }
      const updatedTournament = { ...activeTournament, courts };
      setActiveTournament(updatedTournament);
      setTournaments((current) => current.map((item) => item.id === updatedTournament.id ? updatedTournament : item));
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(`Pengaturan court gagal disimpan: ${error.message}`);
    } finally {
      setIsManaging(false);
    }
  }

  function openTournament(tournament) {
    const normalized = normalizeTournament(tournament);
    setActiveTournament(normalized);
    setCurrentRound(1);
    setDetailTab('MATCHES');
    setShareNotice('');
    setShowManage(false);
    setCurrentView('TOURNAMENT_DETAIL');
    if (typeof window !== 'undefined') {
      const slug = normalized.share_slug || normalized.id;
      window.history.replaceState({}, '', `${window.location.pathname}?tournament=${encodeURIComponent(slug)}`);
    }
    fetchMatchesAndStandings(normalized.id, normalized);
  }

  function goHome() {
    setCurrentView('HOME');
    setActiveTournament(null);
    setErrorMessage('');
    setShareNotice('');
    if (typeof window !== 'undefined') window.history.replaceState({}, '', window.location.pathname);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={goHome} aria-label="Kembali ke home">
          <span className="brand-mark">P</span>
          <span>
            <strong>PDLUP</strong>
            <small>Padel Matchmaker</small>
          </span>
        </button>
        <div className="topbar-actions">
          {currentView === 'TOURNAMENT_DETAIL' && <button className="ghost-button" onClick={goHome}>← Tournaments</button>}
          <button className="icon-button" aria-label="Settings">⚙</button>
        </div>
      </header>

      {errorMessage && (
        <div className="alert alert-error" role="alert">
          <span>!</span>
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} aria-label="Tutup notifikasi">×</button>
        </div>
      )}

      {currentView === 'HOME' && (
        <section className="page-container home-page">
          <div className="page-heading">
            <div>
              <p className="eyebrow">WELCOME BACK</p>
              <h1>Your next rally starts here.</h1>
              <p className="muted">Create balanced matches, track scores, and keep the group moving.</p>
            </div>
            <button className="primary-button" onClick={() => setCurrentView('CREATE')}>＋ Create Tournament</button>
          </div>

          <div className="filter-row" role="tablist" aria-label="Filter tournaments">
            {['All', 'Active', 'Past'].map((filter) => (
              <button key={filter} className={`filter-pill ${homeFilter === filter ? 'active' : ''}`} onClick={() => setHomeFilter(filter)}>{filter}</button>
            ))}
          </div>

          {isLoading ? (
            <div className="empty-card loading-card"><span className="spinner" /> Loading tournaments…</div>
          ) : filteredTournaments.length === 0 ? (
            <div className="empty-card">
              <div className="empty-icon">🎾</div>
              <h2>{homeFilter === 'All' ? 'No tournaments yet' : `No ${homeFilter.toLowerCase()} tournaments`}</h2>
              <p>{homeFilter === 'All' ? 'Create your first padel match to start live scoring.' : 'Try another filter or create a new tournament.'}</p>
              <button className="primary-button" onClick={() => setCurrentView('CREATE')}>＋ Create Tournament</button>
            </div>
          ) : (
            <div className="tournament-grid">
              {filteredTournaments.map((tournament) => (
                <button className="tournament-card" key={tournament.id} onClick={() => openTournament(tournament)}>
                  <span className={`status-dot ${tournament.status === 'Past' ? 'past' : ''}`} />
                  <span className="tournament-card-body">
                    <strong>{tournament.name}</strong>
                    <span>{tournament.matchType} · {tournament.courts} court · {tournament.totalRounds} rounds</span>
                    <small>{tournament.playersCount || '—'} players · {tournament.status}</small>
                  </span>
                  <span className="card-arrow">→</span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {currentView === 'CREATE' && (
        <section className="page-container narrow-page">
          <div className="page-heading compact-heading">
            <div>
              <p className="eyebrow">SETUP</p>
              <h1>Create tournament</h1>
              <p className="muted">Set the rules once. We’ll handle the rotation.</p>
            </div>
          </div>

          <form className="form-card" onSubmit={handleCreateTournamentSubmit}>
            <div className="form-section">
              <label htmlFor="tournament-name">Tournament name</label>
              <input id="tournament-name" value={formName} onChange={(event) => setFormName(event.target.value)} placeholder="e.g. Friday Night Padel" />
            </div>

            <div className="form-section">
              <label>Match type</label>
              <button type="button" className="select-control" onClick={() => setShowTypeDropdown((value) => !value)}>
                <span><strong>{formMatchType}</strong><small>{MATCH_TYPES.find((item) => item.title === formMatchType)?.desc}</small></span>
                <span>⌄</span>
              </button>
              {showTypeDropdown && (
                <div className="type-menu">
                  {MATCH_TYPES.map((item) => (
                    <button type="button" key={item.title} onClick={() => { setFormMatchType(item.title); setShowTypeDropdown(false); }}>
                      <strong>{item.title}</strong><small>{item.desc}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="form-grid">
              <div className="form-section">
                <label htmlFor="courts">Courts</label>
                <div className="stepper">
                  <button type="button" onClick={() => setFormCourts((value) => clamp(value - 1, 1, 20))}>−</button>
                  <input id="courts" type="number" min="1" max="20" value={formCourts} onChange={(event) => setFormCourts(clamp(Number(event.target.value) || 1, 1, 20))} />
                  <button type="button" onClick={() => setFormCourts((value) => clamp(value + 1, 1, 20))}>＋</button>
                </div>
                <small className="helper-text">4 players per court</small>
              </div>
              <div className="form-section">
                <label htmlFor="rounds">Number of rounds</label>
                <input id="rounds" type="number" min="1" max="30" value={formRounds} onChange={(event) => setFormRounds(clamp(Number(event.target.value) || 1, 1, 30))} />
                <small className="helper-text">Up to 30 rounds</small>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-section">
                <label htmlFor="points">Target points</label>
                <input id="points" type="number" min="1" max="99" value={formPoints} onChange={(event) => setFormPoints(event.target.value)} />
              </div>
              <div className="form-section rule-preview">
                <label>Schedule preview</label>
                <strong>{formRounds} rounds · {formCourts} {formCourts === 1 ? 'court' : 'courts'}</strong>
                <small>{formRounds * formCourts} matches will be created</small>
              </div>
            </div>

            <div className="form-section">
              <div className="label-row"><label htmlFor="player-name">Players</label><span className="count-badge">{playersList.length}</span></div>
              <div className="add-player-row">
                <input id="player-name" value={playerInput} onChange={(event) => setPlayerInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); handleAddPlayer(); } }} placeholder="Type a name and press Enter" />
                <button type="button" className="secondary-button" onClick={handleAddPlayer}>＋ Add</button>
              </div>
              <div className="player-chips">
                {playersList.map((player, index) => (
                  <span className="player-chip" key={`${player}-${index}`}>
                    <img src={avatarUrl(player)} alt="" />{player}<button type="button" onClick={() => handleRemovePlayer(index)} aria-label={`Remove ${player}`}>×</button>
                  </span>
                ))}
              </div>
              <small className="helper-text">Minimum 4 players. Add at least {formCourts * 4} for the selected courts.</small>
            </div>

            <button className="primary-button submit-button" type="submit" disabled={isSaving}>{isSaving ? 'Creating schedule…' : '＋ Create Tournament'}</button>
          </form>
        </section>
      )}

      {currentView === 'TOURNAMENT_DETAIL' && activeTournament && (
        <section className="page-container detail-page">
          <div className="detail-hero">
            <div>
              <p className="eyebrow">LIVE TOURNAMENT</p>
              <h1>{activeTournament.name}</h1>
              <p className="muted">{activeTournament.matchType} · {activeTournament.courts} {activeTournament.courts === 1 ? 'court' : 'courts'} · {activeTournament.totalRounds} rounds</p>
            </div>
            <div className="detail-hero-actions">
              <button className="share-button" onClick={() => setShowManage((value) => !value)}>{showManage ? '× Close' : '⚙ Manage'}</button>
              <button className="share-button" onClick={handleShareTournament}>↗ Share</button>
              <span className="live-badge"><i /> {activeTournament.status}</span>
            </div>
          </div>
          {shareNotice && <div className="share-notice" role="status">✓ {shareNotice}</div>}

          {showManage && (
            <div className="manage-panel">
              <div className="section-title"><div><p className="eyebrow">TOURNAMENT SETUP</p><h2>Manage players & courts</h2></div><span>{managePlayers.length} players</span></div>
              <div className="manage-grid">
                <div className="manage-section">
                  <label htmlFor="manage-player-input">Add player</label>
                  <div className="add-player-row">
                    <input id="manage-player-input" value={managePlayerInput} onChange={(event) => setManagePlayerInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); handleManageAddPlayer(); } }} placeholder="Player name" />
                    <button type="button" className="secondary-button" onClick={handleManageAddPlayer} disabled={isManaging}>＋ Add</button>
                  </div>
                  <div className="manage-player-list">
                    {managePlayers.map((player) => <div className="manage-player-row" key={player.id}><span><img src={avatarUrl(player.name)} alt="" />{player.name}</span><button type="button" onClick={() => handleManageRemovePlayer(player)} disabled={isManaging} aria-label={`Remove ${player.name}`}>Remove</button></div>)}
                  </div>
                  <small className="helper-text">Removing a player does not regenerate existing matches.</small>
                </div>
                <div className="manage-section">
                  <label htmlFor="manage-courts">Courts</label>
                  <div className="manage-court-control"><input id="manage-courts" type="number" min="1" max="20" value={manageCourts} onChange={(event) => setManageCourts(clamp(Number(event.target.value) || 1, 1, 20))} /><button type="button" className="primary-button" onClick={handleSaveCourtCount} disabled={isManaging}>{isManaging ? 'Saving…' : 'Save courts'}</button></div>
                  <small className="helper-text">Minimum 4 players per court. This changes the tournament setup for future scheduling.</small>
                </div>
                <div className="manage-section manage-regenerate">
                  <label>Schedule</label>
                  <p>Apply the latest player and court setup to all unfinished rounds.</p>
                  <button type="button" className="regenerate-button" onClick={handleRegenerateSchedule} disabled={isManaging}>↻ Regenerate schedule</button>
                  <small className="helper-text">Locked after any match has a final score.</small>
                </div>
              </div>
            </div>
          )}

          <div className="round-nav">
            <button disabled={currentRound === 1} onClick={() => setCurrentRound((value) => value - 1)}>← Previous</button>
            <div><small>ROUND</small><strong>{currentRound} <span>/ {totalRounds}</span></strong></div>
            <button disabled={currentRound === totalRounds} onClick={() => setCurrentRound((value) => value + 1)}>Next →</button>
          </div>

          <div className="detail-tabs" role="tablist">
            {[
              ['MATCHES', 'Live matches'],
              ['STANDINGS', 'Leaderboard'],
              ['LOGS', 'Activity']
            ].map(([tab, label]) => (
              <button key={tab} className={detailTab === tab ? 'active' : ''} onClick={() => setDetailTab(tab)}>{label}</button>
            ))}
          </div>

          {detailTab === 'MATCHES' && (
            <div className="match-grid">
              {activeMatches.length === 0 ? (
                <div className="empty-card"><div className="empty-icon">🗓️</div><h2>No matches in this round</h2><p>This round is not available in the database yet.</p></div>
              ) : activeMatches.map((match) => (
                <article className={`match-card ${match.submitted ? 'completed' : ''}`} key={match.id}>
                  <div className="match-card-header"><span>{match.courtName}</span><span className="match-type-badge" style={{ backgroundColor: match.badgeColor }}>{match.badge}</span></div>
                  <div className="team-row">
                    <div className="team-info"><div className="avatar-stack"><img src={match.team1.avatar1} alt="" /><img src={match.team1.avatar2} alt="" /></div><strong>{match.team1.name1} <em>&</em> {match.team1.name2}</strong></div>
                    <input aria-label={`Score ${match.team1.name1} ${match.team1.name2}`} type="text" inputMode="numeric" value={match.score1} disabled={match.submitted} onChange={(event) => handleScoreChange(match.id, 'score1', event.target.value)} placeholder="0" />
                  </div>
                  <div className="versus"><span />VS<span /></div>
                  <div className="team-row">
                    <div className="team-info"><div className="avatar-stack"><img src={match.team2.avatar1} alt="" /><img src={match.team2.avatar2} alt="" /></div><strong>{match.team2.name1} <em>&</em> {match.team2.name2}</strong></div>
                    <input aria-label={`Score ${match.team2.name1} ${match.team2.name2}`} type="text" inputMode="numeric" value={match.score2} disabled={match.submitted} onChange={(event) => handleScoreChange(match.id, 'score2', event.target.value)} placeholder="0" />
                  </div>
                  <div className="match-card-footer">
                    <span className={match.submitted ? 'complete-text' : 'pending-text'}>{match.submitted ? '● Score submitted' : '○ Waiting for score'}</span>
                    {!match.submitted && <button className="save-score-button" onClick={() => handleSubmitScore(match.id)}>Save score</button>}
                  </div>
                </article>
              ))}
            </div>
          )}

          {detailTab === 'STANDINGS' && (
            <div className="standings-card">
              <div className="section-title"><div><p className="eyebrow">CURRENT RANKING</p><h2>Leaderboard</h2></div><span>{standings.length} players</span></div>
              <div className="table-wrap"><table><thead><tr><th>#</th><th>Player</th><th>Played</th><th>Won</th><th>Points</th><th>Diff</th></tr></thead><tbody>
                {standings.map((player) => <tr key={player.id || player.name}><td className={player.pos <= 3 ? 'rank-top' : ''}>{String(player.pos).padStart(2, '0')}</td><td><div className="table-player"><img src={avatarUrl(player.name)} alt="" /><strong>{player.name}</strong></div></td><td>{player.played}</td><td className="win-cell">{player.w}</td><td>{player.pts}</td><td className={player.diff >= 0 ? 'positive' : 'negative'}>{player.diff > 0 ? `+${player.diff}` : player.diff}</td></tr>)}
              </tbody></table></div>
            </div>
          )}

          {detailTab === 'LOGS' && (
            <div className="logs-card"><div className="section-title"><div><p className="eyebrow">TOURNAMENT HISTORY</p><h2>Activity</h2></div><span>{matchLogs.length} completed</span></div>{matchLogs.length === 0 ? <div className="empty-inline">No completed matches yet.</div> : <div className="log-list">{matchLogs.map((log, index) => <div className="log-item" key={`${log}-${index}`}><span className="log-dot" /><span>{log}</span></div>)}</div>}</div>
          )}
        </section>
      )}

      {currentView === 'PROFILE' && (
        <section className="page-container narrow-page"><div className="profile-card"><div className="profile-avatar">T</div><p className="eyebrow">PROFILE</p><h1>Thendri</h1><p className="muted">Padel Community Organizer</p><div className="profile-stats"><div><strong>{tournaments.length}</strong><span>Tournaments</span></div><div><strong>—</strong><span>Matches</span></div><div><strong>10</strong><span>Coins</span></div></div></div></section>
      )}

      <nav className="bottom-nav">
        <button className={currentView === 'HOME' ? 'active' : ''} onClick={goHome}><span>⌂</span><small>Home</small></button>
        <button className="create-fab" onClick={() => setCurrentView('CREATE')} aria-label="Create tournament">＋</button>
        <button className={currentView === 'PROFILE' ? 'active' : ''} onClick={() => setCurrentView('PROFILE')}><span>◯</span><small>Profile</small></button>
      </nav>
    </main>
  );
}
