import { useEffect, useMemo, useState } from 'react';
import './index.css';
import { useAppStore } from './store/useAppStore';
import ActionForm from './components/ActionForm';
import { auth, db } from './lib/firebase';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

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

function toDateSafe(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === 'function') return v.toDate();
  return new Date(v);
}

function LandingScreen({ onStartAuth }) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Navbar scroll effect, scroll-reveal, and floating leaves animation
  useEffect(() => {
    const nav = document.getElementById('landingNavbar');
    const onScroll = () => {
      if (!nav) return;
      nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const items = document.querySelectorAll('.landing-reveal');
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = document.getElementById('leaves-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const EMOJIS = ['🍃', '🌿', '🍀', '🌱', '🌾'];
    let leaves = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function spawnLeaf() {
      leaves.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 20,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        size: 12 + Math.random() * 16,
        speed: 0.4 + Math.random() * 0.7,
        drift: (Math.random() - 0.5) * 0.6,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.04,
        life: 1,
        decay: 0.0018 + Math.random() * 0.0015,
      });
    }

    let frame = 0;
    let rafId;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame += 1;
      if (frame % 90 === 0 && leaves.length < 22) spawnLeaf();
      leaves = leaves.filter((l) => l.life > 0);
      leaves.forEach((l) => {
        l.y -= l.speed;
        l.x += l.drift + Math.sin(l.y * 0.015) * 0.4;
        l.rot += l.rotV;
        l.life -= l.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, l.life * 0.6);
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        ctx.font = `${l.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(l.emoji, 0, 0);
        ctx.restore();
      });
      rafId = requestAnimationFrame(tick);
    };

    for (let i = 0; i < 8; i += 1) {
      spawnLeaf();
      leaves[i].y = Math.random() * canvas.height;
      leaves[i].life = Math.random();
    }
    tick();

    return () => {
      window.removeEventListener('resize', resize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="landing-root">
      <canvas id="leaves-canvas" />
      <nav className="landing-navbar" id="landingNavbar">
        <div className="landing-nav-logo">
          <span className="landing-nav-logo-leaf">🌿</span>
          EcoTrack
        </div>
        <div className="landing-nav-links">
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => scrollTo('features')}
          >
            Features
          </button>
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => scrollTo('how')}
          >
            How It Works
          </button>
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => scrollTo('impact')}
          >
            Impact
          </button>
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => scrollTo('cta')}
          >
            Community
          </button>
        </div>
        <div className="landing-nav-actions">
          <button
            type="button"
            className="landing-btn-nav-ghost"
            onClick={onStartAuth}
          >
            Sign In
          </button>
          <button
            type="button"
            className="landing-btn-nav-primary"
            onClick={onStartAuth}
          >
            Start Free →
          </button>
        </div>
      </nav>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <div className="landing-hero-left">
              <div className="landing-hero-badge">
                <div className="landing-hero-badge-dot" />
                New: Community Challenges + Weekly Leaderboard
              </div>
              <h1 className="landing-hero-headline">
                Turn everyday
                <br />
                choices into
                <br />
                <span className="landing-hero-accent">real climate</span>
                <br />
                action
              </h1>
              <p className="landing-hero-sub">
                EcoTrack helps you log eco-friendly habits, calculate your exact carbon impact,
                build daily streaks, and compete on a global leaderboard — all in one beautifully
                designed dashboard.
              </p>
              <div className="landing-hero-ctas">
                <button
                  type="button"
                  className="landing-btn-hero-primary"
                  onClick={onStartAuth}
                >
                  🌱 Start Tracking Free
                </button>
                <button
                  type="button"
                  className="landing-btn-hero-secondary"
                  onClick={() => scrollTo('features')}
                >
                  See Features ↓
                </button>
              </div>
              <div className="landing-hero-social">
                <div className="landing-avatar-stack">
                  <div className="landing-avatar" data-color="green">
                    AK
                  </div>
                  <div className="landing-avatar" data-color="blue">
                    MR
                  </div>
                  <div className="landing-avatar" data-color="gold">
                    SL
                  </div>
                  <div className="landing-avatar" data-color="purple">
                    JT
                  </div>
                  <div className="landing-avatar" data-color="teal">
                    +
                  </div>
                </div>
                <div className="landing-hero-social-text">
                  <strong>2</strong> eco warriors already saving the planet 🌍
                </div>
              </div>
            </div>

            <div className="landing-hero-right">
              <div className="landing-float-pill landing-float-streak">
                🔥 <strong>14-day</strong>&nbsp;streak active
              </div>
              <div className="landing-float-pill landing-float-badge">
                🌳 <strong>Sapling</strong>&nbsp;badge earned!
              </div>
              <div className="landing-float-pill landing-float-co2">
                🌿 +<strong>2.4 kg</strong>&nbsp;CO₂ saved today
              </div>

              <div className="landing-dashboard-preview">
                <div className="landing-preview-topbar">
                  <div className="landing-preview-dots">
                    <span className="r" />
                    <span className="y" />
                    <span className="g" />
                  </div>
                  <div className="landing-preview-title">ecotrack.app/dashboard</div>
                </div>
                <div className="landing-preview-body">
                  <div className="landing-preview-stats">
                    <div className="landing-preview-stat">
                      <div className="val green">84.3</div>
                      <div className="label">kg CO₂ Saved</div>
                    </div>
                    <div className="landing-preview-stat">
                      <div className="val gold">🔥 14</div>
                      <div className="label">Day Streak</div>
                    </div>
                    <div className="landing-preview-stat">
                      <div className="val blue">127</div>
                      <div className="label">Actions</div>
                    </div>
                  </div>
                  <div className="landing-preview-chart">
                    <div style={{ height: '30%' }} />
                    <div className="lit" style={{ height: '55%' }} />
                    <div style={{ height: '40%' }} />
                    <div className="lit" style={{ height: '75%' }} />
                    <div className="lit" style={{ height: '60%' }} />
                    <div style={{ height: '45%' }} />
                    <div className="lit" style={{ height: '90%' }} />
                  </div>
                  <div className="landing-preview-action">
                    <div className="cat transport">🚲</div>
                    <div className="text">
                      <div className="name">Cycled to work</div>
                      <div className="meta">transport · today</div>
                    </div>
                    <div className="co2">+1.6 kg</div>
                  </div>
                  <div className="landing-preview-action">
                    <div className="cat food">🥗</div>
                    <div className="text">
                      <div className="name">Ate vegan meal</div>
                      <div className="meta">food · today</div>
                    </div>
                    <div className="co2">+1.5 kg</div>
                  </div>
                  <div className="landing-preview-action">
                    <div className="cat energy">☀️</div>
                    <div className="text">
                      <div className="name">Used solar energy</div>
                      <div className="meta">energy · yesterday</div>
                    </div>
                    <div className="co2">+1.8 kg</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-section-header landing-reveal">
            <div className="eyebrow">Everything You Need</div>
            <h2 className="title">Built for real climate action</h2>
            <p className="sub">
              Every feature is designed to make sustainable living measurable, motivating, and social.
            </p>
          </div>
          <div className="landing-features-grid">
            <div className="card f1 landing-reveal">
              <div className="icon">🧮</div>
              <div className="title">Carbon Calculator</div>
              <div className="desc">
                Every action you log is automatically converted to exact kg of CO₂ saved using
                science-backed emission factors across 25+ action types.
              </div>
              <div className="tag">25+ actions tracked</div>
            </div>
            <div className="card f2 landing-reveal">
              <div className="icon">🔥</div>
              <div className="title">Streak System &amp; Badges</div>
              <div className="desc">
                Build daily streaks and unlock 6 badge tiers — from Seed to Champion. Gamified
                progression keeps you motivated every single day.
              </div>
              <div className="tag">6 badge tiers</div>
            </div>
            <div className="card f3 landing-reveal">
              <div className="icon">🥇</div>
              <div className="title">Weekly Leaderboard</div>
              <div className="desc">
                Compete globally with weekly, monthly, and all-time rankings. A beautiful podium
                display shows the top eco warriors in your community.
              </div>
              <div className="tag">Global rankings</div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="how">
          <div className="landing-section-header landing-reveal">
            <div className="eyebrow">Simple as 1-2-3</div>
            <h2 className="title">Start making a difference today</h2>
            <p className="sub">
              No complicated setup. Log your first action in under 30 seconds.
            </p>
          </div>
          <div className="grid-3">
            <div className="card landing-reveal">
              <div style={{ fontSize: 32, marginBottom: 10 }}>📝</div>
              <div className="section-title" style={{ fontSize: 16, marginBottom: 6 }}>
                Log your actions
              </div>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>
                Pick a category, choose an action type, and add an optional photo or note. Your CO₂
                impact is calculated instantly.
              </p>
            </div>
            <div className="card landing-reveal">
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔥</div>
              <div className="section-title" style={{ fontSize: 16, marginBottom: 6 }}>
                Build your streak
              </div>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>
                Log at least one action daily to maintain your streak. Unlock badges as your streak
                grows and climb the leaderboard.
              </p>
            </div>
            <div className="card landing-reveal">
              <div style={{ fontSize: 32, marginBottom: 10 }}>🌍</div>
              <div className="section-title" style={{ fontSize: 16, marginBottom: 6 }}>
                Share your impact
              </div>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>
                Your personalised impact card shows total CO₂ saved, streaks, and badges. Share it
                and inspire others to join.
              </p>
            </div>
          </div>
        </section>

        <section className="landing-section" id="impact">
          <div className="landing-section-header landing-reveal">
            <div className="eyebrow">Real Impact</div>
            <h2 className="title">See your real numbers</h2>
            <p className="sub">
              Once you sign in, EcoTrack calculates your actual CO₂ savings, actions, and streaks
              from your own log.
            </p>
          </div>
          <div className="grid-4">
            <div className="card landing-reveal">
              <div style={{ fontSize: 34, marginBottom: 12 }}>🍃</div>
              <div className="section-title" style={{ fontSize: 20, marginBottom: 4 }}>
                Personal CO₂ saved
              </div>
              <div className="text-xs text-muted">
                Dashboard shows the exact kilograms of CO₂ you&apos;ve saved from your actions.
              </div>
            </div>
            <div className="card landing-reveal">
              <div style={{ fontSize: 34, marginBottom: 12 }}>👥</div>
              <div className="section-title" style={{ fontSize: 20, marginBottom: 4 }}>
                Global leaderboard
              </div>
              <div className="text-xs text-muted">
                Compare your impact with other EcoTrack users in real time.
              </div>
            </div>
            <div className="card landing-reveal">
              <div style={{ fontSize: 34, marginBottom: 12 }}>⚡</div>
              <div className="section-title" style={{ fontSize: 20, marginBottom: 4 }}>
                Actions logged
              </div>
              <div className="text-xs text-muted">
                Track every ride, meal, and habit you log in the app.
              </div>
            </div>
            <div className="card landing-reveal">
              <div style={{ fontSize: 34, marginBottom: 12 }}>🔥</div>
              <div className="section-title" style={{ fontSize: 20, marginBottom: 4 }}>
                Live streaks &amp; badges
              </div>
              <div className="text-xs text-muted">
                Your current streak and unlocked badges are pulled directly from your daily log.
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="cta">
          <div className="landing-section-header landing-reveal">
            <div className="eyebrow">Community Love</div>
            <h2 className="title">Built for real eco warriors</h2>
            <p className="sub">
              EcoTrack is open source and designed so you can see your own impact clearly and share
              it with others.
            </p>
          </div>
          <div className="grid-3">
            <div className="card landing-reveal">
              <div className="text-sm" style={{ color: 'var(--gold)', marginBottom: 8 }}>
                Track your journey
              </div>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>
                Log actions daily and watch your personal CO₂ savings, streaks, and badges update
                live inside the app.
              </p>
            </div>
            <div className="card landing-reveal">
              <div className="text-sm" style={{ color: 'var(--gold)', marginBottom: 8 }}>
                Compete &amp; collaborate
              </div>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>
                Join challenges, climb the leaderboard, and invite friends or teammates to share the
                experience.
              </p>
            </div>
            <div className="card landing-reveal">
              <div className="text-sm" style={{ color: 'var(--gold)', marginBottom: 8 }}>
                Share your impact
              </div>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>
                Generate shareable impact cards directly from your real stats — no fake numbers,
                just your actual progress.
              </p>
            </div>
          </div>
        </section>

        <section className="landing-section cta" id="finalCta">
          <div className="landing-cta-inner">
            <div className="landing-cta-emoji">🌿</div>
            <h2 className="landing-cta-headline">
              The planet needs
              <br />
              your daily actions
            </h2>
            <p className="landing-cta-sub">
              Join 2 eco warriors already making a measurable difference. Log your first action in
              under 30 seconds — completely free, forever.
            </p>
            <div className="landing-cta-btns">
              <button
                type="button"
                className="landing-btn-hero-primary"
                onClick={onStartAuth}
              >
                🌱 Start Tracking Free
              </button>
              <button
                type="button"
                className="landing-btn-hero-secondary"
                onClick={onStartAuth}
              >
                Sign In to Dashboard →
              </button>
            </div>
            <div className="landing-cta-note">
              ✓ Free forever · ✓ No credit card · ✓ Open source
            </div>
          </div>
        </section>

        <footer className="landing-footer">
          <div className="landing-footer-inner">
            <div>
              <div className="logo">🌿 EcoTrack</div>
              <div className="tagline">Turning daily choices into climate action</div>
            </div>
            <div className="links">
              <button
                type="button"
                onClick={() => scrollTo('landingFeatures')}
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => scrollTo('landingImpact')}
              >
                Impact
              </button>
              <button type="button" onClick={onStartAuth}>
                Launch App
              </button>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <span>© 2025 EcoTrack. All rights reserved.</span>
            <span>
              Made with <span className="heart">♥</span> for the planet
            </span>
          </div>
        </footer>
      </main>
    </div>
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
              {a.category} · {(toDateSafe(a.date) || new Date()).toLocaleDateString()}
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
      const total = (actions || []).reduce((s, a) => {
        const ad = toDateSafe(a.date || a.createdAt);
        if (!ad) return s;
        const adDay = new Date(ad.getFullYear(), ad.getMonth(), ad.getDate());
        if (adDay.toDateString() !== dayKey) return s;
        return s + Number(a.co2 || a.carbonSaved || 0);
      }, 0);
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
      list = list.filter((a) => {
        const d = toDateSafe(a.date);
        return d && d >= w;
      });
    } else if (filterPeriod === 'month') {
      const m = new Date(Date.now() - 30 * 86400000);
      list = list.filter((a) => {
        const d = toDateSafe(a.date);
        return d && d >= m;
      });
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
                    {a.category} ·{' '}
                    {(toDateSafe(a.date) || new Date()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  {(a.description || a.notes) && (
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
                      {a.description || a.notes}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="action-co2">+{(a.carbonSaved ?? a.co2 ?? 0).toFixed(1)} kg</div>
                  <button
                    type="button"
                    onClick={() => onDelete(a.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text3)',
                      fontSize: 12,
                      cursor: 'pointer',
                      marginTop: 4,
                    }}
                  >
                    🗑 Delete
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
            const sorted = [...leaderboard].sort(
              (a, b) => (b.carbonSaved || 0) - (a.carbonSaved || 0),
            );
            const top3 = sorted.slice(0, 3);
            const order = [1, 0, 2];
            const podiumClass = ['p2', 'p1', 'p3'];
            const crowns = ['🥈', '👑', '🥉'];
            const colors = ['#c0cdd4', '#f0c040', '#d4855a'];
            return order.map((idx, pi) => {
              const p = top3[idx];
              if (!p) return null;
              const nm =
                p.user?.displayName || p.user?.name || p.user?.email || 'User';
              const photo =
                p.user?.photoUrl || p.user?.photoURL || p.user?.avatarUrl || null;
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
                    {photo ? (
                      <img src={photo} alt={nm} />
                    ) : (
                      <span>{p.isMe ? '😊' : initials}</span>
                    )}
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
            const nm =
              row.user?.displayName || row.user?.name || row.user?.email || 'User';
            const photo =
              row.user?.photoUrl || row.user?.photoURL || row.user?.avatarUrl || null;
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
                <div
                  className="lb-avatar"
                  style={{
                    background: 'rgba(93,222,127,0.08)',
                    color: 'var(--accent)',
                    overflow: 'hidden',
                  }}
                >
                  {photo ? (
                    <img src={photo} alt={nm} />
                  ) : (
                    <span>{row.isMe ? '😊' : initials}</span>
                  )}
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
  const [editPhoto, setEditPhoto] = useState(user?.photoUrl || '');
  const setUserStore = useAppStore((s) => s.setUser);

  useEffect(() => {
    setEditName(user?.name || '');
    setEditPhoto(user?.photoUrl || '');
  }, [user?.name, user?.photoUrl]);

  const saveProfile = async () => {
    const name = String(editName || '').trim();
    const photo = String(editPhoto || '').trim();
    if (!name) return;
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name,
          photoURL: photo || null,
        });
        await setDoc(
          doc(db, 'users', auth.currentUser.uid),
          {
            displayName: name,
            email: auth.currentUser.email || '',
            photoUrl: photo || null,
          },
          { merge: true },
        );
      }
      setUserStore({
        ...(user || {}),
        name,
        photoUrl: photo || null,
      });
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
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name || 'Profile'}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
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
          <div className="form-group mb-16">
            <label className="form-label">Profile Photo URL</label>
            <input
              className="form-control"
              value={editPhoto}
              onChange={(e) => setEditPhoto(e.target.value)}
              placeholder="Paste an image URL (e.g. from Cloudinary)"
            />
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

function AppShell({ user, onLogout }) {
  const [page, setPage] = useState('dashboard');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fontSize, setFontSize] = useState('default');
  const stats = useAppStore((s) => s.stats);
  const actions = useAppStore((s) => s.actions);
  const challenges = useAppStore((s) => s.challenges);
  const leaderboard = useAppStore((s) => s.leaderboard);
  const addAction = useAppStore((s) => s.addAction);
  const removeAction = useAppStore((s) => s.removeAction);
  const joinChallenge = useAppStore((s) => s.joinChallenge);
  const progressChallenge = useAppStore((s) => s.progressChallenge);
  const tips = useAppStore((s) => s.tips);

  // Apply visual preferences to the document
  useEffect(() => {
    const body = document.body;
    if (!body) return;
    body.classList.toggle('hc', highContrast);
  }, [highContrast]);

  useEffect(() => {
    const body = document.body;
    if (!body) return;
    body.classList.toggle('no-motion', reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    const body = document.body;
    if (!body) return;
    body.classList.remove('small-text', 'large-text');
    if (fontSize === 'small') body.classList.add('small-text');
    if (fontSize === 'large') body.classList.add('large-text');
  }, [fontSize]);

  const handleNewAction = () => setActionModalOpen(true);
  const navTo = (next) => {
    setPage(next);
    setSidebarOpen(false);
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
        {sidebarOpen ? (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        ) : null}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">🌿 EcoTrack</div>
            <div className="logo-sub">Sustainability Tracker</div>
          </div>
          <nav className="nav">
            <button className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} type="button" onClick={() => navTo('dashboard')}>
              <span className="nav-icon">📊</span> Dashboard
            </button>
            <button className={`nav-item ${page === 'log' ? 'active' : ''}`} type="button" onClick={() => navTo('log')}>
              <span className="nav-icon">✏️</span> Action Log
            </button>
            <button className={`nav-item ${page === 'challenges' ? 'active' : ''}`} type="button" onClick={() => navTo('challenges')}>
              <span className="nav-icon">🏆</span> Challenges
            </button>
            <button className={`nav-item ${page === 'leaderboard' ? 'active' : ''}`} type="button" onClick={() => navTo('leaderboard')}>
              <span className="nav-icon">🥇</span> Leaderboard
            </button>
            <button className={`nav-item ${page === 'tips' ? 'active' : ''}`} type="button" onClick={() => navTo('tips')}>
              <span className="nav-icon">💡</span> Eco Tips
            </button>
            <button className={`nav-item ${page === 'share' ? 'active' : ''}`} type="button" onClick={() => navTo('share')}>
              <span className="nav-icon">📢</span> Share
            </button>
            <button className={`nav-item ${page === 'profile' ? 'active' : ''}`} type="button" onClick={() => navTo('profile')}>
              <span className="nav-icon">👤</span> Profile
            </button>
          </nav>
          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="avatar">
                {user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.name || 'Profile'}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <div className="user-name">{user?.name}</div>
                <div className="user-pts">{(stats?.totalCo2 ?? 0).toFixed(1)} kg CO₂ saved</div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
              onClick={onLogout}
            >
              Sign Out
            </button>
          </div>
        </aside>
        <main className="main">
          <div className="topbar">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => {
                setSidebarOpen((v) => !v);
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
            <div style={{ position: 'relative', marginRight: 12 }}>
              <button
                type="button"
                className="a11y-btn"
                aria-label="Visual settings"
                onClick={() => setA11yOpen((v) => !v)}
              >
                ⚙️
              </button>
              {a11yOpen && (
                <div className="a11y-panel">
                  <div className="a11y-label">Visual</div>
                  <div className="toggle-row">
                    <span>High Contrast</span>
                    <button
                      type="button"
                      className={`toggle-switch ${highContrast ? 'on' : ''}`}
                      onClick={() => setHighContrast((v) => !v)}
                    >
                      <span className="toggle-knob" />
                    </button>
                  </div>
                  <div className="toggle-row">
                    <span>Reduce Motion</span>
                    <button
                      type="button"
                      className={`toggle-switch ${reduceMotion ? 'on' : ''}`}
                      onClick={() => setReduceMotion((v) => !v)}
                    >
                      <span className="toggle-knob" />
                    </button>
                  </div>
                  <div className="a11y-label" style={{ marginTop: 12 }}>
                    Font Size
                  </div>
                  <div className="size-btns">
                    <button
                      type="button"
                      className={`size-btn ${fontSize === 'small' ? 'active' : ''}`}
                      onClick={() => setFontSize('small')}
                    >
                      Small
                    </button>
                    <button
                      type="button"
                      className={`size-btn ${fontSize === 'default' ? 'active' : ''}`}
                      onClick={() => setFontSize('default')}
                    >
                      Default
                    </button>
                    <button
                      type="button"
                      className={`size-btn ${fontSize === 'large' ? 'active' : ''}`}
                      onClick={() => setFontSize('large')}
                    >
                      Large
                    </button>
                  </div>
                  <div
                    style={{
                      marginTop: 16,
                      fontSize: 11,
                      color: 'var(--text3)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>Global ranking</span>
                    <span className="text-mono text-xs text-accent">
                      {leaderboard?.myRank ? `#${leaderboard.myRank}` : '—'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <button type="button" className="btn btn-primary" onClick={handleNewAction}>
              + Log Action
            </button>
          </div>
          <div className="content">
            {page === 'dashboard' && (
              <Dashboard
                user={user}
                stats={stats}
                actions={actions}
                leaderboard={leaderboard}
                onShowLog={() => navTo('log')}
              />
            )}
            {page === 'log' && <ActionLogPage actions={actions} onNew={handleNewAction} onDelete={removeAction} />}
            {page === 'challenges' && <ChallengesPage challenges={challenges} onJoin={joinChallenge} onProgress={progressChallenge} />}
            {page === 'leaderboard' && <LeaderboardPage data={leaderboard} onChangePeriod={() => {}} />}
            {page === 'tips' && <TipsPage tips={tips} />}
            {page === 'share' && <SharePage stats={stats} />}
            {page === 'profile' && <ProfilePage user={user} stats={stats} onLogout={onLogout} />}
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
  const [showAuth, setShowAuth] = useState(false);

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
        photoUrl: fbUser.photoURL || '',
      };
      setReadyUser(u);
      setUser(u);
      await startRealtime();
    });
    return () => unsub();
  }, [setUser, startRealtime, stopRealtime]);

  if (!readyUser) {
    if (showAuth) return <AuthScreen onAuthenticated={() => {}} />;
    return <LandingScreen onStartAuth={() => setShowAuth(true)} />;
  }
  return (
    <AppShell
      user={readyUser}
      onLogout={() => {
        setShowAuth(false);
        signOut(auth);
      }}
    />
  );
}
