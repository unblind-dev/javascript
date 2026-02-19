import type { Meta, StoryObj } from "@storybook/react-vite";
import { Chart } from "..";
import {
  generateTimes,
  generateSeries,
  generateMultipleSeries,
  timePresets,
  generateMetadataDict,
  unitPresets,
  generateChartData,
} from "./utils";

const meta: Meta<typeof Chart> = {
  title: "Components/Chart",
  component: Chart,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Chart>;

const lastDayTimes = generateTimes({
  duration: 24,
  durationUnit: "hour",
  interval: 5,
  intervalUnit: "minute",
});

export const Simple: Story = {
  args: {
    type: "line",
    times: lastDayTimes,
    series: [
      generateSeries({
        metric: "container.cpu.usage",
        length: lastDayTimes.length,
        pattern: "random",
        min: 10,
        max: 20,
        baseValue: 15,
        queryIndex: 0,
      }),
    ],
    metadata: generateMetadataDict([
      {
        name: "container.cpu.usage",
        description: "CPU usage percentage",
        suggestedLabel: "Usage",
        unitCode: "percent",
        type: "gauge",
      },
    ]),
  },
};

export const MultipleAttributes: Story = {
  args: {
    type: "line",
    times: timePresets.last7Days(),
    series: generateMultipleSeries({
      count: 3,
      metric: "memory.usage",
      length: timePresets.last7Days().length,
      pattern: "random",
      min: 30,
      max: 40,
      attributeSets: [
        { host: "server-1", region: "us-east-1" },
        { host: "server-2", region: "us-west-2" },
        { host: "server-3", region: "eu-west-1" },
      ],
    }),
    metadata: generateMetadataDict([
      {
        name: "memory.usage",
        description: "Memory usage percentage",
        suggestedLabel: "Usage",
        ...unitPresets.percent,
        type: "gauge",
      },
    ]),
  },
};

export const MultipleMetrics: Story = {
  args: {
    type: "line",
    fill: true,
    times: timePresets.last24Hours(),
    series: [
      generateSeries({
        metric: "memory.usage",
        length: timePresets.last24Hours().length,
        pattern: "random",
        min: 10,
        max: 15,
        queryIndex: 1,
        attributes: {
          "service.name": "purchases-service",
          region: "us-east-2",
        },
      }),
      generateSeries({
        metric: "cpu.usage",
        length: timePresets.last24Hours().length,
        pattern: "random",
        min: 40,
        max: 50,
        queryIndex: 0,
        attributes: {
          "service.name": "purchases-service",
          region: "us-east-2",
        },
      }),
      generateSeries({
        metric: "disk.usage",
        length: timePresets.last24Hours().length,
        pattern: "random",
        min: 30,
        max: 35,
        queryIndex: 2,
        attributes: {
          "service.name": "purchases-service",
          region: "us-east-2",
        },
      }),
    ],
    metadata: generateMetadataDict([
      {
        name: "cpu.usage",
        suggestedLabel: "CPU",
        ...unitPresets.percent,
        type: "gauge",
      },
      {
        name: "memory.usage",
        suggestedLabel: "Memory",
        ...unitPresets.percent,
        type: "gauge",
      },
      {
        name: "disk.usage",
        suggestedLabel: "Disk",
        ...unitPresets.percent,
        type: "gauge",
      },
    ]),
  },
};

export const Stacking: Story = {
  args: {
    type: "line",
    times: timePresets.lastHourByMinute(),
    unit: "percent",
    series: [
      generateSeries({
        metric: "server.error",
        length: 60,
        pattern: "spike",
        min: 20,
        max: 35,
        queryIndex: 0,
      }),
      generateSeries({
        metric: "server.info",
        length: 60,
        pattern: "random",
        min: 20,
        max: 30,
        queryIndex: 0,
      }),
      generateSeries({
        metric: "server.warning",
        length: 60,
        pattern: "random",
        min: 20,
        max: 30,
        queryIndex: 0,
      }),
    ],
    metadata: generateMetadataDict([
      {
        name: "server.error",
        description: "Error rate per minute",
        suggestedLabel: "Error",
      },
      {
        name: "server.warning",
        description: "Warning rate per minute",
        suggestedLabel: "Warning",
      },
      {
        name: "server.info",
        description: "Info rate per minute",
        suggestedLabel: "Info",
      },
    ]),
  },
};

export const AreaStacking: Story = {
  args: {
    type: "area",
    relativeTimeAxis: true,
    times: timePresets.lastHourByMinute(),
    series: [
      generateSeries({
        metric: "server.request.error",
        length: 60,
        pattern: "spike",
        min: 0,
        max: 50,
        queryIndex: 0,
      }),
      generateSeries({
        metric: "server.request.warning",
        length: 60,
        pattern: "random",
        min: 0,
        max: 30,
        queryIndex: 0,
      }),
      generateSeries({
        metric: "server.request.info",
        length: 60,
        pattern: "random",
        min: 0,
        max: 80,
        queryIndex: 0,
      }),
    ],
    metadata: generateMetadataDict([
      {
        name: "server.request.error",
        description: "Error rate per minute",
        suggestedLabel: "Error",
      },
      {
        name: "server.request.warning",
        description: "Warning rate per minute",
        suggestedLabel: "Warning",
      },
      {
        name: "server.request.info",
        description: "Info rate per minute",
        suggestedLabel: "Info",
      },
    ]),
  },
};

export const MinimalStatic: Story = {
  args: {
    type: "bar",
    hideAxis: true,
    hideCursor: true,
    tooltip: {
      hide: true,
    },
    times: timePresets.lastHourByMinute(),
    series: [
      generateSeries({
        metric: "server.request.error",
        length: 60,
        pattern: "spike",
        min: 0,
        max: 50,
        queryIndex: 0,
      }),
      generateSeries({
        metric: "server.request.warning",
        length: 60,
        pattern: "random",
        min: 0,
        max: 30,
        queryIndex: 0,
      }),
      generateSeries({
        metric: "server.request.info",
        length: 60,
        pattern: "random",
        min: 0,
        max: 80,
        queryIndex: 0,
      }),
    ],
    metadata: generateMetadataDict([
      {
        name: "server.request.error",
        description: "Error rate per minute",
        suggestedLabel: "Error",
      },
      {
        name: "server.request.warning",
        description: "Warning rate per minute",
        suggestedLabel: "Warning Rate",
      },
      {
        name: "server.request.info",
        description: "Info rate per minute",
        suggestedLabel: "Info Rate",
      },
    ]),
  },
};

export const SpikeScale: Story = {
  args: {
    type: "bar",
    times: timePresets.lastHourByMinute(),
    series: [
      generateSeries({
        metric: "server.request.error",
        length: 60,
        pattern: "spike",
        min: 0,
        max: 100,
        queryIndex: 0,
      }),
    ],
    metadata: generateMetadataDict([
      {
        name: "server.request.error",
        description: "Error rate per minute",
        suggestedLabel: "Error",
      },
    ]),
  },
};

export const MonthUsage: Story = {
  args: {
    type: "bar",
    times: timePresets.last30Days(),
    colors: ["#1D3D14", "#7D9984"],
    series: [
      generateSeries({
        metric: "Logs",
        length: timePresets.last30Days().length,
        pattern: "spike",
        min: 0,
        max: 2_000_000,
        queryIndex: 0,
      }),
      generateSeries({
        metric: "Metrics",
        length: timePresets.last30Days().length,
        pattern: "random",
        min: 0,
        max: 3_000_000,
        queryIndex: 0,
      }),
    ],
    metadata: {
      Metrics: {
        unit: {
          code: "short",
        },
        type: "sum",
        name: "Metrics",
        description: "Total telemetry units used",
      },
      Logs: {
        unit: {
          code: "short",
        },
        type: "sum",
        name: "Logs",
        description: "Total telemetry units used",
      },
    },
  },
};

export const StepPattern: Story = {
  args: {
    type: "step",
    times: lastDayTimes,
    series: [
      generateSeries({
        metric: "cpu.usage",
        length: lastDayTimes.length,
        pattern: "random",
        min: 10,
        max: 20,
        baseValue: 15,
        queryIndex: 0,
      }),
    ],
    metadata: generateMetadataDict([
      {
        name: "cpu.usage",
        description: "CPU usage percentage",
        suggestedLabel: "Usage",
        unitCode: "percent",
        type: "gauge",
      },
    ]),
  },
};

export const NetworkUsage: Story = {
  args: (() => {
    const data = generateChartData({
      timeOptions: {
        duration: 24,
        durationUnit: "hour",
        interval: 1,
        intervalUnit: "hour",
      },
      seriesConfigs: [
        {
          metric: "container.network.io",
          pattern: "linear",
          min: 100,
          max: 100000000,
          baseValue: 500,
          amplitude: 10000000,
        },
      ],
      metadataConfigs: [
        {
          name: "container.network.io",
          suggestedLabel: "IO",
          description: "Number of requests per second",
          unitCode: "by",
          type: "gauge",
        },
      ],
    });

    return {
      type: "line" as const,
      ...data,
    };
  })(),
};

export const RangeThresholds: Story = {
  args: (() => {
    const data = generateChartData({
      timeOptions: {
        duration: 24,
        durationUnit: "hour",
        interval: 15,
        intervalUnit: "minute",
      },
      seriesConfigs: [
        {
          metric: "container.memory.usage",
          pattern: "spike",
          min: 0,
          max: 100,
          baseValue: 20,
          amplitude: 50,
        },
      ],
      metadataConfigs: [
        {
          name: "container.memory.usage",
          suggestedLabel: "Usage",
          description: "Container Memory usage",
          unitCode: "percent",
          type: "gauge",
        },
      ],
    });

    return {
      type: "bar",
      ...data,
      thresholds: [
        {
          from: 75,
          to: 85,
          level: "warning",
        },
        {
          from: 85,
          to: 100,
          level: "error",
        },
      ],
    };
  })(),
};

export const LineThresholds: Story = {
  args: (() => {
    const data = generateChartData({
      timeOptions: {
        duration: 24,
        durationUnit: "hour",
        interval: 1,
        intervalUnit: "hour",
      },
      seriesConfigs: [
        {
          metric: "container.filesystem.usage",
          pattern: "linear",
          min: 100,
          max: 100000000000,
          baseValue: 500,
          amplitude: 300,
        },
      ],
      metadataConfigs: [
        {
          name: "container.filesystem.usage",
          suggestedLabel: "Usage",
          description: "Filesystem space usage",
          unitCode: "by",
          type: "gauge",
        },
      ],
    });

    return {
      type: "step",
      ...data,
      thresholds: [
        {
          value: 150000000000,
          level: "warning",
        },
        {
          value: 200000000000,
          level: "error",
        },
        {
          value: 50000000000,
          level: "info",
        },
        {
          value: 100000000000,
          level: "ok",
        },
      ],
      min: 0,
      max: 300000000000,
    };
  })(),
};

export const CustomUnits: Story = {
  args: (() => {
    const data = generateChartData({
      timeOptions: {
        duration: 24,
        durationUnit: "hour",
        interval: 1,
        intervalUnit: "hour",
      },
      seriesConfigs: [
        {
          metric: "server.requests",
          pattern: "sine",
          min: 100,
          max: 1000,
          baseValue: 500,
          amplitude: 300,
          attributes: { endpoint: "/api/users" },
        },
        {
          metric: "server.requests",
          pattern: "random",
          min: 50,
          max: 800,
          attributes: { endpoint: "/api/posts" },
        },
      ],
      metadataConfigs: [
        {
          name: "server.requests",
          description: "Number of requests per second",
          suggestedLabel: "Requests",
          unitCode: "req/s",
          type: "gauge",
        },
      ],
    });

    return {
      type: "line" as const,
      ...data,
    };
  })(),
};

export const ExponentialGrowth: Story = {
  args: {
    type: "line",
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
      {
        name: "user.count",
        description: "Total user count",
        suggestedLabel: "Active Users",
        type: "gauge",
      },
    ]),
  },
};

