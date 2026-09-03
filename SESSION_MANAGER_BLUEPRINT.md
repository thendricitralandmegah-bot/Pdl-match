# Padel Session Manager Blueprint

## Product direction

The product is a mobile-first session manager for organizing live padel sessions. A session is the core object, replacing the current tournament-first framing. The primary promise is to configure a session quickly, add players, assign courts and pairings, run rounds, capture scores, and keep everyone informed about the next rotation.

## Primary navigation

The reference experience uses a persistent bottom navigation with **Home**, **Discover**, and **Profile**. The central create action should open the session setup flow. A session dashboard uses a compact tab switcher for **Match Rounds** and **Leaderboard**.

## Session setup flow

The create screen should be a single, scrollable flow with progressive disclosure. The first section captures session name, format, date, time, venue, and courts. The scoring section supports point scoring, normal padel scoring, and games-and-sets as an extensible option. Point targets should include 16, 21, 24, 32, and undefined. Advanced settings should be collapsed by default and cover leaderboard sorting, tiebreak rules, and player ordering.

Players should be entered directly in the setup screen as names or usernames. Each entry needs edit and remove actions. The setup should provide an immediate simulation summary, including estimated rounds, active courts, and resting players.

## Supported formats

The initial format model should support Americano, Mexicano, King of the Court, Club, Bracket, Group Stage, Friendly, and Custom. Americano emphasizes balanced individual participation and changing partners. Mexicano uses temporary standings to influence later pairings. King of the Court moves winners up and losers down across courts.

## Session dashboard

The dashboard should show the current round, court assignments, active pairs, scores, and a clearly labeled **Rest Players** area. Core actions are **Generate Round**, **Reshuffle**, **Submit Score**, **Finish Round**, and **Simulation**. The leaderboard should expose games played, wins, losses, ties, point difference, compensation points, and total points.

## Important safeguards

When the player count is not divisible by four, creation should explain that some players will rest and that compensation points may be applied. Scoring must reject negative values, values above the configured maximum, and invalid ties where the selected scoring mode disallows them. Administrative actions should be grouped into a context menu containing edit, share, export, simulation, and delete.

## Visual direction

Use a clean white and deep-blue visual system with generous spacing, rounded cards, compact tables, and a clear hierarchy. Premium or PRO features should be visibly labeled rather than silently disabled. The interface should remain usable on a phone first, with desktop layouts expanding the same information rather than introducing a separate workflow.
