import { Chart } from "..";
import {
  generateMetadataDict,
  generateSeries,
  timePresets,
  ChartCard,
} from "./utils";
import type { ComponentProps } from "react";

export default {
  title: "Examples/DB Dashboard",
};

type ChartProps = ComponentProps<typeof Chart>;

const lastHour = timePresets.lastHourByMinute();
const last24h = timePresets.last24Hours();
const last7d = timePresets.last7Days();
const last30d = timePresets.last30Days();

export const DBDashboard = () => (
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
          {cards.map(({ title, badge, ...chartProps }) => (
            <ChartCard
              key={title}
              title={title}
              badge={badge}
              {...chartProps}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

DBDashboard.parameters = { layout: "fullscreen" };

const SECTIONS: {
  section: string;
  cards: ({ title: string; badge?: string } & ChartProps)[];
}[] = [
  {
    section: "Connections",
    cards: [
      {
        title: "Active Connections",
        badge: "count",
        type: "line",
        times: lastHour,
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
        times: last24h,
        series: [
          generateSeries({
            metric: "db.pool.utilization",
            length: last24h.length,
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
        times: last24h,
        series: [
          generateSeries({
            metric: "db.connections.errors",
            length: last24h.length,
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
        times: last7d,
        series: [
          generateSeries({
            metric: "db.connections",
            length: last7d.length,
            pattern: "random",
            min: 80,
            max: 120,
            queryIndex: 0,
            attributes: { instance: "primary" },
            rounded: true,
          }),
          generateSeries({
            metric: "db.connections",
            length: last7d.length,
            pattern: "random",
            min: 40,
            max: 50,
            queryIndex: 1,
            attributes: { instance: "replica-1" },
            rounded: true,
          }),
          generateSeries({
            metric: "db.connections",
            length: last7d.length,
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
        times: lastHour,
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
        times: lastHour,
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
        times: last24h,
        series: [
          generateSeries({
            metric: "db.slow_queries",
            length: last24h.length,
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
        times: lastHour,
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
        times: last30d,
        series: [
          generateSeries({
            metric: "db.storage.used",
            length: last30d.length,
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
        times: lastHour,
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
        times: lastHour,
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
        times: last24h,
        series: [
          generateSeries({
            metric: "db.wal.size",
            length: last24h.length,
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
        times: lastHour,
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
        times: lastHour,
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
        times: last24h,
        series: [
          generateSeries({
            metric: "db.cpu.primary",
            length: last24h.length,
            pattern: "random",
            min: 10,
            max: 85,
            queryIndex: 0,
            attributes: { node: "primary" },
          }),
          generateSeries({
            metric: "db.cpu.replica1",
            length: last24h.length,
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
        times: last24h,
        series: [
          generateSeries({
            metric: "db.memory.used",
            length: last24h.length,
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
        times: last24h,
        series: [
          generateSeries({
            metric: "db.buffer.hit_rate",
            length: last24h.length,
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
        times: lastHour,
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
        times: last30d,
        series: [
          generateSeries({
            metric: "db.backup.duration",
            length: last30d.length,
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
        times: last30d,
        series: [
          generateSeries({
            metric: "db.backup.size",
            length: last30d.length,
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
