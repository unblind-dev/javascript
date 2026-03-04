import { dateTimeFormat } from "@unblind/units";
import { createContext, Fragment, PropsWithChildren, useContext } from "react";
import { TooltipSerie } from "@/types";
import { TooltipSerieListOptions } from "./plugin";

// Types
export interface TooltipProps {
  timestamp: number;
  serieList: TooltipSerie[];
  options: {
    timeZone?: string;
    stacked?: boolean;
    invertSort?: boolean;
    visibilityLimit?: number;
    disableSuggestedLabel?: boolean;
  };
}

type TooltipExtendedProps = TooltipProps & {
  serieListOptions: TooltipSerieListOptions;
};

const DEFAULT_VISIBILITY_LIMIT = 6;

// Context for serie
const SerieContext = createContext<TooltipSerie | null>(null);

function useTooltipSerie() {
  const context = useContext(SerieContext);
  if (!context) {
    throw new Error("useTooltipSerie must be used within a SerieProvider");
  }
  return context;
}

function SerieProvider({
  serie,
  children,
}: PropsWithChildren<{ serie: TooltipSerie }>) {
  return (
    <SerieContext.Provider value={serie}>{children}</SerieContext.Provider>
  );
}

const TooltipContext = createContext<
  | (Pick<TooltipProps, "options"> & {
      formattedTime: string;
      serieList: Array<TooltipSerie>;
      maxAttributeKeySetCount: number;
    })
  | null
>(null);

function useTooltip() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error("useTooltipSerie must be used within a SerieProvider");
  }
  return context;
}

function TooltipProvider({
  formattedTime,
  tooltip,
  children,
  serieList,
  maxAttributeKeySetCount,
}: PropsWithChildren & {
  maxAttributeKeySetCount: number;
  formattedTime: string;
  tooltip: Pick<TooltipProps, "options">;
  serieList: Array<TooltipSerie>;
}) {
  return (
    <TooltipContext.Provider
      value={{
        options: {
          disableSuggestedLabel: tooltip.options.disableSuggestedLabel,
          invertSort: tooltip.options.invertSort,
          visibilityLimit:
            tooltip.options.visibilityLimit || DEFAULT_VISIBILITY_LIMIT,
        },
        formattedTime,
        serieList,
        maxAttributeKeySetCount,
      }}
    >
      {children}
    </TooltipContext.Provider>
  );
}

function MetricsTooltip() {
  const { options, formattedTime, serieList } = useTooltip();
  const { visibilityLimit } = options;
  const visibleSeries = serieList.slice(0, visibilityLimit);
  const afterLimit = serieList.slice(visibilityLimit);

  return (
    <div className="ub-tooltip ub-tooltip-multiple-metrics">
      <Container>
        <Content>
          {visibleSeries.map((x) => (
            <Serie serie={x} key={x.metric.name}>
              <Color />
              <Metric />
              <Value />
            </Serie>
          ))}
        </Content>
        <Summary series={afterLimit} />
      </Container>
      <Footer>
        <DateTime>{formattedTime}</DateTime>
      </Footer>
    </div>
  );
}

function MultipleAttributesTooltip() {
  const { options, formattedTime, serieList } = useTooltip();
  const { visibilityLimit } = options;

  const visibleSeries = serieList.slice(0, visibilityLimit);
  const afterLimit = serieList.slice(visibilityLimit);

  return (
    <div className="ub-tooltip ub-tooltip-multiple-attributes">
      <Container>
        <Content>
          {visibleSeries.map((x, i) => (
            <Serie serie={x} key={"serie_" + i}>
              <Color />
              <Attributes />
              <Value />
            </Serie>
          ))}
        </Content>
        <Summary series={afterLimit} />
      </Container>
      <Footer>
        <DateTime>{formattedTime}</DateTime>
      </Footer>
    </div>
  );
}

function MultipleAttributesMultipleMetricsTooltip() {
  const { options, formattedTime, serieList } = useTooltip();
  const { visibilityLimit } = options;
  const visibleSeries = serieList.slice(0, visibilityLimit);
  const afterLimit = serieList.slice(visibilityLimit);

  return (
    <div className="ub-tooltip ub-tooltip-multiple-metrics-attributes">
      <Container>
        <Content>
          {visibleSeries.map((x, i) => (
            <Serie serie={x} key={"serie" + i}>
              <Color />
              <Metric />
              <Attributes />
              <Value />
            </Serie>
          ))}
        </Content>
        <Summary series={afterLimit} />
      </Container>
      <Footer>
        <DateTime>{formattedTime}</DateTime>
      </Footer>
    </div>
  );
}

function Summary({ series }: { series: Array<TooltipSerie> }) {
  const formattedVal = series[0]?.formattedValue;
  const allZeroes = !series.some((x) => (x.value || 0) > 0);
  const allUndefined = !series.some((x) => x.value !== undefined);
  const { options } = useTooltip();
  const { invertSort } = options;

  if (series.length > 0) {
    if (allUndefined) {
      return (
        <span className="ub-tooltip-summary">
          <span>+{series.length} more with no data</span>
        </span>
      );
    }

    if (allZeroes) {
      return (
        <span className="ub-tooltip-summary">
          <span>+{series.length} more with zero values</span>
        </span>
      );
    }

    return (
      <span className="ub-tooltip-summary">
        <span>+{series.length} more with </span>
        <span className="ub-tooltip-serie-value">{`${invertSort ? "≥" : "≤"} ${formattedVal}`}</span>
      </span>
    );
  }
  return <></>;
}

