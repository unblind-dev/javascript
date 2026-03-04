import { TimeRange } from "@/components/TimeRange";
import { Chart } from "..";
import {
  generateMetadataDict,
  generateSeries,
  ChartCard,
} from "./utils";
import { useMemo, type ComponentProps } from "react";
import { useScope } from "@/providers";
import { deduceTimestamp } from "@/hooks/utils";

export default {
  title: "Examples/Dashboard",
};

type ChartProps = ComponentProps<typeof Chart>;
type DashboardCard = { title: string; badge?: string } & Omit<
  ChartProps,
  "times"
>;

const SYNCHRONIZED_POINTS = 61;
const LAST_24H_POINTS = 97;
const LAST_7D_POINTS = 169;
const LAST_30D_POINTS = 31;

function buildSynchronizedTimes(startTime: number, endTime: number): number[] {
  if (startTime >= endTime) {
    return [startTime];
  }

  const step = (endTime - startTime) / (SYNCHRONIZED_POINTS - 1);
  return Array.from(
    { length: SYNCHRONIZED_POINTS },
    (_, index) => startTime + index * step,
  );
}

function resampleValues(values: number[], targetLength: number): number[] {
  if (targetLength <= 0) {
    return [];
  }

  if (values.length === targetLength) {
    return values;
  }

  if (values.length === 0) {
    return Array.from({ length: targetLength }, () => 0);
  }

  if (values.length === 1) {
    return Array.from({ length: targetLength }, () => values[0] ?? 0);
  }

  return Array.from({ length: targetLength }, (_, targetIndex) => {
    const sourceIndex = Math.round(
      (targetIndex * (values.length - 1)) / (targetLength - 1),
    );
    return values[sourceIndex] ?? values[0] ?? 0;
  });
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function regenerateValuesForRange(
  values: number[],
  targetLength: number,
  seed: number,
): number[] {
  const resampledValues = resampleValues(values, targetLength);
  const random = createSeededRandom(seed);

  return resampledValues.map((value) => {
    const jitter = (random() - 0.5) * 0.24;
    return Math.round(value * (1 + jitter) * 100) / 100;
  });
}

export const Dashboard = () => {
  const {
    timeRange,
    startTime: scopeStartTime,
    endTime: scopeEndTime,
  } = useScope();
  const [startTime, endTime] = deduceTimestamp(
    timeRange,
    scopeStartTime,
    scopeEndTime,
  );

  const synchronizedTimes = useMemo(
    () => buildSynchronizedTimes(startTime, endTime),
    [startTime, endTime],
  );
  const rangeSeed = useMemo(
    () => (Math.floor(startTime) ^ Math.floor(endTime)) >>> 0,
    [startTime, endTime],
  );

  return (
    <div
      style={{
        padding: "24px",
        minHeight: "100vh",
        width: "100%",
        display: "grid",
        maxWidth: "1800px",
      }}
    >
      <h1
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "#ccc",
          marginBottom: "32px",
          letterSpacing: "0.05em",
        }}
      >
        Chart Explorer
      </h1>
      <TimeRange />
      {SECTIONS.map(({ section, cards }) => (
        <div key={section} style={{ marginTop: "2rem" }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#555",
              marginBottom: "16px",
            }}
          >
            {section}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
              gap: "16px",
            }}
          >
            {cards.map(({ title, badge, series, ...chartProps }) => (
              <ChartCard
                key={title}
                title={title}
                badge={badge}
                {...chartProps}
                times={synchronizedTimes}
                series={series.map((serie, index) => ({
                  ...serie,
                  values: regenerateValuesForRange(
                    serie.values,
                    synchronizedTimes.length,
                    rangeSeed + index,
                  ),
                }))}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

Dashboard.parameters = { layout: "fullscreen" };

const SECTIONS: {
  section: string;
  cards: DashboardCard[];
}[] = [
  {
    section: "Percentages",
    cards: [
      {
        title: "CPU Usage - normal range",
        badge: "percent",
        type: "bar",
        series: [
          generateSeries({
            metric: "container.cpu.usage",
            length: 60,
            pattern: "random",
            min: 20,
            max: 80,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "container.cpu.usage",
            suggestedLabel: "Usage",
            unitCode: "percent",
          },
        ]),
      },
      {
        title: "CPU Usage - exceeds 100%",
        badge: "percent",
        type: "bar",
        series: [
          generateSeries({
            metric: "container.cpu.usage",
            length: 60,
            pattern: "spike",
            min: 0,
            max: 130,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "container.cpu.usage",
            suggestedLabel: "Usage",
            unitCode: "percent",
          },
        ]),
      },
      {
        title: "Memory Usage - percentunit",
        badge: "percentunit",
        type: "line",
        series: [
          generateSeries({
            metric: "container.memory.usage",
            length: 60,
            pattern: "random",
            min: 0.3,
            max: 0.8,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "container.memory.usage",
            suggestedLabel: "Usage",
            unitCode: "percentunit",
          },
        ]),
      },
      {
        title: "Disk Usage - low values",
        badge: "percent",
        type: "line",
        fill: true,
        series: [
          generateSeries({
            metric: "disk.usage",
            length: LAST_24H_POINTS,
            pattern: "linear",
            min: 10,
            max: 45,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "disk.usage", suggestedLabel: "Usage", unitCode: "percent" },
        ]),
      },
    ],
  },
  {
    section: "Bytes & Data Rate",
    cards: [
      {
        title: "Network I/O - GiB range",
        badge: "bytes",
        type: "line",
        series: [
          generateSeries({
            metric: "net.io",
            length: LAST_24H_POINTS,
            pattern: "random",
            min: 100_000_000,
            max: 5_000_000_000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "net.io", suggestedLabel: "IO", unitCode: "bytes" },
        ]),
      },
      {
        title: "Filesystem - TiB range",
        badge: "bytes",
        type: "step",
        series: [
          generateSeries({
            metric: "fs.usage",
            length: LAST_24H_POINTS,
            pattern: "linear",
            min: 100_000_000_000,
            max: 800_000_000_000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "fs.usage", suggestedLabel: "Usage", unitCode: "bytes" },
        ]),
      },
      {
        title: "Throughput - bytes/s",
        badge: "bytes/s",
        type: "line",
        fill: true,
        series: [
          generateSeries({
            metric: "net.throughput",
            length: 60,
            pattern: "sine",
            min: 1_000_000,
            max: 50_000_000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "net.throughput",
            suggestedLabel: "Throughput",
            unitCode: "bytes/s",
          },
        ]),
      },
      {
        title: "Bandwidth spike",
        badge: "bytes/s",
        type: "bar",
        series: [
          generateSeries({
            metric: "net.bandwidth",
            length: 60,
            pattern: "spike",
            min: 0,
            max: 1_000_000_000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "net.bandwidth",
            suggestedLabel: "Bandwidth",
            unitCode: "bytes",
          },
        ]),
      },
    ],
  },
  {
    section: "Time Units",
    cards: [
      {
        title: "Request Latency - ms",
        badge: "ms",
        type: "line",
        series: [
          generateSeries({
            metric: "req.latency",
            length: 60,
            pattern: "spike",
            min: 50,
            max: 2000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "req.latency", suggestedLabel: "Latency", unitCode: "ms" },
        ]),
      },
      {
        title: "GC Pause - µs range",
        badge: "µs",
        type: "bar",
        series: [
          generateSeries({
            metric: "gc.pause",
            length: 60,
            pattern: "random",
            min: 100,
            max: 800,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "gc.pause", suggestedLabel: "Pause", unitCode: "µs" },
        ]),
      },
      {
        title: "Job Duration - seconds",
        badge: "s",
        type: "bar",
        series: [
          generateSeries({
            metric: "job.duration",
            length: LAST_7D_POINTS,
            pattern: "random",
            min: 10,
            max: 120,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "job.duration", suggestedLabel: "Duration", unitCode: "s" },
        ]),
      },
      {
        title: "Uptime - hours",
        badge: "h",
        type: "line",
        series: [
          generateSeries({
            metric: "uptime",
            length: LAST_7D_POINTS,
            pattern: "linear",
            min: 0,
            max: 168,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "uptime", suggestedLabel: "Uptime", unitCode: "h" },
        ]),
      },
    ],
  },
  {
    section: "Stacking & Multi-series",
    cards: [
      {
        title: "Request breakdown - stacked area",
        badge: "area",
        type: "area",
        series: [
          generateSeries({
            metric: "req.error",
            length: 60,
            pattern: "spike",
            min: 0,
            max: 50,
            queryIndex: 0,
          }),
          generateSeries({
            metric: "req.warning",
            length: 60,
            pattern: "random",
            min: 0,
            max: 30,
            queryIndex: 0,
          }),
          generateSeries({
            metric: "req.ok",
            length: 60,
            pattern: "random",
            min: 0,
            max: 200,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "req.error", suggestedLabel: "Error" },
          { name: "req.warning", suggestedLabel: "Warning" },
          { name: "req.ok", suggestedLabel: "OK" },
        ]),
      },
      {
        title: "Multi-metric - different scales",
        badge: "line",
        type: "line",
        fill: true,
        series: [
          generateSeries({
            metric: "cpu.usage",
            length: LAST_24H_POINTS,
            pattern: "random",
            min: 10,
            max: 60,
            queryIndex: 0,
            attributes: { service: "api" },
          }),
          generateSeries({
            metric: "cpu.usage",
            length: LAST_24H_POINTS,
            pattern: "sine",
            min: 30,
            max: 80,
            queryIndex: 0,
            attributes: { service: "worker" },
          }),
          generateSeries({
            metric: "cpu.usage",
            length: LAST_24H_POINTS,
            pattern: "random",
            min: 5,
            max: 30,
            queryIndex: 0,
            attributes: { service: "db" },
          }),
        ],
        metadata: generateMetadataDict([
          { name: "cpu.usage", suggestedLabel: "CPU", unitCode: "percent" },
        ]),
      },
      {
        title: "Log volume - 30 days",
        badge: "bar",
        type: "bar",
        colors: ["#1D3D14", "#7D9984"],
        series: [
          generateSeries({
            metric: "Logs",
            length: LAST_30D_POINTS,
            pattern: "spike",
            min: 0,
            max: 2_000_000,
            queryIndex: 0,
          }),
          generateSeries({
            metric: "Metrics",
            length: LAST_30D_POINTS,
            pattern: "random",
            min: 0,
            max: 3_000_000,
            queryIndex: 0,
          }),
        ],
        metadata: {
          Logs: {
            unit: { code: "short" },
            type: "sum",
            name: "Logs",
            description: "",
          },
          Metrics: {
            unit: { code: "short" },
            type: "sum",
            name: "Metrics",
            description: "",
          },
        },
      },
      {
        title: "Exponential growth",
        badge: "spline",
        type: "spline",
        fill: true,
        series: [
          generateSeries({
            metric: "user.count",
            length: 30,
            pattern: "exponential",
            min: 1000,
            max: 10000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "user.count", suggestedLabel: "Users", type: "gauge" },
        ]),
      },
    ],
  },
  {
    section: "Thresholds",
    cards: [
      {
        title: "Memory - range thresholds",
        badge: "percent",
        type: "bar",
        series: [
          generateSeries({
            metric: "mem.usage",
            length: LAST_24H_POINTS,
            pattern: "spike",
            min: 0,
            max: 100,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "mem.usage", suggestedLabel: "Usage", unitCode: "percent" },
        ]),
        thresholds: [
          { from: 75, to: 85, level: "warning" },
          { from: 85, to: 100, level: "error" },
        ],
      },
      {
        title: "Filesystem - line thresholds",
        badge: "bytes",
        type: "step",
        series: [
          generateSeries({
            metric: "fs.usage",
            length: LAST_24H_POINTS,
            pattern: "linear",
            min: 100,
            max: 100_000_000_000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "fs.usage", suggestedLabel: "Usage", unitCode: "bytes" },
        ]),
        thresholds: [
          { value: 50_000_000_000, level: "info" },
          { value: 100_000_000_000, level: "ok" },
          { value: 150_000_000_000, level: "warning" },
          { value: 200_000_000_000, level: "error" },
        ],
        min: 0,
        max: 300_000_000_000,
      },
    ],
  },
  {
    section: "Edge Cases",
    cards: [
      {
        title: "All zeros",
        badge: "edge",
        type: "line",
        series: [
          generateSeries({
            metric: "cpu.usage",
            length: 60,
            pattern: "random",
            min: 0,
            max: 0,
            baseValue: 0,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "cpu.usage", suggestedLabel: "Usage", unitCode: "percent" },
        ]),
      },
      {
        title: "Half period data",
        badge: "edge",
        type: "line",
        series: [
          generateSeries({
            metric: "cpu.usage",
            length: 30,
            pattern: "random",
            min: 10,
            max: 20,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "cpu.usage", suggestedLabel: "Usage", unitCode: "percent" },
        ]),
      },
      {
        title: "Minimal / hidden axes",
        badge: "edge",
        type: "bar",
        hideAxis: true,
        hideCursor: true,
        tooltip: { hide: true },
        series: [
          generateSeries({
            metric: "req.count",
            length: 60,
            pattern: "spike",
            min: 0,
            max: 50,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "req.count", suggestedLabel: "Requests" },
        ]),
      },
      {
        title: "Relative time axis",
        badge: "edge",
        type: "area",
        relativeTimeAxis: true,
        series: [
          generateSeries({
            metric: "req.count",
            length: 60,
            pattern: "random",
            min: 0,
            max: 80,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "req.count", suggestedLabel: "Requests" },
        ]),
      },
    ],
  },
];
