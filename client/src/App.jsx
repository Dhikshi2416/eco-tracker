import { useEffect, useMemo, useState } from 'react';
import './index.css';
import { useAppStore } from './store/useAppStore';
import { authAPI, tipsAPI } from './api';
import ActionForm from './components/ActionForm';

const CAT_ICONS = {
  transport: '🚗',
  food: '🥗',
  energy: '⚡',
  waste: '♻️',
  water: '💧',
};

function useAuth() {
  const setUser = useAppStore((s) => s.setUser);
  const [user, setLocalUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('eco_token');
    const rawUser = localStorage.getItem('eco_user');
    if (token && rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        setLocalUser(parsed);
        setUser(parsed);
      } catch {
        localStorage.removeItem('eco_user');
      }
    }
  }, [setUser]);

  const login = async (mode, data) => {
    const fn = mode === 'login' ? authAPI.login : authAPI.register;
    const res = await fn(data);
    localStorage.setItem('eco_token', res.token);
    localStorage.setItem('eco_user', JSON.stringify(res.user));
    setUser(res.user);
    setLocalUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('eco_token');
    localStorage.removeItem('eco_user');
    setUser(null);
    setLocalUser(null);
  };

  return { user, login, logout };
}

function AuthScreen({ onAuthenticated }) {
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user =
        mode === 'login'
          ? await login('login', { email, password })
          : await login('register', { name: name || 'Eco User', email, password });
      onAuthenticated(user);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="auth-card">
        <div className="auth-logo" style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="logo-mark" style={{ fontSize: 32, display: 'block', marginBottom: 4 }}>
            🌿 EcoTrack
          </span>
          <p style={{ fontSize: 14, color: 'var(--text3)' }}>Track your impact on the planet</p>
        </div>
        <div className="auth-tabs" style={{ display: 'flex', marginBottom: 24, background: 'var(--bg3)', borderRadius: 14, padding: 4 }}>
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            type="button"
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 8,
              border: 'none',
              background: mode === 'login' ? 'var(--card)' : 'none',
              color: mode === 'login' ? 'var(--text)' : 'var(--text3)',
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            type="button"
            onClick={() => setMode('register')}
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 8,
              border: 'none',
              background: mode === 'register' ? 'var(--card)' : 'none',
              color: mode === 'register' ? 'var(--text)' : 'var(--text3)',
              cursor: 'pointer',
            }}
          >
            Register
          </button>
        </div>
        <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Green" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: 13 }} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>
      </div>
    </div>
  );
}

function StatCards({ stats, rank }) {
  const totalCo2 = stats?.totalCo2 ?? 0;
  const streak = stats?.streak ?? 0;
  const totalActions = stats?.totalActions ?? 0;
  const weekCo2 = stats?.weekCo2 ?? 0;
  const weekActions = stats?.weekActions ?? 0;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">🍃</div>
        <div className="stat-val" style={{ color: 'var(--accent)' }}>
          {totalCo2.toFixed(1)}
        </div>
        <div className="stat-label">kg CO₂ Saved</div>
        <div className="stat-change" style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6 }}>
          ↑ {weekCo2.toFixed(1)} this week
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🔥</div>
        <div className="stat-val" style={{ color: 'var(--gold)' }}>
          {streak}
        </div>
        <div className="stat-label">Day Streak</div>
        <div className="stat-change" style={{ fontSize: 12, color: 'var(--gold)', marginTop: 6 }}>
          {streak > 0 ? 'On fire!' : 'Start today!'}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">⚡</div>
        <div className="stat-val" style={{ color: '#6ab0ff' }}>
          {totalActions}
        </div>
        <div className="stat-label">Total Actions</div>
        <div className="stat-change" style={{ fontSize: 12, color: '#6ab0ff', marginTop: 6 }}>
          {weekActions} this week
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🏆</div>
        <div className="stat-val" style={{ color: 'var(--warn)' }}>
          {rank ? `#${rank}` : '–'}
        </div>
        <div className="stat-label">Leaderboard Rank</div>
        <div className="stat-change" style={{ fontSize: 12, color: 'var(--warn)', marginTop: 6 }}>
          Global ranking
        </div>
      </div>
    </div>
  );
}

