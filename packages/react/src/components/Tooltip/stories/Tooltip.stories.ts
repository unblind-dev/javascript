import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tooltip } from "..";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const SimpleMetric: Story = {
  args: {
    timestamp: new Date().getTime() / 1000,
    tooltipSerieList: [
      {
        metric: {
          name: "pod.network.latency",
          description: "Network Latency",
          suggestedLabel: "Latency",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {},
      },
    ],
    timeZone: undefined,
    spansMultipleDays: false,
  },
};

export const MultipleMetrics: Story = {
  args: {
    timestamp: new Date().getTime() / 1000,
    tooltipSerieList: [
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {},
      },
      {
        metric: {
          name: "pod.network.latency.p90",
          description: "Network Latency",
          suggestedLabel: "P90",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#8a8a8a",
        value: 50,
        formattedValue: "50ms",
        attributes: {},
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 105,
        formattedValue: "105ms",
        attributes: {},
      },
    ],
    timeZone: undefined,
    spansMultipleDays: false,
  },
};

export const MetricAndAttribute: Story = {
  args: {
    timestamp: new Date().getTime() / 1000,
    tooltipSerieList: [
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {
          "host.region": "us-east-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#8a8a8a",
        value: 50,
        formattedValue: "50ms",
        attributes: {
          "host.region": "us-east-1",
        },
      },
    ],
    timeZone: undefined,
    spansMultipleDays: false,
    hasMultipleAttributes: true,
    hasAttributes: true,
  },
};

export const MultipleAttributes: Story = {
  args: {
    timestamp: new Date().getTime() / 1000,
    tooltipSerieList: [
      {
        metric: {
          name: "pod.network.latency",
          description: "Network Latency",
          suggestedLabel: "Latency",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {
          "host.name": "server-1",
          "host.region": "us-east-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency",
          description: "Network Latency",
          suggestedLabel: "Latency",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 13,
        formattedValue: "13ms",
        attributes: {
          "host.name": "server-1",
          "host.region": "us-east-1",
        },
      },
    ],
    timeZone: undefined,
    spansMultipleDays: false,
    hasMultipleAttributes: true,
    hasAttributes: true,
  },
};

export const MultipleMetricsAndAttributes: Story = {
  args: {
    timestamp: new Date().getTime() / 1000,
    tooltipSerieList: [
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {
          "host.region": "us-east-2",
          "host.name": "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p90",
          description: "Network Latency",
          suggestedLabel: "P90",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#8a8a8a",
        value: 50,
        formattedValue: "50ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p90",
          description: "Network Latency",
          suggestedLabel: "P90",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#8a8a8a",
        value: 50,
        formattedValue: "50ms",
        attributes: {
          "host.region": "us-east-2",
          "host.name": "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 105,
        formattedValue: "105ms",
        attributes: {
          "host.region": "us-east-2",
          "host.name": "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 105,
        formattedValue: "105ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 20,
        formattedValue: "20ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 5,
        formattedValue: "5ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
    ],
    timeZone: undefined,
    spansMultipleDays: false,

    hasMultipleAttributes: true,
    hasAttributes: true,
    hasMultipleMetrics: true,
  },
};

export const LimitDisplay: Story = {
  args: {
    timestamp: new Date().getTime() / 1000,
    tooltipSerieList: [
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {
          "host.region": "us-east-2",
          "host.name": "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p90",
          description: "Network Latency",
          suggestedLabel: "P90",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#8a8a8a",
        value: 50,
        formattedValue: "50ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p90",
          description: "Network Latency",
          suggestedLabel: "P90",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#8a8a8a",
        value: 50,
        formattedValue: "50ms",
        attributes: {
          "host.region": "us-east-2",
          "host.name": "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 105,
        formattedValue: "105ms",
        attributes: {
          "host.region": "us-east-2",
          "host.name": "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 105,
        formattedValue: "105ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: undefined,
        formattedValue: "20ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: undefined,
        formattedValue: "5ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
    ],
    timeZone: undefined,
    spansMultipleDays: false,

    hasMultipleAttributes: true,
    hasAttributes: true,
    hasMultipleMetrics: true,
  },
};

export const LimitUndefinedDisplay: Story = {
  args: {
    timestamp: new Date().getTime() / 1000,
    tooltipSerieList: [
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {
          "host.region": "us-east-2",
          "host.name": "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p90",
          description: "Network Latency",
          suggestedLabel: "P90",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#8a8a8a",
        value: 50,
        formattedValue: "50ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p90",
          description: "Network Latency",
          suggestedLabel: "P90",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#8a8a8a",
        value: 50,
        formattedValue: "50ms",
        attributes: {
          "host.region": "us-east-2",
          "host.name": "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 105,
        formattedValue: "105ms",
        attributes: {
          "host.region": "us-east-2",
          "host.name": "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 105,
        formattedValue: "105ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 0,
        formattedValue: "20ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 0,
        formattedValue: "5ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
    ],
    timeZone: undefined,
    spansMultipleDays: false,

    hasMultipleAttributes: true,
    hasAttributes: true,
    hasMultipleMetrics: true,
  },
};

export const LimitZerosDisplay: Story = {
  args: {
    timestamp: new Date().getTime() / 1000,
    tooltipSerieList: [
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {
          "host.region": "us-east-2",
          "host.name": "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p90",
          description: "Network Latency",
          suggestedLabel: "P90",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#8a8a8a",
        value: 50,
        formattedValue: "50ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p90",
          description: "Network Latency",
          suggestedLabel: "P90",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#8a8a8a",
        value: 50,
        formattedValue: "50ms",
        attributes: {
          "host.region": "us-east-2",
          "host.name": "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 105,
        formattedValue: "105ms",
        attributes: {
          "host.region": "us-east-2",
          "host.name": "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 105,
        formattedValue: "105ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 0,
        formattedValue: "20ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 0,
        formattedValue: "5ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
    ],
    timeZone: undefined,
    spansMultipleDays: false,

    hasMultipleAttributes: true,
    hasAttributes: true,
    hasMultipleMetrics: true,
  },
};

export const OverflowValues: Story = {
  args: {
    timestamp: new Date().getTime() / 1000,
    tooltipSerieList: [
      {
        metric: {
          name: "very.long.metric.very.long.metric.very.long.metric.very.long.metric.pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel:
            "Very Long Metric Name That Should Overflow The Container", // Explicit long name
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {
          "host.region":
            "us-east-2-us-east-2-us-east-2-us-east-2-us-east-2-us-east-2-us-east-2-us-east-2-us-east-2-us-east-2",
          "host.name.host.name.host.name.host.name.host.name.host.name.host.name.host.name.host.name.host.name.host.name":
            "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue:
          "15000000000000000000000000000000000000000000000000000000000000000000ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 130,
        formattedValue: "130ms",
        attributes: {
          "host.region": "us-east-west-south-north-east-west-south-north",
        },
      },
    ],
    timeZone: undefined,
    spansMultipleDays: false,
  },
};

export const OverflowMetrics: Story = {
  args: {
    timestamp: new Date().getTime() / 1000,
    tooltipSerieList: [
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50000000000000000000000000000000000000000000000000",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {
          "host.name": "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p90",
          description: "Network Latency",
          suggestedLabel: "P90",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#8a8a8a",
        value: 50,
        formattedValue: "50ms",
        attributes: {},
      },
      {
        metric: {
          name: "pod.network.latency.p99",
          description: "Network Latency",
          suggestedLabel: "P99",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#3d3d3d",
        value: 105,
        formattedValue: "105ms",
        attributes: {},
      },
    ],
    timeZone: undefined,
    spansMultipleDays: false,
  },
};

export const OverflowAttributes: Story = {
  args: {
    timestamp: new Date().getTime() / 1000,
    tooltipSerieList: [
      {
        metric: {
          name: "very.long.metric.very.long.metric.very.long.metric.very.long.metric.pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel:
            "Very Long Metric Name That Should Overflow The Container",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 15,
        formattedValue: "15ms",
        attributes: {
          "host.region":
            "us-east-2-us-east-2-us-east-2-us-east-2-us-east-2-us-east-2-us-east-2-us-east-2-us-east-2-us-east-2",
          "host.name.host.name.host.name.host.name.host.name.host.name.host.name.host.name.host.name.host.name.host.name":
            "server-1",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 150,
        formattedValue: "150ms",
        attributes: {
          "host.region": "us-east-1",
          "host.name": "server-2",
        },
      },
      {
        metric: {
          name: "pod.network.latency.p50",
          description: "P50 Network Latency",
          suggestedLabel: "P50",
          unit: {
            code: "ms",
          },
          type: "gauge",
        },
        serie: {},
        color: "#afafaf",
        value: 130,
        formattedValue: "130ms",
        attributes: {
          "host.region": "us-east-west-south-north-east-west-south-north",
        },
      },
    ],
    timeZone: undefined,
    spansMultipleDays: false,
    hasMultipleAttributes: true,
    hasAttributes: true,
  },
};

export const Empty: Story = {
  args: {
    timestamp: new Date().getTime() / 1000,
    tooltipSerieList: [],
    timeZone: undefined,
    spansMultipleDays: false,
  },
};
