import { TimeRange } from "@/components/TimeRange";
import { Chart } from "..";
import { ChartCard, generateMetadataDict, generateSeries } from "./utils";
import { useMemo, type ComponentProps } from "react";
import { useScope } from "@/providers";
import { deduceTimestamp } from "@/hooks/utils";

export default {
  title: "Examples/Inference",
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

export const LLMDashboard = () => {
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
        LLM Inference Explorer
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

LLMDashboard.parameters = { layout: "fullscreen" };

const SECTIONS: {
  section: string;
  cards: DashboardCard[];
}[] = [
  {
    section: "Latency",
    cards: [
      {
        title: "Time to First Token (p50 / p95 / p99)",
        badge: "ms",
        type: "line",
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
        series: REGIONS.map((attrs, i) =>
          generateSeries({
            metric: "llm.request.latency",
            length: LAST_24H_POINTS,
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
        series: MODELS.map((attrs, i) =>
          generateSeries({
            metric: "llm.requests",
            length: LAST_24H_POINTS,
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
        series: [
          generateSeries({
            metric: "llm.tokens.total",
            length: LAST_30D_POINTS,
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
        series: MODELS.map((attrs, i) =>
          generateSeries({
            metric: "llm.tokens.total",
            length: LAST_30D_POINTS,
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
        series: [
          generateSeries({
            metric: "llm.context.short",
            length: LAST_24H_POINTS,
            pattern: "random",
            min: 500,
            max: 3000,
            queryIndex: 0,
            rounded: true,
            attributes: { bucket: "0-1k" },
          }),
          generateSeries({
            metric: "llm.context.medium",
            length: LAST_24H_POINTS,
            pattern: "random",
            min: 200,
            max: 1500,
            queryIndex: 1,
            rounded: true,
            attributes: { bucket: "1k-8k" },
          }),
          generateSeries({
            metric: "llm.context.long",
            length: LAST_24H_POINTS,
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
        series: [
          generateSeries({
            metric: "llm.cache.hit_rate",
            length: LAST_24H_POINTS,
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
        series: [
          generateSeries({
            metric: "llm.errors.timeout",
            length: LAST_24H_POINTS,
            pattern: "spike",
            min: 0,
            max: 30,
            queryIndex: 0,
            rounded: true,
          }),
          generateSeries({
            metric: "llm.errors.rate_limit",
            length: LAST_24H_POINTS,
            pattern: "spike",
            min: 0,
            max: 50,
            queryIndex: 1,
            rounded: true,
          }),
          generateSeries({
            metric: "llm.errors.context_length",
            length: LAST_24H_POINTS,
            pattern: "random",
            min: 0,
            max: 15,
            queryIndex: 2,
            rounded: true,
          }),
          generateSeries({
            metric: "llm.errors.content_filter",
            length: LAST_24H_POINTS,
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
        series: REGIONS.map((attrs, i) =>
          generateSeries({
            metric: "llm.success_rate",
            length: LAST_24H_POINTS,
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
        series: [
          generateSeries({
            metric: "llm.retries",
            length: LAST_24H_POINTS,
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
        series: [
          generateSeries({
            metric: "llm.filter.input",
            length: LAST_7D_POINTS,
            pattern: "random",
            min: 0,
            max: 200,
            queryIndex: 0,
            rounded: true,
          }),
          generateSeries({
            metric: "llm.filter.output",
            length: LAST_7D_POINTS,
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
        series: [
          generateSeries({
            metric: "llm.cost.total",
            length: LAST_30D_POINTS,
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
        series: MODELS.map((attrs, i) =>
          generateSeries({
            metric: "llm.cost",
            length: LAST_30D_POINTS,
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
        max: 0.1,
        series: MODELS.map((attrs, i) =>
          generateSeries({
            metric: "llm.cost_per_1k",
            length: LAST_30D_POINTS,
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
        title: "Spend - Returns — 30 days",
        badge: "USD",
        type: "line",
        fill: true,
        series: [
          generateSeries({
            metric: "llm.cost.cumulative",
            length: LAST_30D_POINTS,
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
        series: MODELS.map((attrs, i) =>
          generateSeries({
            metric: "llm.replicas",
            length: LAST_24H_POINTS,
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
        series: MODELS.map((attrs, i) =>
          generateSeries({
            metric: "llm.cold_start",
            length: LAST_7D_POINTS,
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
