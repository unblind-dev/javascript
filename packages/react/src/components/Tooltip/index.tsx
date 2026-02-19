import { dateTimeFormat } from "@unblind/units";
import { createContext, Fragment, PropsWithChildren, useContext } from "react";
import { TooltipSerie } from "@/types";

// Types
export interface TooltipProps {
  timestamp: number;
  tooltipSerieList: TooltipSerie[];
  timeZone?: string;
  stacked?: boolean;
  invertSort?: boolean;
  visibilityLimit?: number;
  disableSuggestedLabel?: boolean;
}

interface TooltipExtendedProps extends TooltipProps {
  spansMultipleDays?: boolean;
  hasMultipleMetrics: boolean;
  hasMultipleAttributes: boolean;
  hasAttributes: boolean;
}

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
// Context for tooltip
const TooltipContext = createContext<
  | (Pick<
      TooltipProps,
      "disableSuggestedLabel" | "invertSort" | "visibilityLimit"
    > & { formattedTime: string })
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
}: PropsWithChildren & {
  formattedTime: string;
  tooltip: Pick<
    TooltipProps,
    "disableSuggestedLabel" | "invertSort" | "visibilityLimit"
  >;
}) {
  return (
    <TooltipContext.Provider
      value={{
        formattedTime,
        disableSuggestedLabel: tooltip.disableSuggestedLabel,
        invertSort: tooltip.invertSort,
        visibilityLimit: tooltip.visibilityLimit || DEFAULT_VISIBILITY_LIMIT,
      }}
    >
      {children}
    </TooltipContext.Provider>
  );
}

function Divider({
  className = "ub-tooltip-divider",
  ...props
}: React.ComponentPropsWithoutRef<"hr">) {
  return <hr role="presentation" {...props} className={className} />;
}

function MetricsTooltip({
  unitCategory,
  tooltipSerieList,
}: {
  unitCategory: string;
  tooltipSerieList: Array<TooltipSerie>;
}) {
  const { visibilityLimit, formattedTime } = useTooltip();
  const visibleSeries = tooltipSerieList.slice(0, visibilityLimit);
  const afterLimit = tooltipSerieList.slice(visibilityLimit);

  return (
    <div className="ub-tooltip ub-tooltip-multiple-metrics">
      <Header>
        <DateTime>{formattedTime}</DateTime>
        <div className="ub-tooltip-header-right">
          <UnitCategory>{unitCategory}</UnitCategory>
        </div>
      </Header>
      <Divider />
      <div>
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
      </div>
    </div>
  );
}

function MultipleAttributesTooltip({
  tooltipSerieList,
}: {
  tooltipSerieList: Array<TooltipSerie>;
}) {
  const { visibilityLimit, disableSuggestedLabel, formattedTime } =
    useTooltip();
  const firstSerie = tooltipSerieList[0];

  const visibleSeries = tooltipSerieList.slice(0, visibilityLimit);
  const afterLimit = tooltipSerieList.slice(visibilityLimit);

  return (
    <div className="ub-tooltip ub-tooltip-multiple-attributes">
      <Header>
        <DateTime>{formattedTime}</DateTime>
        <div className="ub-tooltip-header-right">
          <span className="ub-tooltip-serie-metric">
            {firstSerie?.metric.label ||
              (!disableSuggestedLabel && firstSerie?.metric.suggestedLabel) ||
              firstSerie?.metric.name}
          </span>
        </div>
      </Header>
      <Divider />
      <div>
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
      </div>
    </div>
  );
}

function MultipleAttributesMultipleMetricsTooltip({
  tooltipSerieList,
  unitCategory,
}: {
  unitCategory: string;
  tooltipSerieList: Array<TooltipSerie>;
}) {
  const { visibilityLimit, formattedTime } = useTooltip();
  const visibleSeries = tooltipSerieList.slice(0, visibilityLimit);
  const afterLimit = tooltipSerieList.slice(visibilityLimit);

  return (
    <div className="ub-tooltip ub-tooltip-multiple-metrics-attributes">
      <Header>
        <DateTime>{formattedTime}</DateTime>
        <div className="ub-tooltip-header-right">
          <span className="ub-tooltip-unit-category">{unitCategory}</span>
        </div>
      </Header>
      <Divider />
      <div>
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
      </div>
    </div>
  );
}

