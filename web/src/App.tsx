/**
 * Main App component with routing.
 * Team ID and gameweek are URL query parameters.
 */

import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { EntryScreen, SquadScreen } from '@/screens';

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