function Serie(props: PropsWithChildren & { serie: TooltipSerie }) {
  return (
    <SerieProvider serie={props.serie}>
      <div className="ub-tooltip-serie">{props.children}</div>
    </SerieProvider>
  );
}

function Content(props: PropsWithChildren) {
  const { maxAttributeKeySetCount } = useTooltip();

  return (
    <div
      className="ub-tooltip-content"
      style={{ "--attr-count": maxAttributeKeySetCount } as React.CSSProperties}
    >
      {props.children}
    </div>
  );
}

function Container(props: PropsWithChildren) {
  return <div className="ub-tooltip-container">{props.children}</div>;
}

function Footer(props: PropsWithChildren) {
  return <div className="ub-tooltip-footer">{props.children}</div>;
}

function DateTime(props: PropsWithChildren) {
  return <div className="ub-tooltip-datetime">{props.children}</div>;
}

function Metric() {
  const serie = useTooltipSerie();
  const { options } = useTooltip();
  const { disableSuggestedLabel } = options;

  return (
    <span className="ub-tooltip-serie-metric ub-truncate">
      {serie.metric.label ||
        (!disableSuggestedLabel && serie.metric.suggestedLabel) ||
        serie.metric.name}
    </span>
  );
}

function Value() {
  const { formattedValue } = useTooltipSerie();
  return formattedValue ? (
    <span className="ub-tooltip-serie-value ub-truncate">{formattedValue}</span>
  ) : (
    <span className="ub-tooltip-serie-value-empty">–</span>
  );
}

function Color() {
  const { color: backgroundColor } = useTooltipSerie();
  return (
    <div className="ub-tooltip-serie-color-container">
      <span
        style={{ backgroundColor }}
        className="ub-tooltip-serie-color"
      ></span>
    </div>
  );
}

function Attributes() {
  const { maxAttributeKeySetCount } = useTooltip();
  const { attributes } = useTooltipSerie();
  if (!attributes) return null;

  const attributeValues = Object.values(attributes);
  const fillCount = maxAttributeKeySetCount - attributeValues.length;

  return (
    <div className="ub-tooltip-serie-attributes ub-truncate">
      {attributeValues.map((attributeValue) => (
        <Fragment key={"tooltip-" + attributeValue}>
          <span className="ub-tooltip-serie-attribute-value ub-truncate">
            {attributeValue}
          </span>
        </Fragment>
      ))}
      {Array.from({ length: fillCount }).map((_, i) => (
        <span key={"fill-" + i} />
      ))}
    </div>
  );
}

export function sortSeriesByValue({
  serieList,
  invertSort,
}: {
  serieList: Array<TooltipSerie>;
  invertSort?: boolean;
}): Array<TooltipSerie> {
  if (invertSort) {
    return serieList.sort(
      (a, b) => (Number(a.value) || 0) - (Number(b.value) || 0),
    );
  } else {
    return serieList.sort(
      (a, b) => (Number(b.value) || 0) - (Number(a.value) || 0),
    );
  }
}

export function Tooltip({
  timestamp,
  serieList: unsortedserieList,
  serieListOptions,
  options,
}: TooltipExtendedProps) {
  const { timeZone, invertSort, visibilityLimit, disableSuggestedLabel } =
    options;
  const {
    spansMultipleDays,
    hasMultipleMetrics,
    hasAttributes,
    maxAttributeKeySetCount,
  } = serieListOptions;
  const serieList = sortSeriesByValue({
    serieList: unsortedserieList,
    invertSort,
  });
  const formattedTime = spansMultipleDays
    ? dateTimeFormat(timestamp * 1000, {
        format: "MMM DD, HH:mm",
        timeZone,
      })
    : dateTimeFormat(timestamp * 1000, {
        format: "HH:mm",
        timeZone,
      });

  if (!hasAttributes) {
    return (
      <TooltipProvider
        tooltip={{
          options: {
            invertSort,
            visibilityLimit,
            disableSuggestedLabel,
          },
        }}
        formattedTime={formattedTime}
        serieList={serieList}
        maxAttributeKeySetCount={maxAttributeKeySetCount}
      >
        <MetricsTooltip />
      </TooltipProvider>
    );
  }

  if (hasAttributes && !hasMultipleMetrics) {
    return (
      <TooltipProvider
        tooltip={{
          options: {
            invertSort,
            visibilityLimit,
            disableSuggestedLabel,
          },
        }}
        formattedTime={formattedTime}
        serieList={serieList}
        maxAttributeKeySetCount={maxAttributeKeySetCount}
      >
        <MultipleAttributesTooltip />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider
      tooltip={{
        options: {
          invertSort,
          visibilityLimit,
          disableSuggestedLabel,
        },
      }}
      formattedTime={formattedTime}
      serieList={serieList}
      maxAttributeKeySetCount={maxAttributeKeySetCount}
    >
      <MultipleAttributesMultipleMetricsTooltip />
    </TooltipProvider>
  );
}
