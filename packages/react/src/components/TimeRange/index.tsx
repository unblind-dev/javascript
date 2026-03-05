import {
  Fragment,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  KeyboardEventHandler,
  useMemo,
} from "react";
import "./TimeRange.css";
import {
  dateTime,
  dateTimeForTimeZone,
  formatTimeRangeLabel,
  getCalendarRanges,
  getTimeZoneInfo,
  parseDateMath as parse,
  parseHumanInput,
  parseHumanInputToLabel,
  RangeItem,
  RELATIVE_RANGES,
} from "@unblind/units";
import { useScope } from "@/providers";
import { ChevronIcon, ClockIcon, RefreshIcon, XMarkIcon } from "../Icons";
import { type TimeRangeValue } from "@unblind/units";
import { useRefresh } from "@/providers/UnblindProvider";

const DEFAULT_RANGE_LABEL = "Past 6 Hours";

export interface TimeRangeProps {
  disabled?: boolean;
  disableRefresh?: boolean;
  className?: string;
}

/**
 * Badge shown next to the current range label.
 */
export function Badge({
  label,
  ranges,
}: {
  label: string;
  ranges: RangeItem[];
}) {
  const found = ranges.find((r) => r.label === label);
  if (found) return <span className="ub-timerange-badge">{found.badge}</span>;

  const raw = parseHumanInput(label);
  if (!raw) return <span className="ub-timerange-badge">-</span>;

  const unitLabel = parseHumanInputToLabel(raw);
  if (unitLabel) {
    return <span className="ub-timerange-badge ub-truncate">{unitLabel}</span>;
  }

  return <span className="ub-timerange-badge">-</span>;
}

function RefreshButton({ onClick }: { onClick: () => void }) {
  const refresh = useRefresh();
  const [isRefreshClicked, setIsRefreshClicked] = useState(false);

  return (
    <button
      type="button"
      className={`ub-timerange-refresh-button ${isRefreshClicked ? "is-clicked" : ""}`}
      onAnimationEnd={() => setIsRefreshClicked(false)}
      onClick={async () => {
        setIsRefreshClicked(false);
        requestAnimationFrame(() => setIsRefreshClicked(true));
        if (onClick) {
          onClick();
        }
        refresh();
      }}
    >
      <RefreshIcon />
    </button>
  );
}

/**
 * Time range picker with relative presets,
 * calendar ranges, and optional refresh action.
 */
