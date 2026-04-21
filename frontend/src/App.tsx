import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WagmiProvider }                from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster }                      from 'react-hot-toast';
import { wagmiConfig }                  from './config/wagmi';
import { Layout }                       from './components/Layout';
import { Home }                         from './pages/Home';
import { CreateClaim }                  from './pages/CreateClaim';
import { Claim }                        from './pages/Claim';
import { Dashboard }                    from './pages/Dashboard';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:             2,
      staleTime:         30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#4E342E',
                color:       '#D7CCC8',
                border:      '1px solid #6D4C41',
                fontFamily:  '"DM Sans", sans-serif',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index                    element={<Home />} />
              <Route path="create"            element={<CreateClaim />} />
              <Route path="claim/:claimId/:secret" element={<Claim />} />
              <Route path="dashboard"         element={<Dashboard />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
