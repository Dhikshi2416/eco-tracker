import { useEffect, useMemo, useState } from 'react';
import './index.css';
import { useAppStore } from './store/useAppStore';
import ActionForm from './components/ActionForm';
import { auth } from './lib/firebase';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

const CAT_ICONS = {
  transport: '🚗',
  food: '🥗',
  energy: '⚡',
  waste: '♻️',
  water: '💧',
};

function AuthScreen({ onAuthenticated }) {
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
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name || 'Eco User' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuthenticated?.();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-screen"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, #183222 0, #0d1a0f 55%)',
      }}
    >
      <div
        className="auth-card"
        style={{
          width: 420,
          maxWidth: '90vw',
          padding: 40,
          borderRadius: 24,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}
      >
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

  const weeklySeries = useMemo(() => {
    const out = [];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    // Build last 7 days ending today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dayKey = d.toDateString();
      const total = (actions || [])
        .filter((a) => {
          const ad = new Date(a.date || a.createdAt || now);
          ad.setHours(0, 0, 0, 0);
          return ad.toDateString() === dayKey;
        })
        .reduce((s, a) => s + Number(a.co2 || a.carbonSaved || 0), 0);
      out.push({ label: labels[6 - i], value: total });
    }
    return out;
  }, [actions]);

  const donutData = useMemo(() => {
    const cats = stats?.categories || {};
    const order = ['transport', 'food', 'energy', 'waste', 'water'];
    const colors = {
      transport: '#6ab0ff',
      food: '#5dde7f',
      energy: '#f0c040',
      waste: '#b478dc',
      water: '#40c0f0',
    };
    const circumference = 289; // matches original design for r=46
    const total = order.reduce((s, key) => s + Number(cats[key] || 0), 0);
    if (!total) {
      return order.map((key) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: 0,
        pct: 0,
        dash: 0,
        offset: 0,
        color: colors[key],
      }));
    }
    let offset = 0;
    return order.map((key) => {
      const value = Number(cats[key] || 0);
      const pct = value / total;
      const dash = pct * circumference;
      const seg = {
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value,
        pct: Math.round(pct * 100),
        dash,
        offset,
        color: colors[key],
        circumference,
      };
      offset += dash;
      return seg;
    });
  }, [stats]);

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

      {/* Top stat row */}
      <StatCards stats={stats} rank={myRank} />

      {/* Weekly + Impact by Category */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">
            📈 Weekly CO₂ Saved
            <span className="tag tag-green text-xs" style={{ marginLeft: 'auto' }}>
              {stats?.weekCo2?.toFixed ? stats.weekCo2.toFixed(1) : '0.0'} kg this week
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {weeklySeries.map((d) => {
              const max = Math.max(...weeklySeries.map((x) => x.value || 0), 1);
              const h = (d.value / max) * 100;
              return (
                <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div
                    className="chart-bar"
                    style={{
                      width: '100%',
                      borderRadius: 6,
                      background: d.value > 0 ? 'linear-gradient(180deg,var(--accent2),var(--accent3))' : 'var(--bg3)',
                      height: `${h}%`,
                      position: 'relative',
                    }}
                    title={`${d.value.toFixed(1)} kg`}
                  >
                    {d.value > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -18,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: 10,
                          color: 'var(--text3)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {d.value.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-title">🌍 Impact by Category</div>
          <div className="donut-wrap">
            <div className="donut">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="46" fill="none" stroke="var(--bg3)" strokeWidth="16" />
                {donutData.map((seg) => (
                  <circle
                    key={seg.key}
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="16"
                    strokeDasharray={`${seg.dash} ${seg.circumference - seg.dash}`}
                    strokeDashoffset={-seg.offset}
                    strokeLinecap="round"
                  />
                ))}
              </svg>
              <div className="donut-center">
                <div className="donut-val">{(stats?.totalCo2 ?? 0).toFixed(1)}</div>
                <div className="donut-unit">kg CO₂</div>
              </div>
            </div>
            <div className="donut-legend">
              {donutData.map((seg) => (
                <div key={seg.key} className="legend-item">
                  <div className="legend-dot" style={{ background: seg.color }} />
                  <span className="text-sm">
                    {seg.label}{' '}
                    <span className="text-mono text-xs">
                      {seg.pct}% · {seg.value.toFixed(1)} kg
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
            <div className="action-item">
              <div className="action-cat">🔥</div>
              <div className="action-info">
                <div className="action-name">{stats?.streak ?? 0} day streak</div>
                <div className="action-meta">{stats?.streak ? 'Keep going! Every day counts.' : 'Log an action today to start your streak.'}</div>
              </div>
            </div>
          </div>
          {/* Badge row */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, overflowX: 'auto' }}>
            {[
              { days: 1, icon: '🌱', name: 'Sprout' },
              { days: 3, icon: '🌿', name: 'Seedling' },
              { days: 7, icon: '🍃', name: 'Sapling' },
              { days: 14, icon: '🌳', name: 'Guardian' },
              { days: 30, icon: '🌲', name: 'Champion' },
            ].map((b) => {
              const unlocked = (stats?.streak || 0) >= b.days;
              return (
                <div
                  key={b.name}
                  style={{
                    minWidth: 90,
                    padding: 12,
                    borderRadius: 16,
                    border: `1px solid ${unlocked ? 'var(--accent2)' : 'var(--border)'}`,
                    background: unlocked ? 'rgba(93,222,127,0.06)' : 'var(--bg3)',
                    textAlign: 'center',
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6, opacity: unlocked ? 1 : 0.4 }}>{b.icon}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', marginBottom: 2 }}>{b.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: unlocked ? 'var(--accent)' : 'var(--text3)' }}>
                    {unlocked ? `${b.days}d` : `${b.days}d goal`}
                  </div>
                </div>
              );
            })}
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
  const [index, setIndex] = useState(0);
  const [filter, setFilter] = useState('all'); // visual category filter

  const hasTips = Array.isArray(tips) && tips.length > 0;
  const filteredTips = useMemo(() => {
    if (!hasTips) return [];
    if (filter === 'all') return tips;
    return tips.filter((t) => String(t.category).toLowerCase() === filter);
  }, [filter, tips, hasTips]);

  const tipList = filteredTips.length ? filteredTips : tips || [];
  const tip = tipList.length ? tipList[index % tipList.length] : null;

  return (
    <div className="page active">
      <div className="section-header">
        <div>
          <div className="section-title">Eco Tips</div>
          <div className="section-sub">Practical advice to reduce your footprint</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'transport', label: 'Transport' },
            { key: 'food', label: 'Food' },
            { key: 'energy', label: 'Energy' },
            { key: 'waste', label: 'Waste' },
            { key: 'water', label: 'Water' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              className="btn btn-ghost btn-sm"
              style={{
                borderRadius: 999,
                borderColor: filter === opt.key ? 'var(--accent2)' : 'var(--border)',
                background: filter === opt.key ? 'var(--card2)' : 'none',
                color: filter === opt.key ? 'var(--accent)' : 'var(--text3)',
              }}
              onClick={() => {
                setFilter(opt.key);
                setIndex(0);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">💡 Tip of the Day</div>
          {tip ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{tip.emoji}</div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text3)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 8,
                }}
              >
                {tip.category}
              </div>
              <div style={{ fontSize: 16, color: 'var(--text)', marginBottom: 8 }}>{tip.text}</div>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{tip.impact}</div>
              {/* Visual impact bar */}
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: 'var(--bg3)',
                  overflow: 'hidden',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: '70%',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg,var(--accent2),var(--accent3))',
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
                Visual impact score (higher bar = higher impact)
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setIndex((i) => (i - 1 + tips.length) % tips.length)}>
                  ← Prev
                </button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setIndex((i) => (i + 1) % tips.length)}>
                  Next →
                </button>
              </div>
            </>
          ) : (
            <div className="empty">
              <div className="empty-icon">💡</div>
              <div className="empty-text">No tips loaded</div>
            </div>
          )}
        </div>
      </div>
      <div className="grid-2">
        {hasTips &&
          tips.map((t) => (
            <div key={t.id} className="card">
              <div style={{ fontSize: 28, marginBottom: 10 }}>{t.emoji}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{t.category}</div>
              <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 8 }}>{t.text}</div>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{t.impact}</div>
            </div>
          ))}
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
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (type === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    } else if (type === 'linkedin') {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://ecotrack.app')}&mini=true&summary=${encodeURIComponent(
          text,
        )}`,
        '_blank',
      );
    } else if (type === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent('https://ecotrack.app')}&text=${encodeURIComponent(text)}`, '_blank');
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
            <button className="btn btn-ghost" type="button" onClick={() => share('whatsapp')}>
              💬 WhatsApp
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => share('twitter')}>
              𝕏 Twitter
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => share('linkedin')}>
              💼 LinkedIn
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => share('telegram')}>
              📨 Telegram
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
  const stats = useAppStore((s) => s.stats);
  const actions = useAppStore((s) => s.actions);
  const challenges = useAppStore((s) => s.challenges);
  const leaderboard = useAppStore((s) => s.leaderboard);
  const addAction = useAppStore((s) => s.addAction);
  const removeAction = useAppStore((s) => s.removeAction);
  const joinChallenge = useAppStore((s) => s.joinChallenge);
  const progressChallenge = useAppStore((s) => s.progressChallenge);
  const tips = useAppStore((s) => s.tips);

  const handleNewAction = () => setActionModalOpen(true);

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
            {page === 'challenges' && <ChallengesPage challenges={challenges} onJoin={joinChallenge} onProgress={progressChallenge} />}
            {page === 'leaderboard' && <LeaderboardPage data={leaderboard} onChangePeriod={() => {}} />}
            {page === 'tips' && <TipsPage tips={tips} />}
            {page === 'share' && <SharePage stats={stats} />}
            {page === 'profile' && <ProfilePage user={user} stats={stats} onLogout={() => signOut(auth)} />}
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
                setActionModalOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const setUser = useAppStore((s) => s.setUser);
  const startRealtime = useAppStore((s) => s.startRealtime);
  const stopRealtime = useAppStore((s) => s.stopRealtime);

  const [readyUser, setReadyUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setReadyUser(null);
        setUser(null);
        stopRealtime();
        return;
      }
      const u = {
        id: fbUser.uid,
        name: fbUser.displayName || 'Eco User',
        email: fbUser.email || '',
      };
      setReadyUser(u);
      setUser(u);
      await startRealtime();
    });
    return () => unsub();
  }, [setUser, startRealtime, stopRealtime]);

  if (!readyUser) return <AuthScreen onAuthenticated={() => {}} />;
  return <AppShell user={readyUser} />;
}