export function TimeRange({
  disabled,
  disableRefresh,
  className,
}: TimeRangeProps) {
  const id = useId();
  const inputId = `${id}-input`;
  const listboxId = `${id}-listbox`;
  const {
    timeRange: scopeTimeRange,
    startTime,
    endTime,
    updateTimeRange,
    timeZone,
  } = useScope();
  const committedStartTime = useRef(startTime);
  const committedEndTime = useRef(endTime);

  const [isInvalid, setIsInvalid] = useState(false);

  const calendarRanges = useMemo(() => getCalendarRanges(), []);
  const allRanges = useMemo(
    () => [...RELATIVE_RANGES, ...calendarRanges],
    [calendarRanges],
  );

  const initialLabel = useMemo(() => {
    if (startTime != null && endTime != null) {
      return formatTimeRangeLabel(startTime, endTime, timeZone);
    }
    return scopeTimeRange;
  }, [startTime, endTime, scopeTimeRange, timeZone]);

  const [inputValue, setInputValue] = useState(initialLabel);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasInputFocus, setHasInputFocus] = useState(false);

  const committedValue = useRef(initialLabel);
  const commitLockRef = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAbsoluteRange = startTime != null && endTime != null;

  const filteredOptions = useMemo(() => {
    const normalizedInput = inputValue.trim().toLowerCase();
    if (
      isAbsoluteRange ||
      normalizedInput === "" ||
      allRanges.some((r) => r.label === inputValue)
    ) {
      return allRanges;
    }
    return allRanges.filter(
      (r) =>
        r.label.toLowerCase().includes(normalizedInput) ||
        r.badge.toLowerCase().includes(normalizedInput),
    );
  }, [allRanges, inputValue, isAbsoluteRange]);

  const calendarDividerIndex = filteredOptions.findIndex((o) =>
    calendarRanges.some((c) => c.value === o.value),
  );

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const revert = useCallback(() => {
    if (
      committedStartTime.current != null &&
      committedEndTime.current != null
    ) {
      updateTimeRange("", committedStartTime.current, committedEndTime.current);
      setInputValue(
        formatTimeRangeLabel(
          committedStartTime.current,
          committedEndTime.current,
          timeZone,
        ),
      );
    } else {
      setInputValue(committedValue.current);
    }
    close();
  }, [close, timeZone, updateTimeRange]);

  const commit = useCallback(
    (label: string, value: TimeRangeValue) => {
      if (commitLockRef.current) return;
      commitLockRef.current = true;
      setTimeout(() => {
        commitLockRef.current = false;
      }, 100);

      setInputValue(label);
      committedValue.current = label;
      close();
      if (
        startTime == null &&
        endTime == null &&
        scopeTimeRange &&
        value === scopeTimeRange
      ) {
        return;
      }
      const raw = parseHumanInput(label);
      if (raw) {
        const now = dateTimeForTimeZone(timeZone);

        const fromMath = raw.from.startsWith("now")
          ? raw.from.slice("now".length)
          : "";
        const toMath = raw.to.startsWith("now")
          ? raw.to.slice("now".length)
          : "";

        const from = fromMath
          ? parse(fromMath, dateTime(now), false)
          : dateTime(now);
        const to = toMath ? parse(toMath, dateTime(now), true) : dateTime(now);

        if (from?.isValid() && to?.isValid()) {
          updateTimeRange(value, undefined, undefined);
        }
      }
    },
    [close, timeZone, updateTimeRange, startTime, endTime, scopeTimeRange],
  );

  const selectOption = useCallback(
    (option: RangeItem | undefined) => {
      if (!option) return;
      commit(option.label, option.value);
    },
    [commit],
  );

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const activeOptionId = `${id}-opt-${activeIndex}`;
      const option = listboxRef.current.querySelector(
        `#${CSS.escape(activeOptionId)}`,
      );
      option?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, id]);

  useEffect(() => {
    if (startTime != null && endTime != null) {
      committedStartTime.current = startTime;
      committedEndTime.current = endTime;
      const label = formatTimeRangeLabel(startTime, endTime, timeZone);
      committedValue.current = label;
      setInputValue(label);
    }
  }, [startTime, endTime, timeZone]);

  // useEffect(() => {
  //   if (startTime != null || endTime != null) return;
  //   if (!scopeTimeRange) return;
  //   const label = allRanges.find((r) => r.value === scopeTimeRange)?.label;
  //   committedValue.current = label;
  //   setInputValue(label);
  // }, [allRanges, scopeTimeRange, startTime, endTime]);

  const activeOptionId =
    isOpen && activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined;

  const triggerInvalid = useCallback(() => {
    setIsInvalid(false);
    requestAnimationFrame(() => setIsInvalid(true));
  }, []);

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.ctrlKey || e.shiftKey) return;

    switch (e.key) {
      case "ArrowDown":
      case "Down":
        e.preventDefault();
        open();
        setActiveIndex((i) => (i < filteredOptions.length - 1 ? i + 1 : 0));
        break;

      case "ArrowUp":
      case "Up":
        e.preventDefault();
        if (!isOpen) {
          open();
          setActiveIndex(filteredOptions.length - 1);
        } else {
          setActiveIndex((i) => (i > 0 ? i - 1 : filteredOptions.length - 1));
        }
        break;

      case "Enter":
        e.preventDefault();
        if (isOpen && activeIndex >= 0) {
          const option = filteredOptions[activeIndex];
          if (option) {
            selectOption(option);
          }
        } else {
          const selectedOption = allRanges.find((r) => r.label === inputValue);
          if (selectedOption) {
            // e.currentTarget.blur();
            commit(selectedOption.label, selectedOption.value);
            break;
          }
          const raw = parseHumanInput(inputValue);
          if (raw) {
            commit(inputValue, inputValue as TimeRangeValue);
          } else {
            triggerInvalid();
          }
        }
        break;

      case "Escape":
      case "Esc":
        e.currentTarget.blur();
        revert();
        setIsInvalid(false);
        break;

      case "Tab":
        if (isOpen && activeIndex >= 0) {
          selectOption(filteredOptions[activeIndex]);
        } else {
          revert();
        }
        break;

      case "Home":
        e.preventDefault();
        inputRef.current?.setSelectionRange(0, 0);
        break;

      case "End": {
        e.preventDefault();
        const len = inputRef.current?.value.length ?? 0;
        inputRef.current?.setSelectionRange(len, len);
        break;
      }

      default:
        break;
    }
  };

  return (
    <div className={`ub-timerange ${className || ""}`}>
      <div
        className={`ub-timerange-trigger ${isInvalid ? "invalid" : ""} ${disabled ? "disabled" : ""}`}
        ref={containerRef}
        onClick={() => {
          inputRef.current?.focus();
          open();
        }}
      >
        <div className={`ub-timerange-group ${hasInputFocus ? "focused" : ""}`}>
          {!isAbsoluteRange && <Badge label={inputValue} ranges={allRanges} />}
          {isAbsoluteRange && <ClockIcon />}
          <input
            id={inputId}
            ref={inputRef}
            readOnly={isAbsoluteRange}
            className="ub-timerange-input ub-truncate"
            type="text"
            role="combobox"
            aria-autocomplete="none"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-activedescendant={activeOptionId}
            value={inputValue}
            disabled={disabled}
            placeholder="Type to search…"
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsInvalid(false);
              open();
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setHasInputFocus(true)}
            onBlur={() => {
              setHasInputFocus(false);
              close();
            }}
            onClick={() => (isOpen ? close() : open())}
          />
          <button
            type="button"
            className="ub-timerange-button"
            tabIndex={-1}
            aria-label={
              isAbsoluteRange
                ? "Clear absolute time range"
                : "Toggle time range menu"
            }
            aria-expanded={isOpen}
            aria-controls={listboxId}
            disabled={disabled}
            onClick={() => {
              if (isAbsoluteRange && startTime != null && endTime != null) {
                updateTimeRange("", undefined, undefined); // clears scope
                setInputValue("");
                open();
                inputRef.current?.focus();
                return;
              }
              if (isOpen) {
                close();
              } else {
                open();
              }
              inputRef.current?.focus();
            }}
          >
            {isAbsoluteRange ? <XMarkIcon /> : <ChevronIcon />}
          </button>
        </div>

        {isOpen && filteredOptions.length > 0 && (
          <ul
            id={listboxId}
            ref={listboxRef}
            role="listbox"
            aria-label="Time Ranges"
            className="ub-timerange-listbox"
          >
            {filteredOptions.map((option, index) => (
              <Fragment key={option.value}>
                {index === calendarDividerIndex && calendarDividerIndex > 0 && (
                  <>
                    <li className="ub-timerange-divider" role="separator" />
                    <li
                      className="ub-timerange-section-title"
                      role="presentation"
                    >
                      CALENDAR TIME
                    </li>
                  </>
                )}
                <li
                  id={`${id}-opt-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className="ub-timerange-option"
                  onPointerDown={() => {
                    selectOption(option);
                  }}
                  onPointerEnter={() => setActiveIndex(index)}
                >
                  <span className="ub-timerange-badge">{option.badge}</span>
                  {option.label}
                </li>
              </Fragment>
            ))}

            <li role="presentation">
              <div className="ub-timerange-timezone">
                <span>Timezone</span>
                {/* Just use a random getTime */}
                {timeZone
                  ? getTimeZoneInfo(timeZone, new Date().getTime())?.name
                  : Intl.DateTimeFormat().resolvedOptions().timeZone}
              </div>
            </li>
          </ul>
        )}
      </div>

      {!disableRefresh && !disabled && (
        <RefreshButton
          onClick={() => {
            commit(
              committedValue.current,
              committedValue.current as TimeRangeValue,
            );
          }}
        />
      )}
    </div>
  );
}
