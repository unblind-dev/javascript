import { Chart } from "..";
import {
  generateMetadataDict,
  generateSeries,
  timePresets,
  generateTimes,
  ChartCard,
} from "./utils";
import type { ComponentProps } from "react";

export default {
  title: "Examples/Dashboard",
};

type ChartProps = ComponentProps<typeof Chart>;

const lastHour = timePresets.lastHourByMinute();
const last24h = timePresets.last24Hours();
const last7d = timePresets.last7Days();
const last30d = timePresets.last30Days();

export const Dashboard = () => (
  <div style={{ padding: "24px", minHeight: "100vh", width: "1800px" }}>
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

Dashboard.parameters = { layout: "fullscreen" };

const SECTIONS: {
  section: string;
  cards: ({ title: string; badge?: string } & ChartProps)[];
}[] = [
  {
    section: "Percentages",
    cards: [
      {
        title: "CPU Usage - normal range",
        badge: "percent",
        type: "bar",
        times: lastHour,
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
        times: lastHour,
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
        times: lastHour,
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
        times: last24h,
        series: [
          generateSeries({
            metric: "disk.usage",
            length: last24h.length,
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
        times: last24h,
        series: [
          generateSeries({
            metric: "net.io",
            length: last24h.length,
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
        times: last24h,
        series: [
          generateSeries({
            metric: "fs.usage",
            length: last24h.length,
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
        times: lastHour,
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
        times: lastHour,
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
        times: lastHour,
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
        times: lastHour,
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
        times: last7d,
        series: [
          generateSeries({
            metric: "job.duration",
            length: last7d.length,
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
        times: last7d,
        series: [
          generateSeries({
            metric: "uptime",
            length: last7d.length,
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
        times: lastHour,
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
        times: last24h,
        series: [
          generateSeries({
            metric: "cpu.usage",
            length: last24h.length,
            pattern: "random",
            min: 10,
            max: 60,
            queryIndex: 0,
            attributes: { service: "api" },
          }),
          generateSeries({
            metric: "cpu.usage",
            length: last24h.length,
            pattern: "sine",
            min: 30,
            max: 80,
            queryIndex: 0,
            attributes: { service: "worker" },
          }),
          generateSeries({
            metric: "cpu.usage",
            length: last24h.length,
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
        times: last30d,
        colors: ["#1D3D14", "#7D9984"],
        series: [
          generateSeries({
            metric: "Logs",
            length: last30d.length,
            pattern: "spike",
            min: 0,
            max: 2_000_000,
            queryIndex: 0,
          }),
          generateSeries({
            metric: "Metrics",
            length: last30d.length,
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
        times: generateTimes({
          duration: 30,
          durationUnit: "day",
          interval: 1,
          intervalUnit: "day",
        }),
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
        times: last24h,
        series: [
          generateSeries({
            metric: "mem.usage",
            length: last24h.length,
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
        times: last24h,
        series: [
          generateSeries({
            metric: "fs.usage",
            length: last24h.length,
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
        times: lastHour,
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
        times: lastHour,
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
        times: lastHour,
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
        times: lastHour,
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
