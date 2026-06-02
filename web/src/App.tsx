import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';

import { useMyTeam } from '@/lib/my-team/MyTeamContext';
import { MyTeamProvider } from '@/lib/my-team/MyTeamProvider';
import { PlayerWatchlistPremiumProvider } from '@/lib/player-watchlist-premium/PlayerWatchlistPremiumProvider';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { myTeamId } = useMyTeam();
  if (!myTeamId) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { myTeamId, setMyTeamId } = useMyTeam();
  const [searchParams] = useSearchParams();

  const viewedTeamId = searchParams.get('teamId') !== null ? Number(searchParams.get('teamId')) : null;

  const rootElement = () => {
    if (viewedTeamId) {
      if (!myTeamId) return <Navigate to="/" replace />;
      return <SquadScreen teamId={viewedTeamId} isGuest />;
    }
    if (myTeamId) return <SquadScreen teamId={myTeamId} />;
    return <EntryScreen onSubmit={(id) => setMyTeamId(id)} />;
  };

  return (
    <Routes>
      <Route path="/" element={rootElement()} />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <GameweekHistoryScreen teamId={myTeamId!} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <LeaguesStatsScreen teamId={myTeamId!} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/review"
        element={
          <ProtectedRoute>
            <GameweekReviewScreen teamId={myTeamId!} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team-of-the-week"
        element={
          <ProtectedRoute>
            <TeamOfTheWeekScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/top-players"
        element={
          <ProtectedRoute>
            <TopPlayersScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transfers"
        element={
          <ProtectedRoute>
            <TransferScreen teamId={myTeamId!} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/watchlist"
        element={
          <ProtectedRoute>
            <WatchlistScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leagues/:leagueId/standings"
        element={
          <ProtectedRoute>
            <LeagueStandingsScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/player-watchlist"
        element={
          <ProtectedRoute>
            <PlayerWatchlistScreen />
          </ProtectedRoute>
        }
      />
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
              <MyTeamProvider>
                <BrowserRouter>
                  <AppContent />
                </BrowserRouter>
              </MyTeamProvider>
            </PlayerWatchlistPremiumProvider>
          </ToastProvider>
        </PlayerWatchlistRepositoryContext.Provider>
      </WatchlistRepositoryContext.Provider>
    </QueryClientProvider>
  );
}
