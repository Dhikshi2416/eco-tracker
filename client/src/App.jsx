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

const ACTION_TYPES = {
  transport: {
    avoided_car_trip: { label: '🚗 Avoided Car Trip' },
    public_transit: { label: '🚌 Used Public Transit' },
    cycled: { label: '🚲 Cycled Instead' },
    walked: { label: '🚶 Walked Instead' },
    carpooled: { label: '🚗 Carpooled' },
    electric_vehicle: { label: '⚡ Drove EV' },
  },
  food: {
    vegan_meal: { label: '🥦 Ate Vegan Meal' },
    vegetarian_meal: { label: '🥗 Ate Vegetarian' },
    reduced_meat: { label: '🍽️ Reduced Meat' },
    no_food_waste: { label: '🍱 Zero Food Waste' },
    local_produce: { label: '🌽 Bought Local' },
  },
  energy: {
    turned_off_lights: { label: '💡 Turned Off Lights' },
    line_dried: { label: '👕 Line Dried Laundry' },
    cold_wash: { label: '🫧 Cold Water Wash' },
    smart_thermostat: { label: '🌡️ Optimized Heating' },
    solar_used: { label: '☀️ Used Solar Energy' },
  },
  waste: {
    recycled: { label: '♻️ Recycled Materials' },
    composted: { label: '🌱 Composted Food' },
    refused_plastic: { label: '🛍️ Refused Plastic' },
    repaired_item: { label: '🔧 Repaired vs Bought' },
    second_hand: { label: '👗 Bought Second-Hand' },
  },
  water: {
    short_shower: { label: '🚿 Shorter Shower' },
    fixed_leak: { label: '🔧 Fixed Water Leak' },
    rain_harvested: { label: '🌧️ Harvested Rainwater' },
    full_dishwasher: { label: '🍽️ Full Dishwasher Load' },
  },
};

