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
  title: "Examples/DB Dashboard",
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

export const DBDashboard = () => {
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
        DB Explorer
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
            {cards.map(({ title, badge, series, ...chartProps }, cardIndex) => (
              <ChartCard
                key={title}
                title={title}
                badge={badge}
                {...chartProps}
                times={synchronizedTimes}
                series={series.map((serie, seriesIndex) => ({
                  ...serie,
                  values: regenerateValuesForRange(
                    serie.values,
                    synchronizedTimes.length,
                    rangeSeed + cardIndex * 97 + seriesIndex,
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

DBDashboard.parameters = { layout: "fullscreen" };

const SECTIONS: {
  section: string;
  cards: DashboardCard[];
}[] = [
  {
    section: "Connections",
    cards: [
      {
        title: "Active Connections",
        badge: "count",
        type: "line",
        series: [
          generateSeries({
            metric: "db.connections.active",
            length: 60,
            pattern: "random",
            min: 20,
            max: 150,
            queryIndex: 0,
            rounded: true,
          }),
          generateSeries({
            metric: "db.connections.idle",
            length: 60,
            pattern: "random",
            min: 5,
            max: 50,
            queryIndex: 1,
            rounded: true,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "db.connections.active", suggestedLabel: "Active" },
          { name: "db.connections.idle", suggestedLabel: "Idle" },
        ]),
      },
      {
        title: "Connection Pool Utilization",
        badge: "percent",
        type: "line",
        fill: true,
        series: [
          generateSeries({
            metric: "db.pool.utilization",
            length: LAST_24H_POINTS,
            pattern: "sine",
            min: 30,
            max: 95,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "db.pool.utilization",
            suggestedLabel: "Utilization",
            unitCode: "percent",
          },
        ]),
        thresholds: [
          { from: 80, to: 90, level: "warning" },
          { from: 90, to: 100, level: "error" },
        ],
      },
      {
        title: "Connection Errors",
        badge: "count",
        type: "bar",
        series: [
          generateSeries({
            metric: "db.connections.errors",
            length: LAST_24H_POINTS,
            pattern: "spike",
            min: 0,
            max: 25,
            queryIndex: 0,
            rounded: true,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "db.connections.errors", suggestedLabel: "Errors" },
        ]),
      },
      {
        title: "Max Connections by Instance",
        badge: "count",
        type: "spline",
        series: [
          generateSeries({
            metric: "db.connections",
            length: LAST_7D_POINTS,
            pattern: "random",
            min: 80,
            max: 120,
            queryIndex: 0,
            attributes: { instance: "primary" },
            rounded: true,
          }),
          generateSeries({
            metric: "db.connections",
            length: LAST_7D_POINTS,
            pattern: "random",
            min: 40,
            max: 50,
            queryIndex: 1,
            attributes: { instance: "replica-1" },
            rounded: true,
          }),
          generateSeries({
            metric: "db.connections",
            length: LAST_7D_POINTS,
            pattern: "random",
            min: 20,
            max: 30,
            queryIndex: 2,
            attributes: { instance: "replica-2" },
            rounded: true,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "db.connections", suggestedLabel: "DB Connections" },
          { name: "db.connections", suggestedLabel: "DB Connections" },
          { name: "db.connections", suggestedLabel: "DB Connections" },
        ]),
      },
    ],
  },
  {
    section: "Query Performance",
    cards: [
      {
        title: "Query Latency (p50 / p95 / p99)",
        badge: "ms",
        type: "line",
        series: [
          generateSeries({
            metric: "db.query.latency.p50",
            length: 60,
            pattern: "random",
            min: 2,
            max: 20,
            queryIndex: 0,
          }),
          generateSeries({
            metric: "db.query.latency.p95",
            length: 60,
            pattern: "random",
            min: 20,
            max: 120,
            queryIndex: 1,
          }),
          generateSeries({
            metric: "db.query.latency.p99",
            length: 60,
            pattern: "spike",
            min: 80,
            max: 800,
            queryIndex: 2,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "db.query.latency.p50",
            suggestedLabel: "p50",
            unitCode: "ms",
          },
          {
            name: "db.query.latency.p95",
            suggestedLabel: "p95",
            unitCode: "ms",
          },
          {
            name: "db.query.latency.p99",
            suggestedLabel: "p99",
            unitCode: "ms",
          },
        ]),
      },
      {
        title: "Queries per Second",
        badge: "qps",
        type: "line",
        fill: true,
        series: [
          generateSeries({
            metric: "db.qps",
            length: 60,
            min: 1000,
            max: 3000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "db.qps", suggestedLabel: "QPS" },
        ]),
      },
      {
        title: "Slow Queries",
        badge: "count",
        type: "bar",
        series: [
          generateSeries({
            metric: "db.slow_queries",
            length: LAST_24H_POINTS,
            pattern: "spike",
            min: 0,
            max: 40,
            queryIndex: 0,
            rounded: true,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "db.slow_queries", suggestedLabel: "Slow Queries" },
        ]),
        thresholds: [
          { value: 20, level: "warning" },
          { value: 35, level: "error" },
        ],
      },
      {
        title: "Query Types Breakdown",
        badge: "area",
        type: "area",
        series: [
          generateSeries({
            metric: "db.query.select",
            length: 60,
            pattern: "random",
            min: 100,
            max: 500,
            queryIndex: 0,
            rounded: true,
          }),
          generateSeries({
            metric: "db.query.insert",
            length: 60,
            pattern: "random",
            min: 20,
            max: 150,
            queryIndex: 1,
            rounded: true,
          }),
          generateSeries({
            metric: "db.query.update",
            length: 60,
            pattern: "random",
            min: 10,
            max: 80,
            queryIndex: 2,
            rounded: true,
          }),
          generateSeries({
            metric: "db.query.delete",
            length: 60,
            pattern: "spike",
            min: 0,
            max: 30,
            queryIndex: 3,
            rounded: true,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "db.query.select", suggestedLabel: "SELECT" },
          { name: "db.query.insert", suggestedLabel: "INSERT" },
          { name: "db.query.update", suggestedLabel: "UPDATE" },
          { name: "db.query.delete", suggestedLabel: "DELETE" },
        ]),
      },
    ],
  },
  {
    section: "Storage",
    cards: [
      {
        title: "Disk Usage",
        badge: "bytes",
        type: "line",
        fill: true,
        series: [
          generateSeries({
            metric: "db.storage.used",
            length: LAST_30D_POINTS,
            pattern: "linear",
            min: 50_000_000_000,
            max: 400_000_000_000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "db.storage.used",
            suggestedLabel: "Used",
            unitCode: "bytes",
          },
        ]),
        thresholds: [
          { from: 300_000_000_000, to: 380_000_000_000, level: "warning" },
          { from: 380_000_000_000, to: 500_000_000_000, level: "error" },
        ],
      },
      {
        title: "IOPS",
        badge: "count",
        type: "line",
        series: [
          generateSeries({
            metric: "db.iops.read",
            length: 60,
            pattern: "random",
            min: 500,
            max: 5000,
            queryIndex: 0,
          }),
          generateSeries({
            metric: "db.iops.write",
            length: 60,
            pattern: "random",
            min: 200,
            max: 2000,
            queryIndex: 1,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "db.iops.read", suggestedLabel: "Read IOPS" },
          { name: "db.iops.write", suggestedLabel: "Write IOPS" },
        ]),
      },
      {
        title: "Disk Throughput",
        badge: "bytes/s",
        type: "line",
        series: [
          generateSeries({
            metric: "db.disk.read_bytes",
            length: 60,
            pattern: "sine",
            min: 1_000_000,
            max: 200_000_000,
            queryIndex: 0,
          }),
          generateSeries({
            metric: "db.disk.write_bytes",
            length: 60,
            pattern: "random",
            min: 500_000,
            max: 100_000_000,
            queryIndex: 1,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "db.disk.read_bytes",
            suggestedLabel: "Read",
            unitCode: "bytes",
          },
          {
            name: "db.disk.write_bytes",
            suggestedLabel: "Write",
            unitCode: "bytes",
          },
        ]),
      },
      {
        title: "WAL / Binlog Size",
        badge: "bytes",
        type: "step",
        series: [
          generateSeries({
            metric: "db.wal.size",
            length: LAST_24H_POINTS,
            pattern: "random",
            min: 10_000_000,
            max: 2_000_000_000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "db.wal.size",
            suggestedLabel: "WAL Size",
            unitCode: "bytes",
          },
        ]),
      },
    ],
  },
  {
    section: "Replication",
    cards: [
      {
        title: "Replication Lag",
        badge: "ms",
        type: "line",
        series: [
          generateSeries({
            metric: "db.replication.lag",
            length: 60,
            pattern: "spike",
            min: 0,
            max: 5000,
            queryIndex: 0,
            attributes: { replica: "replica-1" },
          }),
          generateSeries({
            metric: "db.replication.lag",
            length: 60,
            pattern: "random",
            min: 0,
            max: 1000,
            queryIndex: 1,
            attributes: { replica: "replica-2" },
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "db.replication.lag",
            suggestedLabel: "DB Replication Lag",
            unitCode: "ms",
          },
          {
            name: "db.replication.lag",
            suggestedLabel: "DB Replication Lag",
            unitCode: "ms",
          },
        ]),
        thresholds: [
          { value: 2000, level: "warning" },
          { value: 4000, level: "error" },
        ],
      },
      {
        title: "Binlog Events per Second",
        badge: "count",
        type: "line",
        fill: true,
        series: [
          generateSeries({
            metric: "db.binlog.events_per_sec",
            length: 60,
            pattern: "sine",
            min: 100,
            max: 2000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "db.binlog.events_per_sec", suggestedLabel: "Events/s" },
        ]),
      },
    ],
  },
  {
    section: "Resource Utilization",
    cards: [
      {
        title: "CPU Usage by Node",
        badge: "percent",
        type: "step",
        series: [
          generateSeries({
            metric: "db.cpu.primary",
            length: LAST_24H_POINTS,
            pattern: "random",
            min: 10,
            max: 85,
            queryIndex: 0,
            attributes: { node: "primary" },
          }),
          generateSeries({
            metric: "db.cpu.replica1",
            length: LAST_24H_POINTS,
            pattern: "random",
            min: 5,
            max: 60,
            queryIndex: 1,
            attributes: { node: "replica-1" },
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "db.cpu.primary",
            suggestedLabel: "Primary",
            unitCode: "percent",
          },
          {
            name: "db.cpu.replica1",
            suggestedLabel: "Replica 1",
            unitCode: "percent",
          },
        ]),
        thresholds: [
          { from: 70, to: 85, level: "warning" },
          { from: 85, to: 100, level: "error" },
        ],
      },
      {
        title: "Memory Usage",
        badge: "bytes",
        type: "line",
        fill: true,
        series: [
          generateSeries({
            metric: "db.memory.used",
            length: LAST_24H_POINTS,
            pattern: "random",
            min: 4_000_000_000,
            max: 28_000_000_000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "db.memory.used", suggestedLabel: "Used", unitCode: "bytes" },
        ]),
      },
      {
        title: "Buffer Pool Hit Rate",
        badge: "percent",
        type: "line",
        series: [
          generateSeries({
            metric: "db.buffer.hit_rate",
            length: LAST_24H_POINTS,
            pattern: "random",
            min: 85,
            max: 100,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "db.buffer.hit_rate",
            suggestedLabel: "Hit Rate",
            unitCode: "percent",
          },
        ]),
        thresholds: [{ from: 0, to: 90, level: "warning" }],
      },
      {
        title: "Temp Tables Created",
        badge: "count",
        type: "bar",
        series: [
          generateSeries({
            metric: "db.tmp_tables",
            length: 60,
            pattern: "spike",
            min: 0,
            max: 300,
            queryIndex: 0,
            rounded: true,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "db.tmp_tables", suggestedLabel: "Temp Tables" },
        ]),
      },
    ],
  },
  {
    section: "Backups",
    cards: [
      {
        title: "Backup Duration",
        badge: "s",
        type: "bar",
        series: [
          generateSeries({
            metric: "db.backup.duration",
            length: LAST_30D_POINTS,
            pattern: "random",
            min: 60,
            max: 900,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "db.backup.duration",
            suggestedLabel: "Duration",
            unitCode: "s",
          },
        ]),
      },
      {
        title: "Backup Size",
        badge: "bytes",
        type: "line",
        series: [
          generateSeries({
            metric: "db.backup.size",
            length: LAST_30D_POINTS,
            pattern: "linear",
            min: 10_000_000_000,
            max: 80_000_000_000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "db.backup.size", suggestedLabel: "Size", unitCode: "bytes" },
        ]),
      },
    ],
  },
];
