export function Empty() {
  return (
    <div className="ub-default">
      <div className="ub-empty-content">
        <div className="ub-empty-icon-wrapper">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="ub-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
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
