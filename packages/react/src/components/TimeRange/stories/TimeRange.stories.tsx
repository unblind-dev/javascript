import type { Meta, StoryObj } from "@storybook/react-vite";
import { TimeRange } from "..";
import { Scope } from "@/providers";

const meta: Meta<typeof TimeRange> = {
  title: "Components/TimeRange",
  component: TimeRange,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TimeRange>;

export const Default: Story = {
  args: {},
};

export const AbsoluteRange: Story = {
  args: {},
  decorators: [
    (Story) => (
      <Scope
        startTime={Math.ceil(new Date().getTime() - 3600000)}
        endTime={Math.ceil(new Date().getTime())}
      >
        <Story />
      </Scope>
    ),
  ],
};

export const AbsoluteRangeDays: Story = {
  args: {},
  decorators: [
    (Story) => (
      <Scope
        startTime={Math.ceil(new Date().getTime() - 360000000)}
        endTime={Math.ceil(new Date().getTime())}
      >
        <Story />
      </Scope>
    ),
  ],
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  decorators: [
    (Story) => (
      <Scope
        startTime={Math.ceil(new Date().getTime() - 360000000)}
        endTime={Math.ceil(new Date().getTime())}
      >
        <Story />
      </Scope>
    ),
  ],
};

export const Timezone: Story = {
  args: {},
  decorators: [
    (Story) => (
      <Scope
        startTime={Math.ceil(new Date().getTime() - 360000000)}
        endTime={Math.ceil(new Date().getTime())}
        timeZone="America/Los_Angeles"
      >
        <Story />
      </Scope>
    ),
  ],
};
