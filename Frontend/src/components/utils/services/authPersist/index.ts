import type { RootState } from "../../../redux/store";

export const loadAuthState = (): RootState["auth"] => {
  try {
    const serializedState = localStorage.getItem("authState");
    if (!serializedState) return {
      user: null,
      token: null,
      isAuthenticated: false,
      requiresMFA: false,
      tempToken: null,
      mfaMethods: []
    };
    
    const parsed = JSON.parse(serializedState);
    console.log("Loaded auth state:", parsed);
    return parsed;
  } catch (err) {
    console.error("Error loading auth state:", err);
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      requiresMFA: false,
      tempToken: null,
      mfaMethods: []
    };
  }
};


export const saveAuthState = (state: RootState["auth"]) => {
  try {
    const toPersist = {
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      requiresMFA: state.requiresMFA,
      tempToken: state.tempToken,
      mfaMethods: state.mfaMethods
    };
    console.log("Saving auth state:", toPersist);
    localStorage.setItem("authState", JSON.stringify(toPersist));
  } catch (err) {
    console.error("Error saving auth state:", err);
  }
};

export const clearAuthState = () => {
  try {
    localStorage.removeItem("authState");
  } catch {
    // ignore errors
  }
};
