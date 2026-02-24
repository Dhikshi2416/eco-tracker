import { create } from 'zustand';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  limit,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { uploadActionPhotoToCloudinary } from '../lib/cloudinary';
import { ensureSeedData } from '../lib/seed';

function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === 'function') return v.toDate();
  return new Date(v);
}

function computeStats(actions) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  let totalCo2 = 0;
  let weekCo2 = 0;
  const cats = { transport: 0, food: 0, energy: 0, waste: 0, water: 0 };

  const daySet = new Set();
  const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();
  let hasToday = false;
  for (const a of actions) {
    const co2 = Number(a.co2 || a.carbonSaved || 0);
    const d = toDate(a.date || a.createdAt) || now;
    totalCo2 += co2;
    if (d >= weekAgo) weekCo2 += co2;
    if (a.category) cats[a.category] = (cats[a.category] || 0) + co2;
    const dayKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
    daySet.add(dayKey);
    if (dayKey === todayKey) hasToday = true;
  }

  // Streak: consecutive days with >=1 action
  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  while (daySet.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  // If there is at least one action today but the loop above produced 0 (edge cases),
  // treat it as a 1-day streak so the dashboard reflects today's activity.
  if (streak === 0 && hasToday) streak = 1;

  const totalActions = actions.length;
  const weekActions = actions.filter((a) => {
    const d = toDate(a.date);
    return d && d >= weekAgo;
  }).length;

  // As a final safety net, if there are actions at all but streak still 0,
  // treat it as a 1-day streak so the UI reflects that the user has started.
  if (streak === 0 && totalActions > 0) streak = 1;

  return { totalCo2, totalActions, weekCo2, weekActions, streak, categories: cats };
}

async function ensureUserDoc(firebaseUser) {
  if (!firebaseUser) return;
  const userRef = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) return;
  await setDoc(
    userRef,
    {
      displayName: firebaseUser.displayName || 'Eco User',
      email: firebaseUser.email || '',
      photoUrl: firebaseUser.photoURL || null,
      createdAt: serverTimestamp(),
      totalCo2: 0,
      totalActions: 0,
    },
    { merge: true },
  );
}

async function uploadActionPhoto(uid, file) {
  if (!file) return null;
  // uid kept in signature in case you later want per-user Cloudinary folders
  return await uploadActionPhotoToCloudinary(file);
}

