import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';

import { useCurrentUser } from '@/auth/AuthContext';
import { AuthProvider } from '@/auth/AuthProvider';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { useMyTeam } from '@/lib/my-team/MyTeamContext';
import { MyTeamProvider } from '@/lib/my-team/MyTeamProvider';
import { PlayerWatchlistPremiumProvider } from '@/lib/player-watchlist-premium/PlayerWatchlistPremiumProvider';
import {
  ApiPlayerWatchlistRepository,
  PlayerWatchlistRepositoryContext,
} from '@/lib/player-watchlist-repository';
import { PremiumUpsellProvider } from '@/lib/premium-upsell/PremiumUpsellProvider';
import { StartupGate } from '@/lib/startup-readiness/StartupGate';
import { StartupReadinessProvider } from '@/lib/startup-readiness/StartupReadinessProvider';
import { ToastProvider } from '@/lib/toast';
import {
  ApiWatchlistRepository,
  WatchlistRepositoryContext,
} from '@/lib/watchlist-repository';
import {
  EntryScreen,
  FixturesCalendarScreen,
  ForgotPasswordScreen,
  GameweekReviewScreen,
  LeaderboardScreen,
  LeagueStandingsScreen,
  MyStatsScreen,
  PlayerWatchlistScreen,
  PredictedLineupsScreen,
  PredictedPointsScreen,
  PriceChangesScreen,
  ResetPasswordScreen,
  SignInScreen,
  SignUpScreen,
  SquadScreen,
  TopPlayersScreen,
  TransferScreen,
  WatchlistScreen,
} from '@/screens';

const queryClient = new QueryClient();
const watchlistRepo = new ApiWatchlistRepository();
const playerWatchlistRepo = new ApiPlayerWatchlistRepository();

function AuthAndTeamProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const { myTeamId } = useMyTeam();
  if (loading) return null;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!myTeamId) return <Navigate to="/entry" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { user, loading } = useCurrentUser();
  const { myTeamId, isDemoMode } = useMyTeam();
  const [searchParams] = useSearchParams();

  const viewedTeamId = searchParams.get('teamId') !== null ? Number(searchParams.get('teamId')) : null;

  const rootElement = () => {
    if (loading) return null;

    if (viewedTeamId) {
      if (!user && !isDemoMode) return <Navigate to="/sign-in" replace />;
      return <SquadScreen teamId={viewedTeamId} isGuest />;
    }

    if (!user && !isDemoMode) return <Navigate to="/sign-in" replace />;
    if (user && !user.emailVerified) return <Navigate to="/sign-in" replace />;
    if (isDemoMode && !myTeamId) return <Navigate to="/entry" state={{ demo: true }} replace />;
    if (isDemoMode && myTeamId) return <SquadScreen teamId={myTeamId} />;
    if (user && !user.fplTeamId) return <EntryScreen />;
    return <SquadScreen teamId={user!.fplTeamId!} />;
  };

  return (
    <Routes>
      <Route path="/" element={rootElement()} />
      <Route path="/sign-in" element={<SignInScreen />} />
      <Route path="/sign-up" element={<SignUpScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />
      <Route path="/entry" element={<EntryScreen />} />
      <Route
        path="/stats"
        element={
          <AuthAndTeamProtectedRoute>
            <MyStatsScreen teamId={myTeamId!} />
          </AuthAndTeamProtectedRoute>
        }
      />
      <Route
        path="/review"
        element={
          <AuthAndTeamProtectedRoute>
            <GameweekReviewScreen teamId={myTeamId!} />
          </AuthAndTeamProtectedRoute>
        }
      />
      <Route
        path="/top-players"
        element={
          <AuthAndTeamProtectedRoute>
            <TopPlayersScreen />
          </AuthAndTeamProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <AuthAndTeamProtectedRoute>
            <LeaderboardScreen />
          </AuthAndTeamProtectedRoute>
        }
      />
      <Route
        path="/predicted-points"
        element={
          <AuthAndTeamProtectedRoute>
            <PredictedPointsScreen />
          </AuthAndTeamProtectedRoute>
        }
      />
      <Route
        path="/predicted-lineups"
        element={
          <AuthAndTeamProtectedRoute>
            <PredictedLineupsScreen />
          </AuthAndTeamProtectedRoute>
        }
      />
      <Route
        path="/price-changes"
        element={
          <AuthAndTeamProtectedRoute>
            <PriceChangesScreen />
          </AuthAndTeamProtectedRoute>
        }
      />
      <Route
        path="/fixtures"
        element={
          <AuthAndTeamProtectedRoute>
            <FixturesCalendarScreen />
          </AuthAndTeamProtectedRoute>
        }
      />
      <Route
        path="/transfers"
        element={
          <AuthAndTeamProtectedRoute>
            <TransferScreen teamId={myTeamId!} />
          </AuthAndTeamProtectedRoute>
        }
      />
      <Route path="/watchlist" element={<ProtectedRoute />}>
        <Route index element={<WatchlistScreen />} />
      </Route>
      <Route
        path="/leagues/:leagueId/standings"
        element={
          <AuthAndTeamProtectedRoute>
            <LeagueStandingsScreen />
          </AuthAndTeamProtectedRoute>
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
      <StartupReadinessProvider>
        <StartupGate>
          <WatchlistRepositoryContext.Provider value={watchlistRepo}>
            <PlayerWatchlistRepositoryContext.Provider value={playerWatchlistRepo}>
              <ToastProvider>
                <PlayerWatchlistPremiumProvider>
                  <BrowserRouter>
                    <AuthProvider>
                      <MyTeamProvider>
                        <PremiumUpsellProvider>
                          <AppContent />
                        </PremiumUpsellProvider>
                      </MyTeamProvider>
                    </AuthProvider>
                  </BrowserRouter>
                </PlayerWatchlistPremiumProvider>
              </ToastProvider>
            </PlayerWatchlistRepositoryContext.Provider>
          </WatchlistRepositoryContext.Provider>
        </StartupGate>
      </StartupReadinessProvider>
    </QueryClientProvider>
  );
}
