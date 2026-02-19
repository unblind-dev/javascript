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
            height: "300px",
            width: "1200px",
            maxWidth: "100%",
            // backgroundColor: "#F7F7F5",
            padding: "2rem 1rem 2rem 1rem",
            border: "1px solid #EAEAEA44",
            borderRadius: "1rem",
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
