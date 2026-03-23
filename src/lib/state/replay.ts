import { create } from "zustand";

type ReplayState = {
  selectedAgentId: string | null;
  selectedScenario: string;
  currentTick: number;
  maxTick: number;
  isPlaying: boolean;
  speed: 1 | 2 | 4 | 8;
  setSelectedAgentId: (agentId: string | null) => void;
  setScenario: (scenario: string) => void;
  setCurrentTick: (tick: number) => void;
  setMaxTick: (tick: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  togglePlaying: () => void;
  setSpeed: (speed: 1 | 2 | 4 | 8) => void;
  stepForward: () => void;
  stepBackward: () => void;
  reset: () => void;
};

export const useReplayStore = create<ReplayState>((set) => ({
  selectedAgentId: null,
  selectedScenario: "Bullish diffusion / 社交扩散增强",
  currentTick: 0,
  maxTick: 0,
  isPlaying: false,
  speed: 2,
  setSelectedAgentId: (selectedAgentId) => set({ selectedAgentId }),
  setScenario: (selectedScenario) => set({ selectedScenario, currentTick: 0, isPlaying: false }),
  setCurrentTick: (currentTick) => set({ currentTick }),
  setMaxTick: (maxTick) =>
    set((state) => ({
      maxTick,
      currentTick: Math.min(state.currentTick, maxTick),
    })),
  setPlaying: (isPlaying) => set({ isPlaying }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSpeed: (speed) => set({ speed }),
  stepForward: () => set((state) => ({ currentTick: Math.min(state.currentTick + 1, state.maxTick) })),
  stepBackward: () => set((state) => ({ currentTick: Math.max(state.currentTick - 1, 0) })),
  reset: () => set({ currentTick: 0, isPlaying: false, selectedAgentId: null }),
}));
