export const TTL_SHORT = 1000 * 60 * 15; // 15 minutes
export const TTL_MEDIUM = 1000 * 60 * 30; // 30 minutes
export const TTL_HOUR = 1000 * 60 * 60; // 1 hour
export const TTL_DAY = TTL_HOUR * 24; // 1 day
export const TTL_MONTH = TTL_DAY * 30; // 1 month
export const TTL_YEAR = TTL_DAY * 365; // 1 year

/* -------------------------------------------------------------------- */
// 1 YEAR - default value for SetCache()
/* -------------------------------------------------------------------- */

export const DISCHORDIAN_SAGA_KEY = 'dischordian_saga'; // all episodes
export const ACTIVE_EPISODE_KEY = 'active_episode'; // Season Nr + Episode Nr

/* -------------------------------------------------------------------- */
// 1 MONTH
/* -------------------------------------------------------------------- */

// use TTL_MONTH for storing Delegated NFTs per wallet
// wallet addres is used as KEY

/* -------------------------------------------------------------------- */
// 15 MINUTES
/* -------------------------------------------------------------------- */

export const POTENTIALS_KEY = 'potentials';

/* -------------------------------------------------------------------- */

function saveImportantAndClearCache() {
  // saving important values
  const allEpisodes = localStorage.getItem(DISCHORDIAN_SAGA_KEY);
  const activeEpisode = localStorage.getItem(ACTIVE_EPISODE_KEY);
  // deleting all values
  localStorage.clear();
  // restoring saved values
  if (allEpisodes) localStorage.setItem(DISCHORDIAN_SAGA_KEY, allEpisodes);
  if (activeEpisode) localStorage.setItem(ACTIVE_EPISODE_KEY, activeEpisode);
}

export const SetCache = <T>(key: string, value: T, ttl: number = TTL_YEAR) => {
  localStorage.setItem(
    key,
    JSON.stringify({
      value,
      expiry: Date.now() + ttl,
    }),
  );
};

export const GetCache = <T>(key: string): T | null => {
  const item = localStorage.getItem(key);
  if (!item) {
    return null;
  }
  const parsed = JSON.parse(item);
  if (parsed.expiry < Date.now()) {
    localStorage.removeItem(key);
    return null;
  }
  return parsed.value;
};

export const ClearCache = (
  key: string | 'auth' | 'view' | 'manage' | 'full',
) => {
  switch (key) {
    case 'full':
      saveImportantAndClearCache();
      break;
    default:
      localStorage.removeItem(key);
  }
};
