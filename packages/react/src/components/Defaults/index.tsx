import { EmptyIcon } from "../Icons";

export function Empty() {
  return (
    <div className="ub-default">
      <div className="ub-empty-content">
        <div className="ub-empty-icon-wrapper">
          <EmptyIcon />
        </div>
        <p
          className="ub-empty-text"
          data-text="No data available for this time range"
        />
      </div>
    </div>
  );
}

export function Error() {
  return <div className="ub-default-error" />;
}

export function Loading() {
  return <div className="ub-default-loading" data-text="Loading" />;
}
