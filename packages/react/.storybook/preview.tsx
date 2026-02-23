import type { Preview } from "@storybook/react-vite";
import { UnblindProvider } from "../src/providers/UnblindProvider";

import "./styles.css";
import "../src/styles.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  decorators: [
    (Story) => (
      <UnblindProvider>
        <div
          style={{
            maxWidth: "100%",
            // backgroundColor: "#F7F7F5",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Story />
        </div>
      </UnblindProvider>
    ),
  ],
};

export default preview;
