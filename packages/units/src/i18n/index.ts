export const t = (
  key: string,
  defaultMessage: string,
  values?: Record<string, unknown>,
): string => {
  if (!values) return defaultMessage;

  let result = defaultMessage;

  if ("count" in values && typeof values.count === "number") {
    const count = values.count;

    // Simple English pluralization rules
    // Remove 's' at the end if count is 1
    if (count === 1) {
      result = result.replace(/\b(\w+)s\b/g, "$1");
    }
  }

  result = result.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return values[variable]?.toString() ?? match;
  });

  return result;
};
