// storageUtils.js

// Update localStorage and emit a custom event
export const updateLocalStorage = (key, value) => {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event("localStorageUpdated"));
};

// Update sessionStorage and emit a custom event
export const updateSessionStorage = (key, value) => {
  sessionStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("sessionStorageUpdated"));
};

// Get data from localStorage
export const getLocalStorage = (key) => {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : null;
};

// Get data from sessionStorage
export const getSessionStorage = (key) => {
  const value = sessionStorage.getItem(key);
  return value ? JSON.parse(value) : null;
};
