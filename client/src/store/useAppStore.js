import { create } from 'zustand';
import { actionsAPI, challengesAPI, leaderboardAPI } from '../api';

export const useAppStore = create((set, get) => ({
  user: null,
  actions: [],
  stats: null,
  challenges: [],
  leaderboard: { leaderboard: [], myRank: null },
  loading: false,

  setUser: (user) => set({ user }),

  fetchStats: async () => {
    const stats = await actionsAPI.stats();
    set({ stats });
    return stats;
  },

  fetchActions: async (params) => {
    const { actions } = await actionsAPI.list(params);
    set({ actions });
    return actions;
  },

  addAction: async (data) => {
    const action = await actionsAPI.create(data);
    set((s) => ({ actions: [action, ...s.actions] }));
    get().fetchStats();
    return action;
  },

  removeAction: async (id) => {
    await actionsAPI.delete(id);
    set((s) => ({ actions: s.actions.filter((a) => a.id !== id) }));
    get().fetchStats();
  },

  fetchChallenges: async () => {
    const challenges = await challengesAPI.list();
    set({ challenges });
    return challenges;
  },

  joinChallenge: async (id) => {
    await challengesAPI.join(id);
    get().fetchChallenges();
  },

  fetchLeaderboard: async (period) => {
    const data = await leaderboardAPI.get(period);
    set({ leaderboard: data });
    return data;
  },
}));