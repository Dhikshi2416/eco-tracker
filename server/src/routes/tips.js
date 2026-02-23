const express = require('express');

const ECO_TIPS = [
  { id: 1, category: 'transport', emoji: '🚲', title: 'Cycle More', text: 'Cycling 3 miles instead of driving saves 1.5 kg CO₂ per trip.', impact: '1.5 kg CO₂/trip' },
  { id: 2, category: 'food', emoji: '🥗', title: 'Go Plant-Based', text: 'Replacing one beef meal per week saves ~350 kg CO₂ annually.', impact: '350 kg CO₂/year' },
  { id: 3, category: 'energy', emoji: '💡', title: 'Switch to LED', text: 'LED bulbs use 75% less energy than incandescent lights.', impact: '0.3 kg CO₂/day' },
  { id: 4, category: 'waste', emoji: '♻️', title: 'Repair Don\'t Replace', text: 'Repairing a laptop instead of buying new saves ~300 kg CO₂.', impact: '300 kg CO₂/device' },
  { id: 5, category: 'water', emoji: '🚿', title: 'Shorter Showers', text: 'A 5-min shower vs 10-min saves 40 litres and heating CO₂.', impact: '0.2 kg CO₂/shower' },
  { id: 6, category: 'transport', emoji: '🚌', title: 'Take Public Transit', text: 'Bus or train reduces per-passenger emissions by up to 75%.', impact: '1.8 kg CO₂/trip' },
  { id: 7, category: 'food', emoji: '🌱', title: 'Grow Your Own', text: 'Even a small windowsill herb garden reduces food miles significantly.', impact: '0.5 kg CO₂/month' },
  { id: 8, category: 'waste', emoji: '🛍️', title: 'Refuse Single-Use Plastic', text: 'Reusable bags and containers eliminate thousands of plastic items over your lifetime.', impact: '23 kg CO₂/year' },
];

const tipsRouter = express.Router();

// GET /api/tips
tipsRouter.get('/', (req, res) => {
  const { category } = req.query;
  const tips = category ? ECO_TIPS.filter((t) => t.category === category) : ECO_TIPS;
  res.json(tips);
});

// GET /api/tips/daily
tipsRouter.get('/daily', (_, res) => {
  const tip = ECO_TIPS[new Date().getDay() % ECO_TIPS.length];
  res.json(tip);
});

module.exports = tipsRouter;