import { collection, doc, getDocs, limit, query, setDoc } from 'firebase/firestore';

export const DEFAULT_CHALLENGES = [
  {
    id: 'c1',
    category: 'transport',
    title: 'Car-Free Week',
    description: 'Avoid using a car for 7 days straight',
    durationDays: 7,
    targetCount: 7,
    carbonGoal: 16.8,
    createdAtOrder: 1,
    isActive: true,
  },
  {
    id: 'c2',
    category: 'food',
    title: 'Plant-Based Month',
    description: 'Eat plant-based meals for 30 days',
    durationDays: 30,
    targetCount: 30,
    carbonGoal: 45.0,
    createdAtOrder: 2,
    isActive: true,
  },
  {
    id: 'c3',
    category: 'energy',
    title: 'Energy Saver',
    description: 'Reduce home energy use for 14 days',
    durationDays: 14,
    targetCount: 14,
    carbonGoal: 16.8,
    createdAtOrder: 3,
    isActive: true,
  },
  {
    id: 'c4',
    category: 'waste',
    title: 'Zero Waste Week',
    description: 'Produce minimal waste for 7 days',
    durationDays: 7,
    targetCount: 7,
    carbonGoal: 3.5,
    createdAtOrder: 4,
    isActive: true,
  },
  {
    id: 'c5',
    category: 'water',
    title: 'Water Warrior',
    description: 'Conserve water every day for 10 days',
    durationDays: 10,
    targetCount: 10,
    carbonGoal: 8.0,
    createdAtOrder: 5,
    isActive: true,
  },
];

export const DEFAULT_TIPS = [
  {
    id: 't1',
    category: 'transport',
    emoji: '🚲',
    text: "Cycling just 3 miles instead of driving saves over 1kg of CO₂ per trip.",
    impact: 'Saves ~1.5 kg CO₂ per trip',
  },
  {
    id: 't2',
    category: 'food',
    emoji: '🥗',
    text: 'Replacing one beef meal per week with a plant-based option can reduce your annual carbon footprint by ~350 kg CO₂.',
    impact: 'Saves ~350 kg CO₂ per year',
  },
  {
    id: 't3',
    category: 'energy',
    emoji: '💡',
    text: 'Switching all bulbs to LEDs and turning off unused lights can cut household electricity use significantly.',
    impact: 'Saves ~0.3 kg CO₂ per day',
  },
  {
    id: 't4',
    category: 'waste',
    emoji: '♻️',
    text: 'Repairing electronics instead of replacing them is one of the highest-impact waste actions.',
    impact: 'Saves up to 300 kg CO₂',
  },
  {
    id: 't5',
    category: 'water',
    emoji: '🚿',
    text: 'A 5-minute shower uses far less hot water than a 10-minute one, cutting energy used for heating.',
    impact: 'Saves ~0.2 kg CO₂ per shower',
  },
];

export async function ensureSeedData(db) {
  // Only seed when explicitly enabled (prevents accidental writes in production)
  if (String(import.meta.env.VITE_ENABLE_SEED || '').toLowerCase() !== 'true') return;

  const challengesSnap = await getDocs(query(collection(db, 'challenges'), limit(1)));
  if (challengesSnap.empty) {
    await Promise.all(
      DEFAULT_CHALLENGES.map((c) =>
        setDoc(doc(db, 'challenges', c.id), c, { merge: true }),
      ),
    );
  }

  const tipsSnap = await getDocs(query(collection(db, 'tips'), limit(1)));
  if (tipsSnap.empty) {
    await Promise.all(DEFAULT_TIPS.map((t) => setDoc(doc(db, 'tips', t.id), t, { merge: true })));
  }
}

