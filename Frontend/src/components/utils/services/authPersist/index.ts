import type { RootState } from "../../../redux/store";

export const loadAuthState = () => {
  try {
    const serializedState = localStorage.getItem("authState");
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

export const saveAuthState = (state: RootState["auth"]) => {
  try {
    const serializedState = JSON.stringify({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
    });
    localStorage.setItem("authState", serializedState);
  } catch {
    // ignore errors
  }
};

export const clearAuthState = () => {
  try {
    localStorage.removeItem("authState");
  } catch {
    // ignore errors
  }
};
