export const StorageKeysEnum = {
  ANNOUNCEMENT: 'announcement',
  MAP: 'map',
} as const;

type StorageKey = (typeof StorageKeysEnum)[keyof typeof StorageKeysEnum];

export const setStorage = (key: StorageKey, value: string | null) => {
  if (value) {
    localStorage.setItem(key, value);
  } else {
    localStorage.removeItem(key);
  }
};

export const getStorage = (key: StorageKey) => {
  return localStorage.getItem(key);
};