export const HalfPeriodData: Story = {
  args: {
    type: "line",
    times: lastDayTimes,
    series: [
      generateSeries({
        metric: "cpu.usage",
        length: lastDayTimes.length / 2,
        pattern: "random",
        min: 10,
        max: 20,
        baseValue: 15,
        queryIndex: 0,
      }),
    ],
    metadata: generateMetadataDict([
      {
        name: "cpu.usage",
        description: "CPU usage percentage",
        suggestedLabel: "Usage",
        unitCode: "percent",
        type: "gauge",
      },
    ]),
  },
};

export const OnlyZero: Story = {
  args: {
    type: "line",
    times: lastDayTimes,
    series: [
      generateSeries({
        metric: "cpu.usage",
        length: lastDayTimes.length,
        pattern: "random",
        min: 0,
        max: 0,
        baseValue: 0,
        queryIndex: 0,
      }),
    ],
    metadata: generateMetadataDict([
      {
        name: "cpu.usage",
        description: "CPU usage percentage",
        suggestedLabel: "Usage",
        unitCode: "percent",
        type: "gauge",
      },
    ]),
  },
};

export const CustomTimeRange: Story = {
  args: {
    type: "spline",
    fill: true,
    times: generateTimes({
      duration: 3,
      durationUnit: "month",
      interval: 1,
      intervalUnit: "week",
    }),
    series: [
      generateSeries({
        metric: "revenue",
        length: 14,
        pattern: "exponential",
        min: 10000,
        max: 50000,
        queryIndex: 0,
      }),
    ],
    metadata: generateMetadataDict([
      {
        name: "revenue",
        description: "Weekly revenue",
        suggestedLabel: "Revenue",
        unitCode: "$",
        type: "gauge",
      },
    ]),
  },
};

export const RelativeTime: Story = {
  args: {
    type: "spline",
    fill: true,
    relativeTimeAxis: true,
    times: generateTimes({
      duration: 3,
      durationUnit: "month",
      interval: 1,
      intervalUnit: "week",
    }),
    series: [
      generateSeries({
        metric: "revenue",
        length: 14,
        pattern: "exponential",
        min: 10000,
        max: 50000,
        queryIndex: 0,
      }),
    ],
    metadata: generateMetadataDict([
      {
        name: "revenue",
        description: "Weekly revenue",
        suggestedLabel: "Revenue",
        unitCode: "$",
        type: "gauge",
      },
    ]),
  },
};
