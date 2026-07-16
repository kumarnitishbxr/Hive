const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const deriveOriginFromApiUrl = (apiUrl: string) => {
  try {
    const url = new URL(apiUrl);
    return trimTrailingSlash(url.origin);
  } catch {
    return null;
  }
};

export const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) {
    return trimTrailingSlash(configured);
  }

  return `${trimTrailingSlash(window.location.origin)}/api`;
};

export const getSocketUrl = () => {
  const configured = import.meta.env.VITE_SOCKET_URL;
  if (configured) {
    return trimTrailingSlash(configured);
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    const derivedOrigin = deriveOriginFromApiUrl(apiUrl);
    if (derivedOrigin) {
      return derivedOrigin;
    }
  }

  return trimTrailingSlash(window.location.origin);
};
