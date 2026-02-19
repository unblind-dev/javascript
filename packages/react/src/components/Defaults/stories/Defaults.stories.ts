import type { Meta, StoryObj } from "@storybook/react-vite";
import { Loading } from "..";

const meta: Meta<typeof Loading> = {
  title: "Components/Defaults",
  component: Loading,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Loading>;

export const LoadingExample: Story = {
  args: {},
};
