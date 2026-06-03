import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AuthUser } from '@/auth/auth-client';
import { AuthContext, AuthContextValue } from '@/auth/AuthContext';
import { MyTeamContext, MyTeamContextValue } from '@/lib/my-team/MyTeamContext';

vi.mock('@/screens', () => ({
  EntryScreen: () => <div data-testid="entry-screen" />,
  SquadScreen: ({ teamId, isGuest }: { teamId: number; isGuest?: boolean }) => (
    <div data-testid="squad-screen" data-team-id={teamId} data-guest={isGuest ? 'true' : undefined} />
  ),
  SignInScreen: () => <div data-testid="sign-in-screen" />,
  SignUpScreen: () => <div data-testid="sign-up-screen" />,
  ForgotPasswordScreen: () => <div data-testid="forgot-password-screen" />,
  ResetPasswordScreen: () => <div data-testid="reset-password-screen" />,
  GameweekHistoryScreen: () => <div data-testid="history-screen" />,
  GameweekReviewScreen: () => <div data-testid="review-screen" />,
  LeaguesStatsScreen: () => <div data-testid="stats-screen" />,
  LeagueStandingsScreen: () => <div data-testid="standings-screen" />,
  TeamOfTheWeekScreen: () => <div data-testid="totw-screen" />,
  TopPlayersScreen: () => <div data-testid="top-players-screen" />,
  TransferScreen: () => <div data-testid="transfer-screen" />,
  WatchlistScreen: () => <div data-testid="watchlist-screen" />,
  PlayerWatchlistScreen: () => <div data-testid="player-watchlist-screen" />,
}));

vi.mock('@/lib/player-watchlist-premium/PlayerWatchlistPremiumProvider', () => ({
  PlayerWatchlistPremiumProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/watchlist-repository', () => ({
  WatchlistRepositoryContext: { Provider: ({ children }: { children: React.ReactNode }) => <>{children}</> },
  LocalStorageWatchlistRepository: class {},
}));

