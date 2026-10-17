/**
 * Known root domain hostnames that have no tenant subdomain.
 * Configurable via VITE_ROOT_DOMAIN (comma-separated if multiple).
 */
export function getRootDomains(): string[] {
  const envDomain = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ROOT_DOMAIN;
  const configured = envDomain ? envDomain.split(',').map((d: string) => d.trim().toLowerCase()).filter(Boolean) : [];
  const defaults = ['localhost', '127.0.0.1', 'desk.abino', 'desk.abino.in'];
  const merged = [...defaults];
  for (const c of configured) {
    if (!merged.includes(c)) {
      merged.push(c);
    }
  }
  return merged;
}

/**
 * Extracts tenant subdomain from the current window hostname.
 * Examples:
 * - "abino.localhost" -> "abino"
 * - "firmname.desk.abino" -> "firmname"
 * - "firmname.desk.abino.in" -> "firmname"
 * - "tenant1.desk.example.com" -> "tenant1"
 * - "localhost" -> null
 * - "127.0.0.1" -> null
 * - "desk.abino" -> null
 * - "desk.abino.in" -> null
 */
export function getSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname.toLowerCase();
  const rootDomains = getRootDomains();

  // 1. Plain root hosts
  if (rootDomains.includes(hostname)) {
    return null;
  }

  // 2. Check localhost subdomains: firmname.localhost
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.slice(0, -'.localhost'.length);
    if (sub && sub !== 'www') {
      return sub;
    }
    return null;
  }

  // 3. Check configured root subdomains (e.g. firmname.desk.abino or firmname.yourdomain.com)
  for (const root of rootDomains) {
    if (root === 'localhost' || root === '127.0.0.1') continue;
    if (hostname.endsWith('.' + root)) {
      const sub = hostname.slice(0, -('.' + root).length);
      if (sub && sub !== 'www') {
        return sub;
      }
      return null;
    }
  }

  // 4. General fallback for domain with subdomains (e.g. tenant1.desk.example.com)
  const parts = hostname.split('.');
  if (parts.length > 2) {
    const sub = parts[0];
    if (sub !== 'www' && sub !== 'desk' && sub !== 'app') {
      return sub;
    }
  }

  return null;
}

/**
 * Builds the URL to redirect the user to their tenant workspace.
 * In dev: firmname.localhost (e.g. http://firmname.localhost:5173/dashboard#token=...)
 * In prod: firmname.desk.abino (e.g. https://firmname.desk.abino/dashboard#token=...)
 */
export function buildTenantUrl(tenantSubdomain: string, path: string = '/', token?: string): string {
  if (typeof window === 'undefined') {
    return path;
  }

  const { protocol, hostname, port } = window.location;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const portPart = port ? `:${port}` : '';
  const cleanHost = hostname.toLowerCase();
  let targetHost: string;

  if (cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost.endsWith('.localhost')) {
    targetHost = `${tenantSubdomain}.localhost${portPart}`;
  } else {
    const nonLocalRoots = getRootDomains().filter(d => d !== 'localhost' && d !== '127.0.0.1');
    const matchedRoot = nonLocalRoots.find(d => cleanHost === d || cleanHost.endsWith('.' + d));

    if (matchedRoot) {
      targetHost = `${tenantSubdomain}.${matchedRoot}${portPart}`;
    } else {
      const currentSub = getSubdomain();
      if (currentSub) {
        targetHost = cleanHost.replace(new RegExp(`^${currentSub}\\.`), `${tenantSubdomain}.`) + portPart;
      } else {
        targetHost = `${tenantSubdomain}.${cleanHost}${portPart}`;
      }
    }
  }

  const hashPart = token ? `#token=${encodeURIComponent(token)}` : '';
  return `${protocol}//${targetHost}${cleanPath}${hashPart}`;
}

/**
 * Extracts and consumes SSO / login redirect token from URL hash or query params,
 * then cleans the URL to prevent token leakage in history or address bar.
 */
export function extractSsoToken(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check hash fragment: #token=... or #sso_token=...
  if (window.location.hash) {
    const hashStr = window.location.hash.replace(/^#/, '');
    const hashParams = new URLSearchParams(hashStr);
    const hashToken = hashParams.get('token') || hashParams.get('sso_token');
    if (hashToken) {
      // Remove hash from URL without page reload
      const cleanUrl = window.location.pathname + (window.location.search || '');
      window.history.replaceState(null, document.title, cleanUrl);
      return hashToken;
    }
  }

  // 2. Check query params: ?token=... or ?sso_token=...
  if (window.location.search) {
    const searchParams = new URLSearchParams(window.location.search);
    const queryToken = searchParams.get('token') || searchParams.get('sso_token');
    if (queryToken) {
      searchParams.delete('token');
      searchParams.delete('sso_token');
      const newQuery = searchParams.toString();
      const cleanUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '') + (window.location.hash || '');
      window.history.replaceState(null, document.title, cleanUrl);
      return queryToken;
    }
  }

  return null;
}