function getActionLabel(category, type) {
  return (
    ACTION_TYPES?.[category]?.[type]?.label ||
    (typeof type === 'string' ? type.replace(/_/g, ' ') : 'Action')
  );
}

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
      <div className="stat-card green">
        <div className="stat-icon">🍃</div>
        <div className="stat-val green">{totalCo2.toFixed(1)}</div>
        <div className="stat-label">kg CO₂ Saved</div>
        <div className="stat-change">↑ {weekCo2.toFixed(1)} kg this week</div>
      </div>
      <div className="stat-card gold">
        <div className="stat-icon">🔥</div>
        <div className="stat-val gold">{streak}</div>
        <div className="stat-label">Day Streak</div>
        <div className="stat-change" style={{ color: 'var(--gold)' }}>
          {streak > 0 ? '🔥 On fire!' : 'Start today!'}
        </div>
      </div>
      <div className="stat-card blue">
        <div className="stat-icon">⚡</div>
        <div className="stat-val blue">{totalActions}</div>
        <div className="stat-label">Total Actions</div>
        <div className="stat-change" style={{ color: '#6ab0ff' }}>
          {weekActions} this week
        </div>
      </div>
      <div className="stat-card orange">
        <div className="stat-icon">🏆</div>
        <div className="stat-val orange">{rank ? `#${rank}` : '–'}</div>
        <div className="stat-label">Leaderboard Rank</div>
        <div className="stat-change" style={{ color: 'var(--warn)' }}>
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
          <div className={`action-cat ${a.category}`}>{CAT_ICONS[a.category] || '🌿'}</div>
          <div className="action-info">
            <div className="action-name">{getActionLabel(a.category, a.type)}</div>
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
    const order = ['transport', 'food', 'energy', 'waste', 'water'];
    const colors = {
      transport: '#6ab0ff',
      food: '#5dde7f',
      energy: '#f0c040',
      waste: '#b478dc',
      water: '#40c0f0',
    };
    const circumference = 289; // matches original HTML design
    const catTotals = { transport: 0, food: 0, energy: 0, waste: 0, water: 0 };
    (actions || []).forEach((a) => {
      if (!catTotals.hasOwnProperty(a.category)) return;
      const v = Number(a.co2 ?? a.carbonSaved ?? 0);
      catTotals[a.category] += Number.isFinite(v) ? v : 0;
    });
    const total = order.reduce((s, key) => s + (catTotals[key] || 0), 0);
    if (!total) {
      return order.map((key) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: 0,
        pct: 0,
        dash: 0,
        offset: 0,
        color: colors[key],
        circumference,
      }));
    }
    let offset = 0;
    return order.map((key) => {
      const value = catTotals[key] || 0;
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
  }, [actions]);

  return (
    <div className="page active">
      <div className="section-header mb-20">
        <div>
          <div className="section-title">
            Good morning, {firstName} 🌱
          </div>
          <div className="section-sub">Here&apos;s your sustainability impact at a glance</div>
        </div>
        <span className="tag tag-green" style={{ fontSize: 11 }} id="dashStreakTag">
          {stats?.streak ? `🔥 ${stats.streak} day streak` : 'Start your streak!'}
        </span>
      </div>

      {/* Top stat row */}
      <StatCards stats={stats} rank={myRank} />

      {/* Weekly + Impact by Category */}
      <div className="grid-2 mb-20">
        <div className="card">
          <div className="card-title">
            📈 Weekly CO₂ Saved
            <span className="card-title-right">
              <span className="tag tag-green text-xs">{(weeklySeries.reduce((s, d) => s + (d.value || 0), 0) || 0).toFixed(1)} kg</span>
            </span>
          </div>
          <div className="chart-bars">
            {weeklySeries.map((d) => {
              const max = Math.max(...weeklySeries.map((x) => x.value || 0), 1);
              const h = ((d.value || 0) / max) * 100;
              return (
                <div key={d.label} className="chart-col">
                  <div
                    className={`chart-bar ${(d.value || 0) > 0 ? 'filled' : ''}`}
                    data-val={(d.value || 0) > 0 ? (d.value || 0).toFixed(1) : ''}
                    style={{ height: `${h}%` }}
                    title={`${(d.value || 0).toFixed(1)} kg`}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <span key={d} className="chart-label">
                {d}
              </span>
            ))}
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
          {(stats?.streak ?? 0) > 0 ? (
            <div className="streak-display mb-16">
              <div className="flame">🔥</div>
              <div>
                <div className="streak-num">{stats?.streak ?? 0}</div>
                <div className="streak-label">day streak</div>
                <div className="streak-sub">Keep going!</div>
              </div>
            </div>
          ) : (
            <div className="streak-display mb-16" style={{ background: 'rgba(93,222,127,0.03)' }}>
              <div style={{ fontSize: 42 }}>🌱</div>
              <div>
                <div className="streak-num" style={{ fontSize: 28, color: 'var(--text3)' }}>
                  0 days
                </div>
                <div className="streak-label">Log an action to start!</div>
              </div>
            </div>
          )}
          <div className="badge-row">
            {[
              { days: 1, icon: '🌱', name: 'Sprout', desc: 'First action!' },
              { days: 3, icon: '🌿', name: 'Seedling', desc: '3-day streak' },
              { days: 7, icon: '🍃', name: 'Sprout+', desc: '7-day streak' },
              { days: 14, icon: '🌳', name: 'Sapling', desc: '14-day streak' },
              { days: 30, icon: '🌲', name: 'Guardian', desc: '30-day streak' },
              { days: 100, icon: '🌴', name: 'Champion', desc: '100-day streak' },
            ].map((b) => {
              const actCount = stats?.totalActions ?? 0;
              const streak = stats?.streak ?? 0;
              const earned = (b.days === 1 && actCount > 0) || streak >= b.days;
              return (
                <div key={b.name} className={`badge ${earned ? 'earned' : 'locked'}`}>
                  <div className="badge-icon">{b.icon}</div>
                  <div className="badge-name">{b.name}</div>
                  {earned ? <div className="badge-days">{b.days === 1 ? '✓' : `${b.days}d`}</div> : null}
                  <div className="tooltip">{b.desc}</div>
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
  const [filterCat, setFilterCat] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');

  const filtered = useMemo(() => {
    let list = [...(actions || [])];
    if (filterCat) list = list.filter((a) => a.category === filterCat);
    if (filterPeriod === 'week') {
      const w = new Date(Date.now() - 7 * 86400000);
      list = list.filter((a) => new Date(a.date) >= w);
    } else if (filterPeriod === 'month') {
      const m = new Date(Date.now() - 30 * 86400000);
      list = list.filter((a) => new Date(a.date) >= m);
    }
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  }, [actions, filterCat, filterPeriod]);

  const hasAny = (actions || []).length > 0;
  const showEmpty = !filtered.length;

  return (
    <div className="page active">
      <div className="section-header mb-20">
        <div>
          <div className="section-title">Action Log</div>
          <div className="section-sub">Track every eco-friendly choice you make</div>
        </div>
        <button className="btn btn-primary" onClick={onNew}>
          + New Action
        </button>
      </div>
      <div className="card mb-20">
        <div className="card-title">🔍 Filter &amp; Search</div>
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="transport">🚗 Transport</option>
            <option value="food">🥗 Food</option>
            <option value="energy">⚡ Energy</option>
            <option value="waste">♻️ Waste</option>
            <option value="water">💧 Water</option>
          </select>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>
      <div className="card">
        <div className="card-title">📋 All Actions</div>
        <div className="action-feed">
          {showEmpty ? (
            <div className="empty">
              <div className="empty-icon">✏️</div>
              <div className="empty-text">{hasAny ? 'No actions found' : 'Start logging actions'}</div>
              <div className="empty-sub">
                {hasAny ? 'Try adjusting your filters or log a new action' : 'Every small step counts toward a healthier planet'}
              </div>
            </div>
          ) : (
            filtered.map((a) => (
              <div key={a.id} className="action-item">
                <div className={`action-cat ${a.category}`}>{CAT_ICONS[a.category] || '🌿'}</div>
                <div className="action-info">
                  <div className="action-name">{getActionLabel(a.category, a.type)}</div>
                  <div className="action-meta">
                    {a.category} · {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {a.description && (
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>{a.description}</div>
                  )}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ChallengesPage({ challenges, onJoin, onProgress }) {
  return (
    <div className="page active">
      <div className="section-header mb-20">
        <div>
          <div className="section-title">Challenges</div>
          <div className="section-sub">Join challenges to build lasting eco habits</div>
        </div>
      </div>
      <div className="challenge-grid">
        {challenges?.length ? (
          challenges.map((ch) => {
            const uc = ch.userChallenge;
            const progress = uc?.progress ?? 0;
            const pct = Math.round((progress / ch.targetCount) * 100);
            const joined = !!uc;
            const completed = uc?.completed;
            return (
              <div key={ch.id} className={`challenge-card ${ch.category}`}>
                <div className={`challenge-tag ${ch.category}`}>
                  {CAT_ICONS[ch.category] || '🌿'} {ch.category}
                </div>
                <div className="challenge-title">{ch.title}</div>
                <div className="challenge-desc">{ch.description}</div>
                {joined ? (
                  <div>
                    <div className="progress-info mb-4">
                      <span>
                        {progress}/{ch.targetCount} days
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ) : null}
                <div className="challenge-meta">
                  <span className="challenge-participants">👥 {Number(ch.participants || 0).toLocaleString()} joined</span>
                  <span className="challenge-co2">🌿 {ch.carbonGoal} kg goal</span>
                </div>
                {completed ? (
                  <button className="btn btn-ghost btn-sm" type="button" disabled style={{ opacity: 0.5 }}>
                    ✅ Completed!
                  </button>
                ) : joined ? (
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => onProgress(ch.id)}>
                    +1 Day Progress
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" type="button" onClick={() => onJoin(ch.id)}>
                    Join Challenge →
                  </button>
                )}
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
      <div className="section-header mb-20">
        <div>
          <div className="section-title">Leaderboard</div>
          <div className="section-sub">See how your impact ranks globally</div>
        </div>
      </div>
      <div className="leaderboard-tabs">
        {['weekly', 'monthly', 'alltime'].map((p) => (
          <button
            key={p}
            type="button"
            className={`lb-tab ${period === p ? 'active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p === 'weekly' ? 'Weekly' : p === 'monthly' ? 'Monthly' : 'All Time'}
          </button>
        ))}
      </div>
      <div className="card mb-20">
        <div className="card-title">🥇 Top 3 Champions</div>
        <div className="podium">
          {(() => {
            const sorted = [...leaderboard].sort((a, b) => (b.carbonSaved || 0) - (a.carbonSaved || 0));
            const top3 = sorted.slice(0, 3);
            const order = [1, 0, 2];
            const podiumClass = ['p2', 'p1', 'p3'];
            const crowns = ['🥈', '👑', '🥉'];
            const colors = ['#c0cdd4', '#f0c040', '#d4855a'];
            return order.map((idx, pi) => {
              const p = top3[idx];
              if (!p) return null;
              const nm = p.user?.name || 'User';
              const initials = nm
                .split(' ')
                .map((w) => w[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();
              const color = p.isMe ? 'var(--accent)' : colors[pi];
              return (
                <div key={p.user?.id || `${pi}`} className="podium-place">
                  <div className="podium-avatar" style={{ background: `${color}22`, color }}>
                    {p.isMe ? '😊' : initials}
                    <div className="podium-crown">{crowns[pi]}</div>
                  </div>
                  <div className="podium-name">{nm.split(' ')[0]}</div>
                  <div className="podium-score">{Number(p.carbonSaved || 0).toFixed(1)} kg</div>
                  <div className={`podium-block ${podiumClass[pi]}`}>{idx + 1}</div>
                </div>
              );
            });
          })()}
        </div>
      </div>
      <div className="card">
        <div className="card-title">📋 Full Rankings</div>
        <div className="lb-table">
          {leaderboard.map((row) => {
            const nm = row.user?.name || 'User';
            const initials = nm
              .split(' ')
              .map((w) => w[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();
            const medals = ['🥇', '🥈', '🥉'];
            const rank = Number(row.rank || 0);
            return (
              <div key={row.user?.id} className={`lb-row ${row.isMe ? 'me' : ''}`}>
                <div className="lb-rank">{rank >= 1 && rank <= 3 ? medals[rank - 1] : rank || '–'}</div>
                <div className="lb-avatar" style={{ background: 'rgba(93,222,127,0.08)', color: 'var(--accent)' }}>
                  {row.isMe ? '😊' : initials}
                </div>
                <div className="lb-name">
                  {nm}
                  {row.isMe ? <span className="lb-you">YOU</span> : null}
                </div>
                <div className="lb-actions">{row.actionsCount ?? 0} actions</div>
                <div className="lb-score">{Number(row.carbonSaved || 0).toFixed(1)} kg</div>
              </div>
            );
          })}
          {!leaderboard.length ? (
            <div className="empty">
              <div className="empty-icon">📊</div>
              <div className="empty-text">No leaderboard data yet</div>
              <div className="empty-sub">Log some actions to appear here.</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TipsPage({ tips }) {
  const [index, setIndex] = useState(0);
  const hasTips = Array.isArray(tips) && tips.length > 0;
  const tipList = tips || [];
  const tip = tipList.length ? tipList[index % tipList.length] : null;

  return (
    <div className="page active">
      <div className="section-header mb-20">
        <div>
          <div className="section-title">Eco Tips</div>
          <div className="section-sub">Practical advice to reduce your footprint</div>
        </div>
      </div>
      <div className="card mb-20">
        <div className="card-title">💡 Tip of the Day</div>
        <div className="tips-carousel">
          <div className="tips-track" style={{ transform: `translateX(-${(index % Math.max(tipList.length, 1)) * 100}%)` }}>
            {(tipList.length ? tipList : [{ id: 'empty', emoji: '💡', category: '', text: 'No tips loaded', impact: '' }]).map((t) => (
              <div key={t.id} className="tip-slide">
                <div className="tip-emoji">{t.emoji}</div>
                <div className="tag tag-blue mb-8 text-xs">{t.category}</div>
                <div className="tip-text">{t.text}</div>
                <div className="tip-impact">{t.impact}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="tips-nav">
          <div className="tips-dots">
            {(tipList.length ? tipList : [0]).map((_, i) => (
              <div key={i} className={`tip-dot ${i === (index % Math.max(tipList.length, 1)) ? 'active' : ''}`} onClick={() => setIndex(i)} />
            ))}
          </div>
          <div className="tips-btns">
            <button className="tip-btn" type="button" onClick={() => setIndex((i) => (i - 1 + Math.max(tipList.length, 1)) % Math.max(tipList.length, 1))}>
              ←
            </button>
            <button className="tip-btn" type="button" onClick={() => setIndex((i) => (i + 1) % Math.max(tipList.length, 1))}>
              →
            </button>
          </div>
        </div>
      </div>
      <div className="grid-3" id="tipsGrid">
        {hasTips
          ? tipList.map((t) => (
              <div key={t.id} className="card">
                <div style={{ fontSize: 28, marginBottom: 10 }}>{t.emoji}</div>
                <div className="tag tag-blue text-xs mb-8">{t.category}</div>
                <div className="text-sm" style={{ color: 'var(--text2)', marginBottom: 8 }}>
                  {String(t.text || '').length > 100 ? `${String(t.text).substring(0, 100)}...` : t.text}
                </div>
                <div className="text-xs text-accent text-mono">{t.impact}</div>
              </div>
            ))
          : null}
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
      <div className="section-header mb-20">
        <div>
          <div className="section-title">Share Your Impact</div>
          <div className="section-sub">Inspire others with your sustainability journey</div>
        </div>
      </div>
      <div className="grid-2">
        <div>
          <div className="share-card mb-20">
            <div className="share-card-title">My Eco Impact 🌿</div>
            <div className="share-card-sub">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            <div className="share-stat-row">
              <div className="share-stat">
                <div className="share-stat-num">{totalCo2.toFixed(1)}</div>
                <div className="share-stat-label">kg CO₂ Saved</div>
              </div>
              <div className="share-stat">
                <div className="share-stat-num">{totalActions}</div>
                <div className="share-stat-label">Actions Logged</div>
              </div>
              <div className="share-stat">
                <div className="share-stat-num">{streak}</div>
                <div className="share-stat-label">Day Streak</div>
              </div>
            </div>
            <div className="share-btns">
              <button className="share-btn" type="button" onClick={() => share('clipboard')}>
                📋 Copy Link
              </button>
              <button className="share-btn" type="button" onClick={() => share('twitter')}>
                𝕏 Twitter
              </button>
              <button className="share-btn" type="button" onClick={() => share('whatsapp')}>
                💬 WhatsApp
              </button>
              <button className="share-btn" type="button" onClick={() => share('native')}>
                📤 Share
              </button>
            </div>
          </div>
          <div className="card">
            <div className="card-title">🏅 Share a Badge</div>
            <div className="badge-row">
              {[
                { days: 1, icon: '🌱', name: 'Sprout', desc: 'First action!' },
                { days: 3, icon: '🌿', name: 'Seedling', desc: '3-day streak' },
                { days: 7, icon: '🍃', name: 'Sprout+', desc: '7-day streak' },
                { days: 14, icon: '🌳', name: 'Sapling', desc: '14-day streak' },
                { days: 30, icon: '🌲', name: 'Guardian', desc: '30-day streak' },
                { days: 100, icon: '🌴', name: 'Champion', desc: '100-day streak' },
              ].map((b) => {
                const actCount = stats?.totalActions ?? 0;
                const streakN = stats?.streak ?? 0;
                const earned = (b.days === 1 && actCount > 0) || streakN >= b.days;
                return (
                  <div key={b.name} className={`badge ${earned ? 'earned' : 'locked'}`}>
                    <div className="badge-icon">{b.icon}</div>
                    <div className="badge-name">{b.name}</div>
                    {earned ? <div className="badge-days">{b.days === 1 ? '✓' : `${b.days}d`}</div> : null}
                    <div className="tooltip">{b.desc}</div>
                  </div>
                );
              })}
            </div>
            <button className="btn btn-ghost btn-sm mt-16" type="button" onClick={() => share('clipboard')}>
              📤 Share Achievement
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-title">🌐 Refer a Friend</div>
          <p className="text-sm" style={{ color: 'var(--text2)', marginBottom: 16 }}>
            Invite friends to join EcoTrack and multiply your collective impact.
          </p>
          <div className="form-group mb-16">
            <label className="form-label">Your Referral Link</label>
            <div className="flex gap-8">
              <input className="form-control" value="https://ecotrack.app/join?ref=eco" readOnly />
              <button className="btn btn-ghost" type="button" onClick={() => share('clipboard')}>
                📋
              </button>
            </div>
          </div>
          <div className="divider" />
          <div className="card-title mb-16">📊 Collective Impact</div>
          <div className="flex gap-8 mb-8" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="text-sm" style={{ color: 'var(--text2)' }}>
              Community CO₂ Saved
            </span>
            <span className="text-mono text-xs text-accent">{(totalCo2 + 284.7).toFixed(1)} kg</span>
          </div>
          <div className="carbon-meter mb-16">
            <div className="carbon-fill" style={{ width: `${Math.min(((totalCo2 + 284.7) / 5) * 100, 100)}%` }} />
          </div>
          <p className="text-xs text-muted">Combined impact of all EcoTrack users. Together we&apos;re making a difference!</p>
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

  const [editName, setEditName] = useState(user?.name || '');
  useEffect(() => setEditName(user?.name || ''), [user?.name]);

  const saveProfile = async () => {
    const name = String(editName || '').trim();
    if (!name) return;
    try {
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name });
    } catch {
      // ignore
    }
  };

  return (
    <div className="page active">
      <div className="section-header mb-20">
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
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }} id="profileAvatar">
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)' }} id="profileName">
                {user?.name}
              </div>
              <div className="text-sm text-muted" id="profileEmail">
                {user?.email}
              </div>
              <div className="tag tag-green text-xs mt-8">Eco Warrior 🌿</div>
            </div>
          </div>
          <div className="form-group mb-16">
            <label className="form-label">Display Name</label>
            <input className="form-control" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" />
          </div>
          <button className="btn btn-primary btn-sm" type="button" onClick={saveProfile}>
            Save Changes
          </button>
        </div>
        <div className="card">
          <div className="card-title">📊 Lifetime Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Total CO₂ Saved</span>
              <span className="font-display bold text-accent" id="profileCo2">
                {(stats?.totalCo2 ?? 0).toFixed(1)} kg
              </span>
            </div>
            <div className="carbon-meter">
              <div className="carbon-fill" style={{ width: `${Math.min(((stats?.totalCo2 ?? 0) / 5) * 100, 100)}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Actions Logged</span>
              <span className="text-mono" id="profileActions">
                {stats?.totalActions ?? 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Current Streak</span>
              <span className="text-mono" id="profileStreak">
                {stats?.streak ?? 0} days 🔥
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-sm" style={{ color: 'var(--text2)' }}>
                Challenges Completed
              </span>
              <span className="text-mono" id="profileChallenges">
                {stats?.challengesCompleted ?? 0}
              </span>
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
