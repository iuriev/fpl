import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, useSearchParams } from 'react-router-dom';

import { PlayerWatchlistPremiumProvider } from '@/lib/player-watchlist-premium';
import {
  LocalStoragePlayerWatchlistRepository,
  PlayerWatchlistRepositoryContext,
} from '@/lib/player-watchlist-repository';
import { ToastProvider } from '@/lib/toast';
import {
  LocalStorageWatchlistRepository,
  WatchlistRepositoryContext,
} from '@/lib/watchlist-repository';
import {
  EntryScreen,
  GameweekHistoryScreen,
  GameweekReviewScreen,
  LeaguesStatsScreen,
  LeagueStandingsScreen,
  PlayerWatchlistScreen,
  SquadScreen,
  TeamOfTheWeekScreen,
  TopPlayersScreen,
  TransferScreen,
  WatchlistScreen,
} from '@/screens';

const queryClient = new QueryClient();
const watchlistRepo = new LocalStorageWatchlistRepository();
const playerWatchlistRepo = new LocalStoragePlayerWatchlistRepository();

function AppContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const teamId = searchParams.get('teamId') ? Number(searchParams.get('teamId')) : null;

  return (
    <Routes>
      <Route
        path="/"
        element={
          teamId ? (
            <SquadScreen teamId={teamId} />
          ) : (
            <EntryScreen
              onSubmit={(id) => {
                setSearchParams({ teamId: String(id) });
              }}
            />
          )
        }
      />
      <Route
        path="/history"
        element={
          teamId ? (
            <GameweekHistoryScreen teamId={teamId} />
          ) : (
            <EntryScreen onSubmit={(id) => setSearchParams({ teamId: String(id) })} />
          )
        }
      />
      <Route
        path="/stats"
        element={
          teamId ? (
            <LeaguesStatsScreen teamId={teamId} />
          ) : (
            <EntryScreen onSubmit={(id) => setSearchParams({ teamId: String(id) })} />
          )
        }
      />
      <Route
        path="/review"
        element={
          teamId ? (
            <GameweekReviewScreen teamId={teamId} />
          ) : (
            <EntryScreen onSubmit={(id) => setSearchParams({ teamId: String(id) })} />
          )
        }
      />
      <Route path="/team-of-the-week" element={<TeamOfTheWeekScreen />} />
      <Route path="/top-players" element={<TopPlayersScreen />} />
      <Route
        path="/transfers"
        element={
          teamId ? (
            <TransferScreen teamId={teamId} />
          ) : (
            <EntryScreen onSubmit={(id) => setSearchParams({ teamId: String(id) })} />
          )
        }
      />
      <Route
        path="/watchlist"
        element={<WatchlistScreen userTeamId={teamId ?? undefined} />}
      />
      <Route path="/leagues/:leagueId/standings" element={<LeagueStandingsScreen />} />
      <Route path="/player-watchlist" element={<PlayerWatchlistScreen />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WatchlistRepositoryContext.Provider value={watchlistRepo}>
        <PlayerWatchlistRepositoryContext.Provider value={playerWatchlistRepo}>
          <ToastProvider>
            <PlayerWatchlistPremiumProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </PlayerWatchlistPremiumProvider>
          </ToastProvider>
        </PlayerWatchlistRepositoryContext.Provider>
      </WatchlistRepositoryContext.Provider>
    </QueryClientProvider>
  );
}