vi.mock('@/lib/player-watchlist-repository', () => ({
  PlayerWatchlistRepositoryContext: { Provider: ({ children }: { children: React.ReactNode }) => <>{children}</> },
  LocalStoragePlayerWatchlistRepository: class {},
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Route, Routes, useSearchParams } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

import { useCurrentUser } from '@/auth/AuthContext';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { useMyTeam } from '@/lib/my-team/MyTeamContext';
import {
  EntryScreen,
  ForgotPasswordScreen,
  GameweekHistoryScreen,
  GameweekReviewScreen,
  LeaguesStatsScreen,
  LeagueStandingsScreen,
  PlayerWatchlistScreen,
  ResetPasswordScreen,
  SignInScreen,
  SignUpScreen,
  SquadScreen,
  TeamOfTheWeekScreen,
  TopPlayersScreen,
  TransferScreen,
  WatchlistScreen,
} from '@/screens';

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

  const viewedTeamId =
    searchParams.get('teamId') !== null ? Number(searchParams.get('teamId')) : null;

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
        path="/history"
        element={
          <AuthAndTeamProtectedRoute>
            <GameweekHistoryScreen teamId={myTeamId!} />
          </AuthAndTeamProtectedRoute>
        }
      />
      <Route
        path="/stats"
        element={
          <AuthAndTeamProtectedRoute>
            <LeaguesStatsScreen teamId={myTeamId!} />
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
        path="/team-of-the-week"
        element={
          <AuthAndTeamProtectedRoute>
            <TeamOfTheWeekScreen />
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

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function makeAuthCtx(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return { user: null, loading: false, refetch: vi.fn(), ...overrides };
}

function makeMyTeamCtx(overrides: Partial<MyTeamContextValue> = {}): MyTeamContextValue {
  return {
    myTeamId: null,
    isDemoMode: false,
    setMyTeamId: vi.fn(),
    setDemoTeamId: vi.fn(),
    clearDemoMode: vi.fn(),
    ...overrides,
  };
}

const baseUser: AuthUser = {
  id: '1',
  name: 'Test User',
  email: 'user@test.com',
  fplTeamId: null,
  emailVerified: true,
};

function renderAt(path: string, authCtx: AuthContextValue, myTeamCtx: MyTeamContextValue) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AuthContext.Provider value={authCtx}>
          <MyTeamContext.Provider value={myTeamCtx}>
            <AppContent />
          </MyTeamContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('App routing — root /', () => {
  it('renders nothing while auth is loading', () => {
    const { container } = renderAt('/', makeAuthCtx({ loading: true }), makeMyTeamCtx());
    expect(container.firstChild).toBeNull();
  });

  it('redirects unauthenticated non-demo user to /sign-in', () => {
    renderAt('/', makeAuthCtx(), makeMyTeamCtx());
    expect(screen.getByTestId('sign-in-screen')).toBeInTheDocument();
  });

  it('redirects unverified user to /sign-in', () => {
    renderAt(
      '/',
      makeAuthCtx({ user: { ...baseUser, emailVerified: false } }),
      makeMyTeamCtx()
    );
    expect(screen.getByTestId('sign-in-screen')).toBeInTheDocument();
  });

  it('redirects demo mode with no team id to /entry', () => {
    renderAt('/', makeAuthCtx(), makeMyTeamCtx({ isDemoMode: true, myTeamId: null }));
    expect(screen.getByTestId('entry-screen')).toBeInTheDocument();
  });

  it('renders SquadScreen in demo mode when team id is set', () => {
    renderAt('/', makeAuthCtx(), makeMyTeamCtx({ isDemoMode: true, myTeamId: 42 }));
    const squad = screen.getByTestId('squad-screen');
    expect(squad).toBeInTheDocument();
    expect(squad.getAttribute('data-team-id')).toBe('42');
  });

  it('renders EntryScreen when user has no fplTeamId', () => {
    renderAt('/', makeAuthCtx({ user: { ...baseUser, fplTeamId: null } }), makeMyTeamCtx());
    expect(screen.getByTestId('entry-screen')).toBeInTheDocument();
  });

  it('renders SquadScreen when user has fplTeamId', () => {
    renderAt(
      '/',
      makeAuthCtx({ user: { ...baseUser, fplTeamId: 99 } }),
      makeMyTeamCtx({ myTeamId: 99 })
    );
    const squad = screen.getByTestId('squad-screen');
    expect(squad).toBeInTheDocument();
    expect(squad.getAttribute('data-team-id')).toBe('99');
  });
});

describe('App routing — guest view /?teamId=', () => {
  it('redirects unauthenticated non-demo user to /sign-in for guest view', () => {
    renderAt('/?teamId=55', makeAuthCtx(), makeMyTeamCtx());
    expect(screen.getByTestId('sign-in-screen')).toBeInTheDocument();
  });

  it('renders guest SquadScreen for authenticated user', () => {
    renderAt(
      '/?teamId=55',
      makeAuthCtx({ user: { ...baseUser, fplTeamId: 99 } }),
      makeMyTeamCtx({ myTeamId: 99 })
    );
    const squad = screen.getByTestId('squad-screen');
    expect(squad.getAttribute('data-team-id')).toBe('55');
    expect(squad.getAttribute('data-guest')).toBe('true');
  });

  it('renders guest SquadScreen for demo user', () => {
    renderAt('/?teamId=55', makeAuthCtx(), makeMyTeamCtx({ isDemoMode: true, myTeamId: 42 }));
    const squad = screen.getByTestId('squad-screen');
    expect(squad.getAttribute('data-team-id')).toBe('55');
    expect(squad.getAttribute('data-guest')).toBe('true');
  });
});

describe('App routing — AuthAndTeamProtectedRoute', () => {
  it('redirects to /sign-in for unauthenticated user on /history', () => {
    renderAt('/history', makeAuthCtx(), makeMyTeamCtx());
    expect(screen.getByTestId('sign-in-screen')).toBeInTheDocument();
  });

  it('redirects to /entry when user has no team id on /history', () => {
    renderAt('/history', makeAuthCtx({ user: { ...baseUser } }), makeMyTeamCtx({ myTeamId: null }));
    expect(screen.getByTestId('entry-screen')).toBeInTheDocument();
  });

  it('renders protected screen when user and team id are present', () => {
    renderAt(
      '/history',
      makeAuthCtx({ user: { ...baseUser, fplTeamId: 99 } }),
      makeMyTeamCtx({ myTeamId: 99 })
    );
    expect(screen.getByTestId('history-screen')).toBeInTheDocument();
  });
});
