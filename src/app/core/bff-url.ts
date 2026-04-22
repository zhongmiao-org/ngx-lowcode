const DEFAULT_BFF_PORT = '6001';

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function resolveDemoBffBaseUrl(): string {
  const globalUrl = (globalThis as { __LC_BFF_URL__?: unknown }).__LC_BFF_URL__;
  if (typeof globalUrl === 'string' && globalUrl.trim()) {
    return normalizeBaseUrl(globalUrl);
  }

  const locationLike = globalThis as {
    location?: {
      protocol?: string;
      hostname?: string;
    };
  };
  const protocol =
    typeof locationLike.location?.protocol === 'string' && locationLike.location.protocol
      ? locationLike.location.protocol
      : 'http:';
  const hostname =
    typeof locationLike.location?.hostname === 'string' && locationLike.location.hostname
      ? locationLike.location.hostname
      : 'localhost';

  return `${protocol}//${hostname}:${DEFAULT_BFF_PORT}`;
}
