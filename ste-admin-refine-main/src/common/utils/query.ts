export const setQueryParam = (key: string, value?: string) => {
  const sp = new URLSearchParams(window.location.search);

  if (value && value.length) sp.set(key, value);
  else sp.delete(key);

  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}?${sp.toString()}`,
  );
};

export const getQueryParam = (key: string) => {
  const sp = new URLSearchParams(window.location.search);
  const v = sp.get(key);
  return v ? v.trim() : null;
};
