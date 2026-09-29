export const getErrorMessage = (
  e: unknown,
  fallback = "Something went wrong",
): string => {
  if (typeof e === "object" && e !== null && "response" in e) {
    const resp = (e as { response?: unknown }).response;
    if (typeof resp === "object" && resp !== null && "data" in resp) {
      const data = (resp as { data?: unknown }).data;

      if (typeof data === "object" && data !== null) {
        if ("message" in data) {
          const m = (data as { message?: unknown }).message;
          if (typeof m === "string" && m.trim()) return m;
        }
        if ("error" in data) {
          const err = (data as { error?: unknown }).error;
          if (typeof err === "object" && err !== null && "message" in err) {
            const m = (err as { message?: unknown }).message;
            if (typeof m === "string" && m.trim()) return m;
          }
        }
      }
    }
  }

  if (e instanceof Error && e.message.trim()) return e.message;
  if (typeof e === "string" && e.trim()) return e;

  return fallback;
};

export const toErrorMessage = (e: unknown, fallback: string) => {
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  if (e instanceof Error && e.message.trim()) return e.message;
  if (typeof e === "string" && e.trim()) return e;
  return fallback;
};

export const isDuplicateTitleError = (e: unknown) => {
  if (!e || typeof e !== "object") return false;

  const msg =
    "message" in e && typeof (e as { message?: unknown }).message === "string"
      ? (e as { message?: string }).message
      : "";

  const status =
    "statusCode" in e &&
    typeof (e as { statusCode?: unknown }).statusCode === "number"
      ? (e as { statusCode?: number }).statusCode
      : undefined;

  return status === 400 && msg?.toLowerCase().includes("duplicate");
};
