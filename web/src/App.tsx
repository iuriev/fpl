import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, useSearchParams } from 'react-router-dom';

import { DreamTeamScreen, EntryScreen, GameweekHistoryScreen, LeaguesStatsScreen, SquadScreen } from '@/screens';

const queryClient = new QueryClient();

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
        element={teamId ? <GameweekHistoryScreen teamId={teamId} /> : <EntryScreen onSubmit={(id) => setSearchParams({ teamId: String(id) })} />}
      />
      <Route
        path="/stats"
        element={teamId ? <LeaguesStatsScreen teamId={teamId} /> : <EntryScreen onSubmit={(id) => setSearchParams({ teamId: String(id) })} />}
      />
      <Route path="/dream-team" element={<DreamTeamScreen />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