function RecentActions({ actions }) {
  const recent = (actions || []).slice(0, 5);
  if (!recent.length) {
    return (
      <div className="empty">
        <div className="empty-icon">🌱</div>
        <div className="empty-text">No actions yet</div>
        <div className="empty-sub">Log your first eco action!</div>
      </div>
    );
  }
  return (
    <div className="action-feed">
      {recent.map((a) => (
        <div key={a.id} className="action-item">
          <div className="action-cat">{CAT_ICONS[a.category] || '🌿'}</div>
          <div className="action-info">
            <div className="action-name">{a.type}</div>
            <div className="action-meta">
              {a.category} · {new Date(a.date).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="action-co2">+{(a.carbonSaved ?? a.co2 ?? 0).toFixed(1)} kg</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ user, stats, actions, leaderboard, onShowLog }) {
  const firstName = user?.name?.split(' ')[0] || 'Friend';
  const myRank = leaderboard?.myRank ?? null;

  return (
    <div className="page active">
      <div className="section-header">
        <div>
          <div className="section-title">
            Good day, {firstName} 🌱
          </div>
          <div className="section-sub">Here&apos;s your sustainability impact at a glance</div>
        </div>
        <span className="tag tag-green text-xs" style={{ padding: '4px 10px', borderRadius: 12, background: 'rgba(93,222,127,0.12)', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          {stats?.streak ? `🔥 ${stats.streak} day streak` : 'Start your streak!'}
        </span>
      </div>

      <StatCards stats={stats} rank={myRank} />

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-title">
            🌿 Recent Actions
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onShowLog}>
              View All
            </button>
          </div>
          <RecentActions actions={actions} />
        </div>
        <div className="card">
          <div className="card-title">🏅 Streak Badges</div>
          <div className="action-feed">
            {stats?.streak ? (
              <div className="action-item">
                <div className="action-cat">🔥</div>
                <div className="action-info">
                  <div className="action-name">{stats.streak} day streak</div>
                  <div className="action-meta">Keep going! Every day counts.</div>
                </div>
              </div>
            ) : (
              <div className="empty">
                <div className="empty-icon">🌱</div>
                <div className="empty-text">No streak yet</div>
                <div className="empty-sub">Log an action today to start your streak</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionLogPage({ actions, onNew, onDelete }) {
  if (!actions?.length) {
    return (
      <div className="page active">
        <div className="section-header">
          <div>
            <div className="section-title">Action Log</div>
            <div className="section-sub">Track every eco-friendly choice you make</div>
          </div>
          <button className="btn btn-primary" onClick={onNew}>
            + New Action
          </button>
        </div>
        <div className="card">
          <div className="empty">
            <div className="empty-icon">✏️</div>
            <div className="empty-text">Start logging actions</div>
            <div className="empty-sub">Every small step counts toward a healthier planet</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="page active">
      <div className="section-header">
        <div>
          <div className="section-title">Action Log</div>
          <div className="section-sub">Track every eco-friendly choice you make</div>
        </div>
        <button className="btn btn-primary" onClick={onNew}>
          + New Action
        </button>
      </div>
      <div className="card">
        <div className="card-title">📋 All Actions</div>
        <div className="action-feed">
          {actions.map((a) => (
            <div key={a.id} className="action-item">
              <div className="action-cat">{CAT_ICONS[a.category] || '🌿'}</div>
              <div className="action-info">
                <div className="action-name">{a.type}</div>
                <div className="action-meta">
                  {a.category} · {new Date(a.date).toLocaleDateString()}
                </div>
                {a.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>{a.description}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="action-co2">+{(a.carbonSaved ?? a.co2 ?? 0).toFixed(1)} kg</div>
                <button
                  type="button"
                  onClick={() => onDelete(a.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 12, cursor: 'pointer', marginTop: 4 }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChallengesPage({ challenges, onJoin, onProgress }) {
  return (
    <div className="page active">
      <div className="section-header">
        <div>
          <div className="section-title">Challenges</div>
          <div className="section-sub">Join challenges to build lasting eco habits</div>
        </div>
      </div>
      <div className="grid-2">
        {challenges?.length ? (
          challenges.map((ch) => {
            const uc = ch.userChallenge;
            const progress = uc?.progress ?? 0;
            const pct = Math.round((progress / ch.targetCount) * 100);
            const joined = !!uc;
            const completed = uc?.completed;
            return (
              <div key={ch.id} className="card">
                <div className="card-title">
                  {CAT_ICONS[ch.category] || '🌿'} {ch.title}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>{ch.description}</p>
                {joined && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                      <span>
                        {progress}/{ch.targetCount} days
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="progress-bar" style={{ background: 'var(--bg3)', borderRadius: 100, height: 6, overflow: 'hidden', marginBottom: 10 }}>
                      <div
                        className="progress-fill"
                        style={{
                          height: '100%',
                          borderRadius: 100,
                          background: 'linear-gradient(90deg, var(--accent2), var(--accent3))',
                          width: `${pct}%`,
                        }}
                      />
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>🌿 {ch.carbonGoal} kg goal</span>
                  {completed ? (
                    <button className="btn btn-ghost btn-sm" type="button" disabled style={{ opacity: 0.6 }}>
                      ✅ Completed
                    </button>
                  ) : joined ? (
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => onProgress(ch.id)}>
                      +1 Day
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-sm" type="button" onClick={() => onJoin(ch.id)}>
                      Join →
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="card">
            <div className="empty">
              <div className="empty-icon">🏆</div>
              <div className="empty-text">No challenges yet</div>
              <div className="empty-sub">Seeding default challenges is done on the server.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardPage({ data, onChangePeriod }) {
  const [period, setPeriod] = useState('weekly');
  const leaderboard = data?.leaderboard || [];

  useEffect(() => {
    onChangePeriod(period);
  }, [period, onChangePeriod]);

  return (
    <div className="page active">
      <div className="section-header">
        <div>
          <div className="section-title">Leaderboard</div>
          <div className="section-sub">See how your impact ranks globally</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {['weekly', 'monthly', 'alltime'].map((p) => (
          <button
            key={p}
            type="button"
            className="btn btn-ghost btn-sm"
            style={{
              borderRadius: 10,
              borderColor: period === p ? 'var(--accent2)' : 'var(--border)',
              background: period === p ? 'var(--card2)' : 'none',
              color: period === p ? 'var(--accent)' : 'var(--text3)',
            }}
            onClick={() => setPeriod(p)}
          >
            {p === 'weekly' ? 'Weekly' : p === 'monthly' ? 'Monthly' : 'All Time'}
          </button>
        ))}
      </div>
      <div className="card">
        <div className="card-title">📋 Rankings</div>
        <div className="action-feed">
          {leaderboard.map((row) => {
            const initials = row.user?.name
              ?.split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase();
            return (
              <div key={row.user.id} className="action-item" style={{ background: row.isMe ? 'rgba(93,222,127,0.05)' : 'var(--bg3)' }}>
                <div style={{ width: 28, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 13, flexShrink: 0 }}>{row.rank}</div>
                <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                  {row.isMe ? '😊' : initials}
                </div>
                <div className="action-info">
                  <div className="action-name">
                    {row.user?.name}{' '}
                    {row.isMe && (
                      <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', background: 'rgba(93,222,127,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="action-meta">
                    {row.actionsCount} actions · {row.carbonSaved.toFixed(1)} kg CO₂ saved
                  </div>
                </div>
              </div>
            );
          })}
          {!leaderboard.length && (
            <div className="empty">
              <div className="empty-icon">📊</div>
              <div className="empty-text">No leaderboard data yet</div>
              <div className="empty-sub">Log some actions to appear here.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TipsPage({ tips }) {
  return (
    <div className="page active">
      <div className="section-header">
        <div>
          <div className="section-title">Eco Tips</div>
          <div className="section-sub">Practical advice to reduce your footprint</div>
        </div>
      </div>
      <div className="grid-2">
        {tips?.length ? (
          tips.map((t) => (
            <div key={t.id} className="card">
              <div style={{ fontSize: 28, marginBottom: 10 }}>{t.emoji}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{t.category}</div>
              <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 8 }}>{t.text}</div>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{t.impact}</div>
            </div>
          ))
        ) : (
          <div className="card">
            <div className="empty">
              <div className="empty-icon">💡</div>
              <div className="empty-text">No tips loaded</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SharePage({ stats }) {
  const totalCo2 = stats?.totalCo2 ?? 0;
  const totalActions = stats?.totalActions ?? 0;
  const streak = stats?.streak ?? 0;

  const text = useMemo(
    () => `🌿 I saved ${totalCo2.toFixed(1)} kg CO₂ with ${totalActions} eco actions on EcoTrack! Join me: https://ecotrack.app`,
    [totalCo2, totalActions],
  );

  const share = async (type) => {
    if (type === 'clipboard') {
      try {
        await navigator.clipboard.writeText(text);
        alert('Share text copied to clipboard');
      } catch {
        alert(text);
      }
    } else if (type === 'native') {
      if (navigator.share) {
        try {
          await navigator.share({ title: 'My Eco Impact', text, url: 'https://ecotrack.app' });
        } catch {
          // ignore
        }
      } else {
        await share('clipboard');
      }
    }
  };

  return (
    <div className="page active">
      <div className="section-header">
        <div>
          <div className="section-title">Share Your Impact</div>
          <div className="section-sub">Inspire others with your sustainability journey</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">My Eco Impact 🌿</div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{totalCo2.toFixed(1)}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>kg CO₂ Saved</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{totalActions}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Actions Logged</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{streak}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Day Streak</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" type="button" onClick={() => share('clipboard')}>
              📋 Copy Text
            </button>
            <button className="btn btn-primary" type="button" onClick={() => share('native')}>
              📤 Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ user, stats, onLogout }) {
  const initials =
    user?.name
      ?.split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'A';

  return (
    <div className="page active">
      <div className="section-header">
        <div>
          <div className="section-title">Your Profile</div>
          <div className="section-sub">Manage your account and preferences</div>
        </div>
        <button className="btn btn-ghost" type="button" onClick={onLogout}>
          Sign Out
        </button>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">👤 Personal Info</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{user?.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>{user?.email}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">📊 Lifetime Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Total CO₂ Saved</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)' }}>{(stats?.totalCo2 ?? 0).toFixed(1)} kg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Actions Logged</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{stats?.totalActions ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Current Streak</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{stats?.streak ?? 0} days 🔥</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppShell({ user }) {
  const [page, setPage] = useState('dashboard');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [tips, setTips] = useState([]);
  const stats = useAppStore((s) => s.stats);
  const actions = useAppStore((s) => s.actions);
  const challenges = useAppStore((s) => s.challenges);
  const leaderboard = useAppStore((s) => s.leaderboard);
  const fetchStats = useAppStore((s) => s.fetchStats);
  const fetchActions = useAppStore((s) => s.fetchActions);
  const addAction = useAppStore((s) => s.addAction);
  const removeAction = useAppStore((s) => s.removeAction);
  const fetchChallenges = useAppStore((s) => s.fetchChallenges);
  const joinChallenge = useAppStore((s) => s.joinChallenge);
  const fetchLeaderboard = useAppStore((s) => s.fetchLeaderboard);

  const { logout } = useAuth();

  useEffect(() => {
    fetchStats();
    fetchActions();
    fetchChallenges();
    fetchLeaderboard('weekly');
    tipsAPI
      .list()
      .then(setTips)
      .catch(() => {});
  }, [fetchStats, fetchActions, fetchChallenges, fetchLeaderboard]);

  const handleNewAction = () => setActionModalOpen(true);

  const handleSubmitAction = async (data) => {
    await addAction(data);
    await Promise.all([fetchStats(), fetchActions(), fetchChallenges(), fetchLeaderboard('weekly')]);
    setActionModalOpen(false);
  };

  const initials =
    user?.name
      ?.split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'A';

  return (
    <>
      <div className="app">
        <aside className="sidebar" id="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">🌿 EcoTrack</div>
            <div className="logo-sub">Sustainability Tracker</div>
          </div>
          <nav className="nav">
            <button className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} type="button" onClick={() => setPage('dashboard')}>
              <span className="nav-icon">📊</span> Dashboard
            </button>
            <button className={`nav-item ${page === 'log' ? 'active' : ''}`} type="button" onClick={() => setPage('log')}>
              <span className="nav-icon">✏️</span> Action Log
            </button>
            <button className={`nav-item ${page === 'challenges' ? 'active' : ''}`} type="button" onClick={() => setPage('challenges')}>
              <span className="nav-icon">🏆</span> Challenges
            </button>
            <button className={`nav-item ${page === 'leaderboard' ? 'active' : ''}`} type="button" onClick={() => setPage('leaderboard')}>
              <span className="nav-icon">🥇</span> Leaderboard
            </button>
            <button className={`nav-item ${page === 'tips' ? 'active' : ''}`} type="button" onClick={() => setPage('tips')}>
              <span className="nav-icon">💡</span> Eco Tips
            </button>
            <button className={`nav-item ${page === 'share' ? 'active' : ''}`} type="button" onClick={() => setPage('share')}>
              <span className="nav-icon">📢</span> Share
            </button>
            <button className={`nav-item ${page === 'profile' ? 'active' : ''}`} type="button" onClick={() => setPage('profile')}>
              <span className="nav-icon">👤</span> Profile
            </button>
          </nav>
          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="avatar">{initials}</div>
              <div>
                <div className="user-name">{user?.name}</div>
                <div className="user-pts">{(stats?.totalCo2 ?? 0).toFixed(1)} kg CO₂ saved</div>
              </div>
            </div>
          </div>
        </aside>
        <main className="main">
          <div className="topbar">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => {
                document.getElementById('sidebar')?.classList.toggle('open');
              }}
            >
              ☰
            </button>
            <div className="topbar-title">
              {page === 'dashboard'
                ? 'Dashboard'
                : page === 'log'
                ? 'Action Log'
                : page === 'challenges'
                ? 'Challenges'
                : page === 'leaderboard'
                ? 'Leaderboard'
                : page === 'tips'
                ? 'Eco Tips'
                : page === 'share'
                ? 'Share Impact'
                : 'Profile'}
            </div>
            <button type="button" className="btn btn-primary" onClick={handleNewAction}>
              + Log Action
            </button>
          </div>
          <div className="content">
            {page === 'dashboard' && <Dashboard user={user} stats={stats} actions={actions} leaderboard={leaderboard} onShowLog={() => setPage('log')} />}
            {page === 'log' && <ActionLogPage actions={actions} onNew={handleNewAction} onDelete={removeAction} />}
            {page === 'challenges' && <ChallengesPage challenges={challenges} onJoin={joinChallenge} onProgress={(id) => useAppStore.getState().challengesAPI?.progress?.(id)} />}
            {page === 'leaderboard' && <LeaderboardPage data={leaderboard} onChangePeriod={fetchLeaderboard} />}
            {page === 'tips' && <TipsPage tips={tips} />}
            {page === 'share' && <SharePage stats={stats} />}
            {page === 'profile' && <ProfilePage user={user} stats={stats} onLogout={logout} />}
          </div>
        </main>
      </div>
      {actionModalOpen && (
        <div className="modal-overlay" onClick={() => setActionModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">🌱 Log Eco Action</div>
              <button className="modal-close" type="button" onClick={() => setActionModalOpen(false)}>
                ✕
              </button>
            </div>
            <ActionForm
              onCancel={() => setActionModalOpen(false)}
              onSuccess={() => {
                fetchStats();
                fetchActions();
                setActionModalOpen(false);
              }}
              onSubmitOverride={handleSubmitAction}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const { user } = useAuth();
  const [readyUser, setReadyUser] = useState(user);

  useEffect(() => {
    setReadyUser(user);
  }, [user]);

  if (!readyUser) {
    return <AuthScreen onAuthenticated={setReadyUser} />;
  }

  return <AppShell user={readyUser} />;
}
