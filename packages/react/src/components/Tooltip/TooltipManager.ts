import { computePosition, flip, offset } from "@floating-ui/dom";
import { createRoot, Root } from "react-dom/client";
import uPlot from "uplot";

// Constants
const TOOLTIP_DISTANCE_CURSOR = 4;
const TOOLTIP_PADDING_FROM_CURSOR = 8;

export interface AnchorPosition {
  left?: number;
  top?: number;
}

/**
 * We want to make sure we have a single
 * Tooltip in the whole application.
 *
 * The tooltip manager is in charge of the tooltip lifecycle.
 */
class TooltipManager {
  private overlay: HTMLElement | null = null;
  private reactRoot: Root | null = null;
  private renderedUplot: uPlot | null = null;

  initialize() {
    if (this.overlay) return;

    this.overlay = document.createElement("div");
    this.overlay.id = "unblind-tooltip-overlay";
    this.overlay.style.display = "none";
    this.overlay.style.position = "fixed";
    this.overlay.style.pointerEvents = "none";
    this.overlay.style.zIndex = "9999";
    document.body.appendChild(this.overlay);

    this.reactRoot = createRoot(this.overlay);
  }

  getOverlay(): HTMLElement | null {
    return this.overlay;
  }

  render(u: uPlot | null, content: React.ReactElement | null) {
    if (this.reactRoot) {
      this.reactRoot.render(content);
      this.renderedUplot = u;
    } else {
      this.renderedUplot = null;
    }
  }

  show() {
    if (this.overlay) {
      this.overlay.style.display = "block";
    }
  }

  hide(u: uPlot) {
    if (u !== this.renderedUplot) {
      console.warn("Hide call plot");
      return;
    }
    if (this.overlay) {
      this.overlay.style.display = "none";
    }
    this.render(null, null);
  }

  getRenderedUplot(): uPlot | null {
    return this.renderedUplot;
  }

  /**
   * Positions the tooltip overlay relative to the cursor
   * @param anchor - Cursor position
   */
  async positionTooltip(anchor: AnchorPosition): Promise<void> {
    const overlay = this.getOverlay();
    if (overlay) {
      const { x, y } = await computePosition(
        {
          getBoundingClientRect: () => ({
            x: anchor.left!,
            y: anchor.top!,
            width: 0,
            height: 0,
            top: anchor.top!,
            left: anchor.left!,
            right: anchor.left!,
            bottom: anchor.top!,
          }),
        },
        overlay,
        {
          placement: "top-start",
          strategy: "fixed" as const,
          middleware: [
            offset({
              mainAxis: TOOLTIP_DISTANCE_CURSOR,
              crossAxis: TOOLTIP_PADDING_FROM_CURSOR,
            }),
            flip(),
          ],
        },
      );

      overlay.style.left = `${x}px`;
      overlay.style.top = `${y}px`;
    }
  }
}

// Singleton instance
export const tooltipManager = new TooltipManager();
