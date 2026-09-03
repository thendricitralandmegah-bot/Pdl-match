# Session Manager Gap Audit

| Capability | Current state | Required direction |
|---|---|---|
| Core object | Tournament-oriented naming and copy | Rename user-facing model to Session while preserving compatibility during migration |
| Navigation | Home and Profile, with create FAB | Add Discover/session browsing and make Create Session the primary action |
| Setup | Basic modal with name, date, location, format, players, courts, rounds, points, visibility | Convert to a dedicated scrollable session setup flow with scoring modes, advanced settings, player list, and simulation |
| Player entry | Host can add names inside the detail modal; viewer join uses prompt | Add inline editable player rows, remove actions, duplicate prevention, and roster summary |
| Pairing | Cost-based pairing exists and rotates through rounds | Retain engine, add explicit format modes and round simulation before creation |
| Scoring | Numeric score save with upper-bound and tie validation | Add scoring type model and format-aware validation |
| Courts | Court count exists and generated matches use court numbers | Add court stepper, availability state, and clear court assignment in the session dashboard |
| Dashboard | Overview, Matches, Leaderboard, Activity tabs | Reframe around current session, current round, active courts, rest players, and next action |
| Leaderboard | Points, W-L-T, diff, and total points are present | Add compensation points and sorting rules as configurable settings |
| Admin actions | Delete and share controls exist | Add edit, simulation, export, and safer context menu grouping |
| Persistence | Supabase auth and core tournament/match/player reads/writes exist | Extend schema and RLS policies for session configuration, membership, and realtime updates |
| Branding | PD-Match Dadakan / tournament terminology | Decide final brand as Padel Match or Padel Session Manager and update all copy consistently |

## Recommended build order

First, migrate the user-facing language and information architecture from tournament to session. Second, build the session setup flow with scoring configuration, player entry, and simulation. Third, strengthen the live session dashboard and explicit format-aware pairing. Fourth, add the missing profile, discovery, realtime, and administration surfaces.
