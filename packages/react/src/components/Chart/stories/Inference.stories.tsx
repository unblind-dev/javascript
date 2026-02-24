import { Chart } from "..";
import {
  ChartCard,
  generateMetadataDict,
  generateSeries,
  timePresets,
} from "./utils";
import type { ComponentProps } from "react";

export default {
  title: "Examples/LLM Inference Dashboard",
};

type ChartProps = ComponentProps<typeof Chart>;

const lastHour = timePresets.lastHourByMinute();
const last24h = timePresets.last24Hours();
const last7d = timePresets.last7Days();
const last30d = timePresets.last30Days();

const MODELS = [
  { model: "gpt-4o", tier: "premium" },
  { model: "gpt-4o-mini", tier: "standard" },
  { model: "claude-sonnet", tier: "premium" },
];

const REGIONS = [
  { host: "inference-1", region: "us-east-1" },
  { host: "inference-243", region: "us-west-2" },
  { host: "inference-3", region: "eu-west-1" },
];

export const LLMDashboard = () => (
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
      LLM Inference Explorer
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

LLMDashboard.parameters = { layout: "fullscreen" };

const SECTIONS: {
  section: string;
  cards: ({ title: string; badge?: string } & ChartProps)[];
}[] = [
  {
    section: "Latency",
    cards: [
      {
        title: "Time to First Token (p50 / p95 / p99)",
        badge: "ms",
        type: "line",
        times: lastHour,
        series: [
          generateSeries({
            metric: "llm.ttft",
            length: 60,
            pattern: "random",
            min: 80,
            max: 300,
            amplitude: 50,
            queryIndex: 0,
            attributes: { percentile: "p50" },
          }),
          generateSeries({
            metric: "llm.ttft",
            length: 60,
            pattern: "random",
            min: 300,
            max: 900,
            amplitude: 50,
            queryIndex: 1,
            attributes: { percentile: "p95" },
          }),
          generateSeries({
            metric: "llm.ttft",
            length: 60,
            pattern: "spike",
            min: 600,
            max: 3000,
            amplitude: 50,
            queryIndex: 2,
            attributes: { percentile: "p99" },
          }),
        ],
        metadata: generateMetadataDict([
          { name: "llm.ttft", suggestedLabel: "TTFT", unitCode: "ms" },
        ]),
        thresholds: [
          { value: 1500, level: "warning" },
          { value: 2500, level: "error" },
        ],
      },
      {
        title: "End-to-End Request Latency by Model",
        badge: "ms",
        type: "line",
        times: lastHour,
        series: MODELS.map((attrs, i) =>
          generateSeries({
            metric: "llm.request.latency",
            length: 60,
            pattern: "random",
            min: 3500 + i * 200,
            max: 4000 + i * 500,
            amplitude: 50,
            queryIndex: i,
            attributes: attrs,
          }),
        ),
        metadata: generateMetadataDict([
          {
            name: "llm.request.latency",
            suggestedLabel: "Latency",
            unitCode: "ms",
          },
        ]),
      },
      {
        title: "Token Generation Speed",
        badge: "tokens/s",
        type: "line",
        fill: true,
        times: lastHour,
        series: MODELS.map((attrs, i) =>
          generateSeries({
            metric: "llm.tokens_per_sec",
            length: 60,
            min: 100 + i * 10 * Math.random(),
            max: 120 + i * 20 * Math.random(),
            amplitude: 10,
            queryIndex: i,
            attributes: attrs,
          }),
        ),
        metadata: generateMetadataDict([
          { name: "llm.tokens_per_sec", suggestedLabel: "Tokens/s" },
        ]),
      },
      {
        title: "Latency by Region",
        badge: "ms",
        type: "line",
        times: last24h,
        series: REGIONS.map((attrs, i) =>
          generateSeries({
            metric: "llm.request.latency",
            length: last24h.length,
            pattern: "random",
            min: 1500 + i * 100,
            max: 2000 + i * 300,
            amplitude: 50,
            queryIndex: i,
            attributes: attrs,
          }),
        ),
        metadata: generateMetadataDict([
          {
            name: "llm.request.latency",
            suggestedLabel: "Latency",
            unitCode: "ms",
          },
        ]),
      },
    ],
  },
  {
    section: "Throughput",
    cards: [
      {
        title: "Requests per Second",
        badge: "rps",
        type: "line",
        fill: true,
        times: lastHour,
        series: [
          generateSeries({
            metric: "llm.rps",
            length: 60,
            pattern: "sine",
            min: 50,
            max: 800,
            queryIndex: 0,
            rounded: true,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "llm.rps", suggestedLabel: "RPS" },
        ]),
      },
      {
        title: "Token Throughput — Prompt vs Completion",
        badge: "area",
        type: "area",
        times: lastHour,
        series: [
          generateSeries({
            metric: "llm.tokens.prompt",
            length: 60,
            min: 10_000,
            max: 80_000,
            queryIndex: 0,
            rounded: true,
          }),
          generateSeries({
            metric: "llm.tokens.completion",
            length: 60,
            min: 5_000,
            max: 40_000,
            queryIndex: 1,
            rounded: true,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "llm.tokens.prompt",
            suggestedLabel: "Prompt",
            unitCode: "short",
          },
          { name: "llm.tokens.completion", suggestedLabel: "Completion" },
        ]),
      },
      {
        title: "Requests by Model",
        badge: "bar",
        type: "bar",
        times: last24h,
        series: MODELS.map((attrs, i) =>
          generateSeries({
            metric: "llm.requests",
            length: last24h.length,
            pattern: "random",
            min: 500 + i * 200,
            max: 5000 + i * 1000,
            queryIndex: i,
            attributes: attrs,
            rounded: true,
          }),
        ),
        metadata: generateMetadataDict([
          {
            name: "llm.requests",
            suggestedLabel: "Requests",
            unitCode: "short",
          },
        ]),
      },
      {
        title: "Queue Depth",
        badge: "count",
        type: "line",
        times: lastHour,
        series: REGIONS.map((attrs, i) =>
          generateSeries({
            metric: "llm.queue.depth",
            length: 60,
            pattern: "spike",
            min: 0,
            max: 50 + i * 20,
            queryIndex: i,
            attributes: attrs,
            rounded: true,
          }),
        ),
        metadata: generateMetadataDict([
          { name: "llm.queue.depth", suggestedLabel: "Queue Depth" },
        ]),
        thresholds: [
          { value: 30, level: "warning" },
          { value: 60, level: "error" },
        ],
      },
    ],
  },
  {
    section: "Tokens",
    cards: [
      {
        title: "Total Tokens per Day",
        badge: "count",
        type: "bar",
        times: last30d,
        series: [
          generateSeries({
            metric: "llm.tokens.total",
            length: last30d.length,
            pattern: "linear",
            min: 5_000_000,
            max: 80_000_000,
            queryIndex: 0,
            rounded: true,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "llm.tokens.total",
            suggestedLabel: "Tokens",
            unitCode: "short",
          },
        ]),
      },
      {
        title: "Token Usage by Model — 30 days",
        badge: "area",
        type: "area",
        times: last30d,
        series: MODELS.map((attrs, i) =>
          generateSeries({
            metric: "llm.tokens.total",
            length: last30d.length,
            pattern: "linear",
            min: 1_000_000 + i * 500_000,
            max: 20_000_000 + i * 5_000_000,
            queryIndex: i,
            attributes: attrs,
            rounded: true,
          }),
        ),
        metadata: generateMetadataDict([
          {
            name: "llm.tokens.total",
            suggestedLabel: "Tokens",
            unitCode: "short",
          },
        ]),
      },
      {
        title: "Context Length Distribution",
        badge: "count",
        type: "bar",
        times: last24h,
        series: [
          generateSeries({
            metric: "llm.context.short",
            length: last24h.length,
            pattern: "random",
            min: 500,
            max: 3000,
            queryIndex: 0,
            rounded: true,
            attributes: { bucket: "0-1k" },
          }),
          generateSeries({
            metric: "llm.context.medium",
            length: last24h.length,
            pattern: "random",
            min: 200,
            max: 1500,
            queryIndex: 1,
            rounded: true,
            attributes: { bucket: "1k-8k" },
          }),
          generateSeries({
            metric: "llm.context.long",
            length: last24h.length,
            pattern: "spike",
            min: 0,
            max: 400,
            queryIndex: 2,
            rounded: true,
            attributes: { bucket: "8k+" },
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "llm.context.short",
            suggestedLabel: "Short",
            unitCode: "short",
          },
          {
            name: "llm.context.medium",
            suggestedLabel: "Medium",
            unitCode: "short",
          },
          {
            name: "llm.context.long",
            suggestedLabel: "Long",
            unitCode: "short",
          },
        ]),
      },
      {
        title: "Prompt Cache Hit Rate",
        badge: "percent",
        type: "line",
        times: last24h,
        series: [
          generateSeries({
            metric: "llm.cache.hit_rate",
            length: last24h.length,
            pattern: "random",
            min: 30,
            max: 55,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "llm.cache.hit_rate",
            suggestedLabel: "Hit Rate",
            unitCode: "percent",
          },
        ]),
      },
    ],
  },
  {
    section: "Errors & Reliability",
    cards: [
      {
        title: "Error Rate by Type",
        badge: "area",
        type: "area",
        times: last24h,
        series: [
          generateSeries({
            metric: "llm.errors.timeout",
            length: last24h.length,
            pattern: "spike",
            min: 0,
            max: 30,
            queryIndex: 0,
            rounded: true,
          }),
          generateSeries({
            metric: "llm.errors.rate_limit",
            length: last24h.length,
            pattern: "spike",
            min: 0,
            max: 50,
            queryIndex: 1,
            rounded: true,
          }),
          generateSeries({
            metric: "llm.errors.context_length",
            length: last24h.length,
            pattern: "random",
            min: 0,
            max: 15,
            queryIndex: 2,
            rounded: true,
          }),
          generateSeries({
            metric: "llm.errors.content_filter",
            length: last24h.length,
            pattern: "random",
            min: 0,
            max: 10,
            queryIndex: 3,
            rounded: true,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "llm.errors.timeout", suggestedLabel: "Timeout" },
          { name: "llm.errors.rate_limit", suggestedLabel: "Rate Limit" },
          {
            name: "llm.errors.context_length",
            suggestedLabel: "Context Length",
          },
          {
            name: "llm.errors.content_filter",
            suggestedLabel: "Content Filter",
          },
        ]),
      },
      {
        title: "Success Rate by Region",
        badge: "percent",
        type: "line",
        times: last24h,
        series: REGIONS.map((attrs, i) =>
          generateSeries({
            metric: "llm.success_rate",
            length: last24h.length,
            pattern: "random",
            min: 96,
            max: 99.9,
            queryIndex: i,
            attributes: attrs,
          }),
        ),
        metadata: generateMetadataDict([
          {
            name: "llm.success_rate",
            suggestedLabel: "Success Rate",
            unitCode: "percent",
          },
        ]),
        thresholds: [
          { from: 0, to: 97, level: "warning" },
          { from: 0, to: 95, level: "error" },
        ],
      },
      {
        title: "Retries per Request",
        badge: "count",
        type: "bar",
        times: last24h,
        series: [
          generateSeries({
            metric: "llm.retries",
            length: last24h.length,
            pattern: "spike",
            min: 0,
            max: 5,
            queryIndex: 0,
            rounded: true,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "llm.retries", suggestedLabel: "Retries" },
        ]),
      },
      {
        title: "Content Filter Triggers — 7 days",
        badge: "count",
        type: "bar",
        times: last7d,
        series: [
          generateSeries({
            metric: "llm.filter.input",
            length: last7d.length,
            pattern: "random",
            min: 0,
            max: 200,
            queryIndex: 0,
            rounded: true,
          }),
          generateSeries({
            metric: "llm.filter.output",
            length: last7d.length,
            pattern: "random",
            min: 0,
            max: 80,
            queryIndex: 1,
            rounded: true,
          }),
        ],
        metadata: generateMetadataDict([
          { name: "llm.filter.input", suggestedLabel: "Input" },
          { name: "llm.filter.output", suggestedLabel: "Output" },
        ]),
      },
    ],
  },
  {
    section: "Cost",
    cards: [
      {
        title: "Daily Spend",
        badge: "USD",
        type: "bar",
        times: last30d,
        series: [
          generateSeries({
            metric: "llm.cost.total",
            length: last30d.length,
            pattern: "linear",
            min: 200,
            max: 4000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "llm.cost.total",
            suggestedLabel: "Spend",
            unitCode: "currencyUSD",
          },
        ]),
      },
      {
        title: "Cost by Model",
        badge: "area",
        type: "area",
        times: last30d,
        series: MODELS.map((attrs, i) =>
          generateSeries({
            metric: "llm.cost",
            length: last30d.length,
            pattern: "linear",
            min: 50 + i * 100,
            max: 1000 + i * 500,
            queryIndex: i,
            attributes: attrs,
          }),
        ),
        metadata: generateMetadataDict([
          { name: "llm.cost", suggestedLabel: "Cost", unitCode: "currencyUSD" },
        ]),
      },
      {
        title: "Cost per 1k Tokens",
        badge: "USD",
        type: "step",
        times: last30d,
        max: 0.1,
        series: MODELS.map((attrs, i) =>
          generateSeries({
            metric: "llm.cost_per_1k",
            length: last30d.length,
            pattern: "random",
            min: 0.001 + i * 0.003,
            max: 0.01 + i * 0.005,
            queryIndex: i,
            attributes: attrs,
          }),
        ),
        metadata: generateMetadataDict([
          {
            name: "llm.cost_per_1k",
            suggestedLabel: "Cost/1k",
            unitCode: "currencyUSD",
          },
        ]),
      },
      {
        title: "Cumulative Spend — 30 days",
        badge: "USD",
        type: "line",
        fill: true,
        times: last30d,
        series: [
          generateSeries({
            metric: "llm.cost.cumulative",
            length: last30d.length,
            pattern: "exponential",
            min: 200,
            max: 45000,
            queryIndex: 0,
          }),
        ],
        metadata: generateMetadataDict([
          {
            name: "llm.cost.cumulative",
            suggestedLabel: "Cumulative Spend",
            unitCode: "currencyUSD",
          },
        ]),
      },
    ],
  },
  {
    section: "Infrastructure",
    cards: [
      {
        title: "GPU Utilization",
        badge: "percent",
        type: "line",
        times: lastHour,
        series: REGIONS.map((attrs, i) =>
          generateSeries({
            metric: "llm.gpu.utilization",
            length: 60,
            min: 40 + i * 10,
            max: 95,
            queryIndex: i,
            attributes: attrs,
          }),
        ),
        metadata: generateMetadataDict([
          {
            name: "llm.gpu.utilization",
            suggestedLabel: "GPU Util",
            unitCode: "percent",
          },
        ]),
        thresholds: [
          { from: 85, to: 95, level: "warning" },
          { from: 95, to: 100, level: "error" },
        ],
      },
      {
        title: "GPU Memory Usage",
        badge: "bytes",
        type: "line",
        fill: true,
        times: lastHour,
        series: REGIONS.map((attrs, i) =>
          generateSeries({
            metric: "llm.gpu.memory",
            length: 60,
            pattern: "random",
            min: 20_000_000_000,
            max: 75_000_000_000,
            queryIndex: i,
            attributes: attrs,
          }),
        ),
        metadata: generateMetadataDict([
          {
            name: "llm.gpu.memory",
            suggestedLabel: "GPU Memory",
            unitCode: "bytes",
          },
        ]),
      },
      {
        title: "Active Model Replicas",
        badge: "count",
        type: "step",
        times: last24h,
        series: MODELS.map((attrs, i) =>
          generateSeries({
            metric: "llm.replicas",
            length: last24h.length,
            pattern: "random",
            min: 1 + i,
            max: 8 + i * 2,
            queryIndex: i,
            attributes: attrs,
            rounded: true,
          }),
        ),
        metadata: generateMetadataDict([
          { name: "llm.replicas", suggestedLabel: "Replicas" },
        ]),
      },
      {
        title: "Cold Start Duration",
        badge: "ms",
        type: "bar",
        times: last7d,
        series: MODELS.map((attrs, i) =>
          generateSeries({
            metric: "llm.cold_start",
            length: last7d.length,
            pattern: "random",
            min: 2000 + i * 500,
            max: 15000 + i * 2000,
            queryIndex: i,
            attributes: attrs,
          }),
        ),
        metadata: generateMetadataDict([
          {
            name: "llm.cold_start",
            suggestedLabel: "Cold Start",
            unitCode: "ms",
          },
        ]),
      },
    ],
  },
];