export const useAppStore = create((set, get) => ({
  user: null,
  actions: [],
  stats: null,
  challenges: [],
  leaderboard: { leaderboard: [], myRank: null },
  tips: [],
  loading: false,
  _unsubs: [],

  setUser: (user) => set({ user }),

  startRealtime: async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;

    await ensureUserDoc(fbUser);
    await ensureSeedData(db);

    // Clear previous listeners
    get().stopRealtime();

    const unsubs = [];

    // Actions (real-time)
    const actionsQ = query(
      collection(db, 'actions'),
      where('userId', '==', fbUser.uid),
      orderBy('date', 'desc'),
      limit(200),
    );
    unsubs.push(
      onSnapshot(actionsQ, (snap) => {
        const actions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        set({ actions, stats: computeStats(actions) });
      }),
    );

    // Challenges master
    const challengesQ = query(collection(db, 'challenges'), orderBy('createdAtOrder', 'asc'));
    // User challenge progress lives in a subcollection for simple security
    const userChallengesQ = collection(db, 'users', fbUser.uid, 'challenges');

    let challengesCache = [];
    let userChCache = new Map();

    const recomputeChallenges = () => {
      const combined = challengesCache.map((c) => {
        const uc = userChCache.get(c.id) || null;
        return { ...c, userChallenge: uc };
      });
      set({ challenges: combined });
    };

    unsubs.push(
      onSnapshot(challengesQ, (snap) => {
        challengesCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        recomputeChallenges();
      }),
    );
    unsubs.push(
      onSnapshot(userChallengesQ, (snap) => {
        userChCache = new Map(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
        recomputeChallenges();
      }),
    );

    // Leaderboard (real-time) from aggregated user totals
    const lbQ = query(collection(db, 'users'), orderBy('totalCo2', 'desc'), limit(50));
    unsubs.push(
      onSnapshot(lbQ, (snap) => {
        const rows = snap.docs.map((d, i) => ({
          rank: i + 1,
          user: { id: d.id, ...d.data() },
          carbonSaved: Number(d.data().totalCo2 || 0),
          actionsCount: Number(d.data().totalActions || 0),
          isMe: d.id === fbUser.uid,
        }));
        const myRank = rows.find((r) => r.isMe)?.rank || null;
        set({ leaderboard: { leaderboard: rows, myRank } });
      }),
    );

    // Tips (real-time, public content)
    const tipsQ = query(collection(db, 'tips'), orderBy('category', 'asc'));
    unsubs.push(
      onSnapshot(tipsQ, (snap) => {
        const tips = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        set({ tips });
      }),
    );

    set({ _unsubs: unsubs });
  },

  stopRealtime: () => {
    const prev = get()._unsubs || [];
    prev.forEach((u) => {
      try {
        u();
      } catch {
        // ignore
      }
    });
    set({ _unsubs: [] });
  },

  addAction: async (data, photoFile) => {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('Not signed in');

    let photoUrl = null;
    if (photoFile) {
      try {
        photoUrl = await uploadActionPhoto(fbUser.uid, photoFile);
      } catch (err) {
        // If photo upload fails, still save the action without a photo
        // eslint-disable-next-line no-console
        console.error('Photo upload failed, saving action without photo', err);
        photoUrl = null;
      }
    }
    const actionRef = doc(collection(db, 'actions'));
    const userRef = doc(db, 'users', fbUser.uid);
    const co2 = Number(data.co2 || 0);

    await runTransaction(db, async (tx) => {
      tx.set(actionRef, {
        userId: fbUser.uid,
        category: data.category,
        type: data.type,
        notes: data.description || '',
        co2,
        date: data.date ? new Date(data.date) : serverTimestamp(),
        photoUrl: photoUrl || null,
        createdAt: serverTimestamp(),
      });
      tx.set(
        userRef,
        {
          displayName: fbUser.displayName || 'Eco User',
          email: fbUser.email || '',
          photoUrl: fbUser.photoURL || null,
        },
        { merge: true },
      );
      tx.update(userRef, { totalCo2: increment(co2), totalActions: increment(1) });
    });

    // Optimistically update local state so dashboard & log reflect immediately
    const optimisticAction = {
      id: actionRef.id,
      userId: fbUser.uid,
      category: data.category,
      type: data.type,
      notes: data.description || '',
      co2,
      date: data.date ? new Date(data.date) : new Date(),
      photoUrl: photoUrl || null,
      createdAt: new Date(),
    };
    set((state) => {
      const actions = [optimisticAction, ...(state.actions || [])];
      return { actions, stats: computeStats(actions) };
    });

    // Update user challenge progress for matching category
    const stateChallenges = get().challenges || [];
    const matches = stateChallenges
      .filter((c) => c.userChallenge && !c.userChallenge.completed && c.category === data.category)
      .map((c) => ({ challenge: c, uc: c.userChallenge }));

    for (const { challenge, uc } of matches) {
      const nextProgress = Math.min((uc.progress || 0) + 1, challenge.targetCount);
      await setDoc(
        doc(db, 'users', fbUser.uid, 'challenges', challenge.id),
        {
          challengeId: challenge.id,
          title: challenge.title,
          category: challenge.category,
          targetCount: challenge.targetCount,
          progress: nextProgress,
          completed: nextProgress >= challenge.targetCount,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  },

  removeAction: async (id) => {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('Not signed in');

    const actionRef = doc(db, 'actions', id);
    const userRef = doc(db, 'users', fbUser.uid);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(actionRef);
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.userId !== fbUser.uid) throw new Error('Not allowed');
      const co2 = Number(data.co2 || 0);
      tx.delete(actionRef);
      tx.update(userRef, { totalCo2: increment(-co2), totalActions: increment(-1) });
    });

    // Optimistically update local state
    set((state) => {
      const actions = (state.actions || []).filter((a) => a.id !== id);
      return { actions, stats: computeStats(actions) };
    });
  },

  joinChallenge: async (challengeId) => {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('Not signed in');

    const chRef = doc(db, 'challenges', challengeId);
    const chSnap = await getDoc(chRef);
    if (!chSnap.exists()) throw new Error('Challenge not found');
    const ch = { id: chSnap.id, ...chSnap.data() };

    await setDoc(
      doc(db, 'users', fbUser.uid, 'challenges', challengeId),
      {
        challengeId,
        title: ch.title,
        category: ch.category,
        targetCount: ch.targetCount,
        progress: 0,
        completed: false,
        joinedAt: serverTimestamp(),
      },
      { merge: true },
    );
  },

  progressChallenge: async (challengeId) => {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('Not signed in');

    const ch = (get().challenges || []).find((c) => c.id === challengeId);
    if (!ch) return;
    const uc = ch.userChallenge;
    if (!uc || uc.completed) return;

    const nextProgress = Math.min((uc.progress || 0) + 1, ch.targetCount);
    await setDoc(
      doc(db, 'users', fbUser.uid, 'challenges', challengeId),
      {
        challengeId,
        title: ch.title,
        category: ch.category,
        targetCount: ch.targetCount,
        progress: nextProgress,
        completed: nextProgress >= ch.targetCount,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  },
}));