function UnitCategory(props: PropsWithChildren) {
  return <span className="ub-tooltip-unit-category">{props.children}</span>;
}

function Summary({ series }: { series: Array<TooltipSerie> }) {
  const formattedVal = series[0]?.formattedValue;
  const allZeroes = !series.some((x) => (x.value || 0) > 0);
  const allUndefined = !series.some((x) => x.value !== undefined);
  const { invertSort } = useTooltip();

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
        <span>{`${invertSort ? "≥" : "≤"} ${formattedVal}`}</span>
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
  return <div className="ub-tooltip-content">{props.children}</div>;
}

function Header(props: PropsWithChildren) {
  return <div className="ub-tooltip-header">{props.children}</div>;
}

function DateTime(props: PropsWithChildren) {
  return <div className="ub-tooltip-datetime">{props.children}</div>;
}

function Metric() {
  const serie = useTooltipSerie();
  const { disableSuggestedLabel } = useTooltip();
  return (
    <span className="ub-tooltip-serie-metric ub-truncate">
      {serie.metric.label ||
        (!disableSuggestedLabel && serie.metric.suggestedLabel) ||
        serie.metric.name}
    </span>
  );
}

function Value() {
  const serie = useTooltipSerie();
  return serie.formattedValue ? (
    <span className="ub-tooltip-serie-value ub-truncate">
      {serie.formattedValue}
    </span>
  ) : (
    <span className="ub-tooltip-serie-value-empty">–</span>
  );
}

function Color() {
  const serie = useTooltipSerie();
  return (
    <span
      style={{ backgroundColor: serie.color }}
      className="ub-tooltip-serie-color"
    />
  );
}

function Attributes() {
  const { attributes } = useTooltipSerie();
  if (!attributes) return null;
  const attributeValues = Object.values(attributes);

  return (
    <div className="ub-tooltip-serie-attributes ub-truncate">
      {attributeValues.map((attributeValue, index) => (
        <Fragment key={"tooltip-" + attributeValue}>
          <span className="ub-tooltip-serie-attribute-value">
            {attributeValue}
          </span>
          {index < attributeValues.length - 1 && (
            <span
              data-text=", "
              className="ub-tooltip-serie-attribute-divider"
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}

export function sortSeriesByValue({
  tooltipSerieList,
  invertSort,
}: {
  tooltipSerieList: Array<TooltipSerie>;
  invertSort?: boolean;
}): Array<TooltipSerie> {
  if (invertSort) {
    return tooltipSerieList.sort(
      (a, b) => (Number(a.value) || 0) - (Number(b.value) || 0),
    );
  } else {
    return tooltipSerieList.sort(
      (a, b) => (Number(b.value) || 0) - (Number(a.value) || 0),
    );
  }
}

export function Tooltip({
  timestamp,
  tooltipSerieList: unsortedTooltipSerieList,
  timeZone,
  spansMultipleDays,
  hasMultipleMetrics,
  hasAttributes,
  invertSort,
  visibilityLimit,
  disableSuggestedLabel,
}: TooltipExtendedProps) {
  const tooltipSerieList = sortSeriesByValue({
    tooltipSerieList: unsortedTooltipSerieList,
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
          invertSort,
          visibilityLimit,
          disableSuggestedLabel,
        }}
        formattedTime={formattedTime}
      >
        <MetricsTooltip unitCategory={""} tooltipSerieList={tooltipSerieList} />
      </TooltipProvider>
    );
  }

  if (hasAttributes && !hasMultipleMetrics) {
    return (
      <TooltipProvider
        tooltip={{
          invertSort,
          visibilityLimit,
          disableSuggestedLabel,
        }}
        formattedTime={formattedTime}
      >
        <MultipleAttributesTooltip tooltipSerieList={tooltipSerieList} />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider
      tooltip={{
        invertSort,
        visibilityLimit,
        disableSuggestedLabel,
      }}
      formattedTime={formattedTime}
    >
      <MultipleAttributesMultipleMetricsTooltip
        unitCategory={""}
        tooltipSerieList={tooltipSerieList}
      />
    </TooltipProvider>
  );
}
