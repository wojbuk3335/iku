"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  CreatorDemographics,
  CreatorEventBadge,
  CreatorFollowerRow,
  CreatorFollowerStats,
  CreatorParticipantStats,
  CreatorViewStats,
} from "@/app/admin/actions";
import { CreatorEventsList } from "@/components/admin/creator-events-list";
import type { Event } from "@/types/event";

type InnerTab = "analityka" | "events" | "widownia";
type ChartMode = "views" | "participants";

function formatCount(n: number): string {
  return n.toLocaleString("pl-PL");
}

function formatEngagementRate(participants: number, views: number): string {
  if (views <= 0) return "0%";
  const pct = (participants / views) * 100;
  const rounded = pct >= 10 ? Math.round(pct) : Math.round(pct * 10) / 10;
  return `${rounded.toLocaleString("pl-PL")}%`;
}

function engagementRate(participants: number, views: number): number {
  if (views <= 0) return 0;
  return (participants / views) * 100;
}

function formatChangePercent(current: number, previous: number): {
  change: string;
  up: boolean;
} {
  if (previous === 0) {
    if (current === 0) return { change: "0%", up: true };
    return { change: "+100%", up: true };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return {
    change: `${up ? "+" : ""}${pct}%`,
    up,
  };
}

function formatEngagementChange(current: number, previous: number): {
  change: string;
  up: boolean;
} {
  if (previous === 0 && current === 0) return { change: "0%", up: true };
  if (previous === 0) return { change: "+100%", up: true };
  const diffPp = Math.round((current - previous) * 10) / 10;
  const up = diffPp >= 0;
  const formatted =
    Math.abs(diffPp) >= 10
      ? Math.round(diffPp).toString()
      : diffPp.toLocaleString("pl-PL");
  return {
    change: `${up ? "+" : ""}${formatted} pp`,
    up,
  };
}

const DEMOGRAPHIC_COLORS = ["#a855f7", "#22d3ee", "#fb923c", "#f472b6"] as const;

const EMPTY_DEMOGRAPHICS: CreatorDemographics = {
  rows: [
    { label: "18–24 lat", value: 0, color: DEMOGRAPHIC_COLORS[0], count: 0 },
    { label: "25–34 lat", value: 0, color: DEMOGRAPHIC_COLORS[1], count: 0 },
    { label: "35–44 lat", value: 0, color: DEMOGRAPHIC_COLORS[2], count: 0 },
    { label: "45+", value: 0, color: DEMOGRAPHIC_COLORS[3], count: 0 },
  ],
  sampleSize: 0,
  unknownAge: 0,
};

const VIEWS_SERIES_MOCK = [620, 780, 910, 1050, 1280, 1820, 1540];
const PARTICIPANTS_SERIES_MOCK = [90, 110, 140, 160, 190, 260, 210];
const DAYS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

const EMPTY_METRIC_STATS: CreatorViewStats = {
  total: 0,
  last7Days: 0,
  prev7Days: 0,
  seriesLast7Days: [0, 0, 0, 0, 0, 0, 0],
};

const EMPTY_FOLLOWER_STATS: CreatorFollowerStats = {
  total: 0,
  last7Days: 0,
  prev7Days: 0,
};

function KpiIcon({ name }: { name: string }) {
  const p = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    className: "h-5 w-5",
  } as const;

  if (name === "eye") {
    return (
      <svg {...p}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  if (name === "users") {
    return (
      <svg {...p}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (name === "zap") {
    return (
      <svg {...p}>
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    );
  }
  return (
    <svg {...p}>
      <path d="m12 2 2.9 6.3L22 9.3l-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 7.1-1z" />
    </svg>
  );
}

function TrendBadge({ up, change }: { up: boolean; change: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        up
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-rose-500/15 text-rose-400"
      }`}
    >
      <svg
        viewBox="0 0 12 12"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        {up ? (
          <path d="M2 8.5 6 4l4 4.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M2 4 6 8.5 10 4" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      {change}
    </span>
  );
}

function AreaChart({
  values,
  maxY,
}: {
  values: number[];
  maxY: number;
}) {
  const width = 560;
  const height = 180;
  const padX = 8;
  const padTop = 12;
  const padBottom = 8;
  const chartH = height - padTop - padBottom;
  const chartW = width - padX * 2;

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * chartW;
    const y = padTop + chartH - (v / maxY) * chartH;
    return { x, y };
  });

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${line} L ${points[points.length - 1].x} ${height - padBottom} L ${points[0].x} ${height - padBottom} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-44 w-full overflow-visible"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="statsArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.02" />
        </linearGradient>
        <filter id="statsGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((t) => {
        const y = padTop + chartH * (1 - t);
        return (
          <line
            key={t}
            x1={padX}
            x2={width - padX}
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
          />
        );
      })}
      <path d={area} fill="url(#statsArea)" />
      <path
        d={line}
        fill="none"
        stroke="#c084fc"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#statsGlow)"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#e9d5ff" />
      ))}
    </svg>
  );
}

export function CreatorStatsPage({
  events = [],
  badgesByEvent = {},
  viewStats = EMPTY_METRIC_STATS,
  participantStats = EMPTY_METRIC_STATS,
  followerStats = EMPTY_FOLLOWER_STATS,
  followers = [],
  demographics = EMPTY_DEMOGRAPHICS,
  initialTab = "analityka",
}: {
  events?: Event[];
  badgesByEvent?: Record<string, CreatorEventBadge[]>;
  viewStats?: CreatorViewStats;
  participantStats?: CreatorParticipantStats;
  followerStats?: CreatorFollowerStats;
  followers?: CreatorFollowerRow[];
  demographics?: CreatorDemographics;
  initialTab?: InnerTab;
}) {
  const [innerTab, setInnerTab] = useState<InnerTab>(initialTab);
  const [chartMode, setChartMode] = useState<ChartMode>("views");

  const viewsChange = formatChangePercent(
    viewStats.last7Days,
    viewStats.prev7Days,
  );
  const participantsChange = formatChangePercent(
    participantStats.last7Days,
    participantStats.prev7Days,
  );
  const engagementChange = formatEngagementChange(
    engagementRate(participantStats.last7Days, viewStats.last7Days),
    engagementRate(participantStats.prev7Days, viewStats.prev7Days),
  );
  const followersChange = formatChangePercent(
    followerStats.last7Days,
    followerStats.prev7Days,
  );
  const audienceTrendLabel =
    followersChange.change === "0%"
      ? "0% w tym tygodniu"
      : `${followersChange.change} w tym tygodniu`;

  const kpi = useMemo(
    () => [
      {
        id: "views",
        label: "Wyświetlenia",
        value: formatCount(viewStats.total),
        change: viewsChange.change,
        up: viewsChange.up,
        iconBg: "bg-cyan-500/15",
        iconColor: "text-cyan-400",
        icon: "eye",
      },
      {
        id: "participants",
        label: "Uczestnicy",
        value: formatCount(participantStats.total),
        change: participantsChange.change,
        up: participantsChange.up,
        iconBg: "bg-violet-500/15",
        iconColor: "text-violet-400",
        icon: "users",
      },
      {
        id: "engagement",
        label: "Zaangażowanie",
        value: formatEngagementRate(
          participantStats.total,
          viewStats.total,
        ),
        change: engagementChange.change,
        up: engagementChange.up,
        iconBg: "bg-rose-500/15",
        iconColor: "text-rose-400",
        icon: "zap",
      },
      {
        id: "followers",
        label: "Obserwujący",
        value: formatCount(followerStats.total),
        change: followersChange.change,
        up: followersChange.up,
        iconBg: "bg-amber-500/15",
        iconColor: "text-amber-400",
        icon: "star",
      },
    ],
    [
      viewStats.total,
      viewsChange.change,
      viewsChange.up,
      participantStats.total,
      participantsChange.change,
      participantsChange.up,
      engagementChange.change,
      engagementChange.up,
      followerStats.total,
      followersChange.change,
      followersChange.up,
    ],
  );

  const viewsSeries = viewStats.seriesLast7Days;
  const participantsSeries = participantStats.seriesLast7Days;
  const hasRealViews = viewsSeries.some((v) => v > 0) || viewStats.total > 0;
  const hasRealParticipants =
    participantsSeries.some((v) => v > 0) || participantStats.total > 0;

  const series =
    chartMode === "views"
      ? hasRealViews
        ? viewsSeries
        : VIEWS_SERIES_MOCK
      : hasRealParticipants
        ? participantsSeries
        : PARTICIPANTS_SERIES_MOCK;

  const maxY = Math.max(
    ...(chartMode === "views"
      ? hasRealViews
        ? [...viewsSeries, 1]
        : [2000]
      : hasRealParticipants
        ? [...participantsSeries, 1]
        : [300]),
  );

  const yLabels = useMemo(() => {
    const useReal =
      chartMode === "views" ? hasRealViews : hasRealParticipants;
    if (!useReal) {
      return chartMode === "views"
        ? ["0", "500", "1000", "1500", "2000"]
        : ["0", "75", "150", "225", "300"];
    }
    const step = maxY / 4;
    return [0, 1, 2, 3, 4].map((i) => formatCount(Math.round(step * i)));
  }, [chartMode, hasRealViews, hasRealParticipants, maxY]);

  // Day labels for last 7 calendar days (ending today)
  const dayLabels = useMemo(() => {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]);
    }
    return labels;
  }, []);

  return (
    <div className="min-h-dvh w-full bg-[#08080f] text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-16 pt-6 sm:px-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-violet-400">
              PANEL TWÓRCY
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
              Studio IKU
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300 transition-colors hover:bg-white/[0.06]"
              aria-label="Powiadomienia"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#08080f]" />
            </button>
            <Link
              href="/admin/settings/profile"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300 transition-colors hover:bg-white/[0.06]"
              aria-label="Ustawienia"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Inner tabs */}
        <div className="mb-6 flex gap-2">
          {(
            [
              { id: "analityka", label: "Analityka" },
              { id: "events", label: "Moje Events" },
              { id: "widownia", label: "Widownia" },
            ] as const
          ).map((tab) => {
            const active = innerTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInnerTab(tab.id)}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border border-violet-500/60 bg-violet-500/15 text-violet-300"
                    : "border border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {innerTab === "analityka" && (
          <div className="flex flex-col gap-4">
            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-3">
              {kpi.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/[0.06] bg-[#12121a] p-4"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${item.iconBg} ${item.iconColor}`}
                    >
                      <KpiIcon name={item.icon} />
                    </span>
                    <TrendBadge up={item.up} change={item.change} />
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-white">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <section className="rounded-2xl border border-white/[0.06] bg-[#12121a] p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Wyświetlenia
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-500">Ostatnie 7 dni</p>
                </div>
                <div className="flex rounded-full border border-white/10 p-0.5">
                  <button
                    type="button"
                    onClick={() => setChartMode("views")}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      chartMode === "views"
                        ? "bg-violet-600 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Wyśw.
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode("participants")}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      chartMode === "participants"
                        ? "bg-violet-600 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Uczest.
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex w-8 flex-col justify-between pb-6 pt-1 text-right text-[10px] text-zinc-600">
                  {[...yLabels].reverse().map((l, i) => (
                    <span key={i}>{l}</span>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <AreaChart values={series} maxY={maxY} />
                  <div className="mt-1 flex justify-between px-1 text-[10px] text-zinc-500">
                    {dayLabels.map((d, i) => (
                      <span key={`${d}-${i}`}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Demographics */}
            <section className="rounded-2xl border border-white/[0.06] bg-[#12121a] p-4">
              <h2 className="mb-1 text-base font-semibold text-white">
                Demografika
              </h2>
              <p className="mb-4 text-xs text-zinc-500">
                {demographics.sampleSize > 0
                  ? `Na podstawie ${demographics.sampleSize} ${
                      demographics.sampleSize === 1
                        ? "osoby"
                        : "osób"
                    } z podaną datą urodzenia`
                  : "Brak danych — potrzebne osoby z datą urodzenia w Twojej widowni"}
              </p>
              {demographics.sampleSize === 0 ? (
                <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-6 text-center text-sm text-zinc-500">
                  Gdy ktoś z datą urodzenia Cię obserwuje, wejdzie na event albo
                  kliknie „Idę”, zobaczysz tu podział wieku.
                </p>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {demographics.rows.map((row) => (
                    <div key={row.label}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="text-zinc-400">{row.label}</span>
                        <span className="font-semibold text-white">
                          {row.value}%
                          <span className="ml-1.5 text-xs font-normal text-zinc-600">
                            ({row.count})
                          </span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${row.value}%`,
                            background: row.color,
                            boxShadow: `0 0 12px ${row.color}55`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {innerTab === "events" && (
          <CreatorEventsList
            events={events}
            badgesByEvent={badgesByEvent}
            embedded
          />
        )}

        {innerTab === "widownia" && (
          <div className="flex flex-col gap-5">
            <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#2a1845] via-[#1a1228] to-[#12121a] p-5 shadow-[0_0_40px_rgba(139,92,246,0.12)]">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-violet-300/80">
                ŁĄCZNA WIDOWNIA
              </p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-white">
                {formatCount(followerStats.total)}
              </p>
              <p
                className={`mt-2 inline-flex items-center gap-1.5 text-sm font-medium ${
                  followersChange.up ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                <svg
                  viewBox="0 0 12 12"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden
                >
                  {followersChange.up ? (
                    <path
                      d="M2 8.5 6 4l4 4.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <path
                      d="M2 4 6 8.5 10 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
                {audienceTrendLabel}
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-white">
                Aktywni obserwujący
              </h2>
              {followers.length === 0 ? (
                <p className="rounded-2xl border border-white/[0.06] bg-[#12121a] px-4 py-8 text-center text-sm text-zinc-500">
                  Nikt jeszcze Cię nie obserwuje. Gdy ktoś kliknie Obserwuj na
                  Twoim profilu, pojawi się tutaj.
                </p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {followers.map((person) => (
                    <li
                      key={person.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#12121a] px-3 py-3"
                    >
                      {person.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={person.avatar}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-sm font-semibold text-violet-200">
                          {person.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {person.name}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {person.detail}
                        </p>
                      </div>
                      {person.badge === "VIP" ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 px-2.5 py-1 text-[10px] font-bold text-black">
                          <svg
                            viewBox="0 0 12 12"
                            className="h-3 w-3"
                            fill="currentColor"
                            aria-hidden
                          >
                            <path d="m6 1 1.5 3.2L11 5l-2.5 2.4.6 3.6L6 9.2 2.9 11l.6-3.6L1 5l3.5-.8z" />
                          </svg>
                          VIP
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-300">
                          Fan
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
