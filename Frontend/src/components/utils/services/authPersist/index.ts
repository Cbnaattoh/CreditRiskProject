import type { RootState } from "../../../redux/store";
import { isTokenExpired } from "../persistUtils";

export const loadAuthState = (): RootState["auth"] => {
  try {
    const serializedState = localStorage.getItem("authState");
    const token = localStorage.getItem("authToken");
    const refreshToken = localStorage.getItem("refreshToken");
    
    if (!serializedState && token) {
      return {
        user: null,
        token,
        refreshToken,
        isAuthenticated: true,
        requiresMFA: false,
        tempToken: null,
        mfaMethods: [],
        uid: null,
        isLoading: false,
        tokenExpired: false,
      };
    }
    
    if (!serializedState) {
      return getDefaultAuthState();
    }
    
    const parsed = JSON.parse(serializedState);
    
    // Validate token consistency
    if (parsed.token !== token || parsed.refreshToken !== refreshToken) {
      console.warn("Token mismatch between authState and localStorage tokens");
      parsed.token = token;
      parsed.refreshToken = refreshToken;
      parsed.isAuthenticated = !!token;
    }
    
    // Validate token expiration
    if (parsed.token && isTokenExpired(parsed.token)) {
      console.warn("Loaded expired token, clearing auth state");
      clearAuthState();
      return {
        ...getDefaultAuthState(),
        tokenExpired: true,
      };
    }
    
    console.log("Loaded auth state:", parsed);
    return parsed;
  } catch (err) {
    console.error("Error loading auth state:", err);
    clearAuthState();
    return getDefaultAuthState();
  }
};

export const saveAuthState = (state: RootState["auth"]) => {
  try {
    if (!state.isAuthenticated && !state.requiresMFA) {
      localStorage.removeItem("authState");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      return;
    }
    
    const toPersist = {
      user: state.user,
      token: state.token,
      refreshToken: state.refreshToken,
      isAuthenticated: state.isAuthenticated,
      requiresMFA: state.requiresMFA,
      tempToken: state.tempToken,
      mfaMethods: state.mfaMethods,
      uid: state.uid,
      isLoading: false,
      tokenExpired: state.tokenExpired,
    };
    
    console.log("Saving auth state:", toPersist);
    localStorage.setItem("authState", JSON.stringify(toPersist));
    
    if (state.token) {
      localStorage.setItem("authToken", state.token);
    }
    if (state.refreshToken) {
      localStorage.setItem("refreshToken", state.refreshToken);
    }
  } catch (err) {
    console.error("Error saving auth state:", err);
  }
};

export const clearAuthState = () => {
  try {
    localStorage.removeItem("authState");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
  } catch {
    // Ignore errors
  }
};

// Helper function to get default auth state
const getDefaultAuthState = (): RootState["auth"] => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  requiresMFA: false,
  tempToken: null,
  mfaMethods: [],
  uid: null,
  isLoading: false,
  tokenExpired: false,
});

// Validate auth state consistency
export const validateAuthState = (authState: RootState["auth"]) => {
  const issues: string[] = [];
  let needsSave = false;
  const correctedState = { ...authState };
  
  // Check for token expiration
  if (authState.token && isTokenExpired(authState.token)) {
    issues.push("Auth token expired");
    return { issues, correctedState: null, needsClear: true };
  }
  
  // Check authentication consistency
  if (authState.isAuthenticated && !authState.token) {
    issues.push("Authenticated without token");
    correctedState.isAuthenticated = false;
    needsSave = true;
  }
  
  if (authState.token && !authState.isAuthenticated) {
    issues.push("Token without authentication");
    correctedState.isAuthenticated = true;
    needsSave = true;
  }
  
  return { 
    issues, 
    correctedState: needsSave ? correctedState : null, 
    needsClear: false 
  };
};