export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

// Function to completely reset all persisted state
export const resetAllPersistedState = () => {
  try {
    localStorage.removeItem("authState");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userState");
  } catch (error) {
    console.error("Error clearing specific localStorage items:", error);
  }

  try {
    const authKeys = Object.keys(localStorage).filter(
      (key) =>
        key.includes("auth") || key.includes("user") || key.includes("token")
    );
    authKeys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};

// Safe localStorage operations with error handling
export const safeLocalStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return null;
  }
};

export const safeLocalStorageSet = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
    return false;
  }
};

export const safeLocalStorageRemove = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
    return false;
  }
};
