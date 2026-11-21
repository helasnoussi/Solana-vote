import { NavLink, Route, Routes } from 'react-router-dom';
import { WalletButton } from './components/WalletButton';
import { Dashboard } from './pages/Dashboard';
import { Explore } from './pages/Explore';
import { CreatePoll } from './pages/CreatePoll';
import { PollPage } from './pages/PollPage';
import { MyVotes } from './pages/MyVotes';

const NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/polls', label: 'Explore' },
  { to: '/create', label: 'Create' },
  { to: '/my-votes', label: 'My votes' },
];

export function App() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <NavLink to="/" className="text-lg font-bold">
              Solana<span className="text-violet-400">Vote</span>
            </NavLink>
            <nav className="flex gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
              ● Devnet
            </span>
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/polls" element={<Explore />} />
          <Route path="/polls/:address" element={<PollPage />} />
          <Route path="/create" element={<CreatePoll />} />
          <Route path="/my-votes" element={<MyVotes />} />
          <Route path="*" element={<p className="text-slate-400">Page not found.</p>} />
        </Routes>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-600">
        Votes are public and stored on Solana Devnet · one vote per wallet
      </footer>
    </div>
  );
}
