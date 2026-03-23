"use client";

import { useEffect } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useReplayStore } from "@/lib/state/replay";
import type { TwinMarketReplayFrame } from "@/types/twinmarket";

type ReplayControlPanelProps = {
  frames: TwinMarketReplayFrame[];
  scenarios: string[];
  defaultDate: string;
  seed: number;
};

const SPEED_OPTIONS: Array<1 | 2 | 4 | 8> = [1, 2, 4, 8];

export function ReplayControlPanel({ frames, scenarios, defaultDate, seed }: ReplayControlPanelProps) {
  const {
    currentTick,
    isPlaying,
    maxTick,
    selectedScenario,
    speed,
    setCurrentTick,
    setMaxTick,
    setScenario,
    togglePlaying,
    stepBackward,
    stepForward,
    reset,
  } = useReplayStore();

  useEffect(() => {
    setMaxTick(Math.max(frames.length - 1, 0));
  }, [frames.length, setMaxTick]);

  useEffect(() => {
    if (!isPlaying || !frames.length) return;

    const delay = Math.max(260, 1000 / speed);
    const timer = window.setInterval(() => {
      const state = useReplayStore.getState();

      if (state.currentTick >= state.maxTick) {
        state.setPlaying(false);
        return;
      }

      state.stepForward();
    }, delay);

    return () => window.clearInterval(timer);
  }, [frames.length, isPlaying, speed]);

  const activeFrame = frames[currentTick] ?? frames[0];
  const chartData = frames.map((frame) => ({
    label: frame.label,
    sentiment: Number((frame.sentimentScore * 100).toFixed(1)),
    imbalance: Number((frame.imbalanceScore * 100).toFixed(1)),
  }));

  return (
    <div className="grid gap-4 p-5 md:grid-cols-[1.15fr_0.85fr] md:p-6">
      <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={togglePlaying}
            className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            {isPlaying ? "❚❚ Pause" : "▶ Play"}
          </button>
          <button
            onClick={stepBackward}
            className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
          >
            ← Step
          </button>
          <button
            onClick={stepForward}
            className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
          >
            Step →
          </button>
          <button
            onClick={reset}
            className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
          >
            ↺ Reset
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Scenario</div>
            <select
              value={selectedScenario}
              onChange={(event) => setScenario(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none"
            >
              {scenarios.map((scenario) => (
                <option key={scenario} value={scenario}>
                  {scenario}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Date / seed</div>
            <div className="mt-2 font-medium text-white">{defaultDate}</div>
            <div className="mt-1 text-zinc-400">seed {seed}</div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Timeline</div>
                <div className="mt-2 font-medium text-white">
                  Tick {currentTick + 1} / {maxTick + 1} · {activeFrame?.label} · {activeFrame?.phase}
                </div>
              </div>
              <div className="flex gap-2">
                {SPEED_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => useReplayStore.getState().setSpeed(option)}
                    className={`rounded-full border px-3 py-1 text-xs ${speed === option ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.03] text-zinc-400"}`}
                  >
                    {option}x
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(frames.length - 1, 0)}
              value={currentTick}
              onChange={(event) => setCurrentTick(Number(event.target.value))}
              className="mt-4 w-full accent-cyan-300"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
              {frames.map((frame) => (
                <span key={frame.tick}>{frame.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(12,18,31,0.96),rgba(6,10,18,0.96))] p-5">
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Replay signal</div>
        <div className="mt-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="label" stroke="#71717a" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis stroke="#71717a" tickLine={false} axisLine={false} fontSize={12} width={30} />
              <Tooltip
                contentStyle={{ background: "#090f1b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }}
                labelStyle={{ color: "#e4e4e7" }}
              />
              <Line type="monotone" dataKey="sentiment" stroke="#67e8f9" strokeWidth={2.4} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="imbalance" stroke="#f97316" strokeWidth={2.2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {activeFrame ? (
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <div className="font-medium text-white">{activeFrame.headline}</div>
              <div className="mt-2 leading-6 text-zinc-400">{activeFrame.summary}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Breadth</div>
                <div className="mt-2 text-lg font-semibold text-white">{activeFrame.breadthLabel}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Sentiment</div>
                <div className="mt-2 text-lg font-semibold text-cyan-100">{Math.round(activeFrame.sentimentScore * 100)} / 100</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
