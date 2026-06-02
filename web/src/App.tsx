import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';

import { AuthProvider } from '@/auth/AuthProvider';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
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
  SignInScreen,
  SignUpScreen,
  SquadScreen,
  TeamOfTheWeekScreen,
  TopPlayersScreen,
  TransferScreen,
  WatchlistScreen,
} from '@/screens';

const queryClient = new QueryClient();
const watchlistRepo = new LocalStorageWatchlistRepository();
const playerWatchlistRepo = new LocalStoragePlayerWatchlistRepository();

function MyTeamProtectedRoute({ children }: { children: React.ReactNode }) {
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
      <Route path="/sign-in" element={<SignInScreen />} />
      <Route path="/sign-up" element={<SignUpScreen />} />
      <Route
        path="/history"
        element={
          <MyTeamProtectedRoute>
            <GameweekHistoryScreen teamId={myTeamId!} />
          </MyTeamProtectedRoute>
        }
      />
      <Route
        path="/stats"
        element={
          <MyTeamProtectedRoute>
            <LeaguesStatsScreen teamId={myTeamId!} />
          </MyTeamProtectedRoute>
        }
      />
      <Route
        path="/review"
        element={
          <MyTeamProtectedRoute>
            <GameweekReviewScreen teamId={myTeamId!} />
          </MyTeamProtectedRoute>
        }
      />
      <Route
        path="/team-of-the-week"
        element={
          <MyTeamProtectedRoute>
            <TeamOfTheWeekScreen />
          </MyTeamProtectedRoute>
        }
      />
      <Route
        path="/top-players"
        element={
          <MyTeamProtectedRoute>
            <TopPlayersScreen />
          </MyTeamProtectedRoute>
        }
      />
      <Route
        path="/transfers"
        element={
          <MyTeamProtectedRoute>
            <TransferScreen teamId={myTeamId!} />
          </MyTeamProtectedRoute>
        }
      />
      <Route path="/watchlist" element={<ProtectedRoute />}>
        <Route index element={<WatchlistScreen />} />
      </Route>
      <Route
        path="/leagues/:leagueId/standings"
        element={
          <MyTeamProtectedRoute>
            <LeagueStandingsScreen />
          </MyTeamProtectedRoute>
        }
      />
      <Route path="/player-watchlist" element={<ProtectedRoute />}>
        <Route index element={<PlayerWatchlistScreen />} />
      </Route>
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
                  <AuthProvider>
                    <AppContent />
                  </AuthProvider>
                </BrowserRouter>
              </MyTeamProvider>
            </PlayerWatchlistPremiumProvider>
          </ToastProvider>
        </PlayerWatchlistRepositoryContext.Provider>
      </WatchlistRepositoryContext.Provider>
    </QueryClientProvider>
  );
}
