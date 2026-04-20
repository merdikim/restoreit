export const TOKEN_KEY = 'restoreit_token';

export function isBrowser() {
  return typeof window !== 'undefined';
}

export function getToken() {
  if (!isBrowser()) {
    return null;
  }

  return getTokenFromCookieString(document.cookie);
}

export function getTokenFromCookieString(cookieString: string) {
  const value = cookieString
    .split('; ')
    .find((item) => item.startsWith(`${TOKEN_KEY}=`))
    ?.split('=')
    .slice(1)
    .join('=');

  return value ? decodeURIComponent(value) : null;
}

export function setToken(token: string) {
  if (!isBrowser()) {
    return;
  }

  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearToken() {
  if (!isBrowser()) {
    return;
  }

  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}
