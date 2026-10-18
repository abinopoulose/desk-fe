/**
 * Derives a clean username slug from user metadata.
 * Priority:
 * 1. user.username (if present)
 * 2. Prefix from email (e.g. 'abino' from 'abino@abino.in', 'abino.poulose.123' from 'abino.poulose.123@abino.in')
 * 3. user.displayId (e.g. 'USER-1')
 * 4. user.id fallback
 */
export const getUserSlug = (
  user?: { email?: string; username?: string; displayId?: string; id?: string } | null
): string => {
  if (!user) return '';
  if (user.username && typeof user.username === 'string') {
    return user.username;
  }
  if (user.email && typeof user.email === 'string' && user.email.includes('@')) {
    return user.email.split('@')[0];
  }
  return user.displayId || user.id || '';
};

/**
 * Derives a clean single-character uppercase initial for avatars and badge fallbacks.
 */
export const getUserInitial = (
  userOrName?: string | { fullName?: string; email?: string } | null,
  fallback = 'U'
): string => {
  if (!userOrName) return fallback;
  if (typeof userOrName === 'string') {
    const trimmed = userOrName.trim();
    return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : fallback;
  }
  if (userOrName.fullName && userOrName.fullName.trim().length > 0) {
    return userOrName.fullName.trim().charAt(0).toUpperCase();
  }
  if (userOrName.email && userOrName.email.trim().length > 0) {
    return userOrName.email.trim().charAt(0).toUpperCase();
  }
  return fallback;
};
