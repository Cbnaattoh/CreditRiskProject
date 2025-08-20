import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./features/api/baseApi";
import { applicationsApi } from "./features/api/applications/applicationsApi";
import { riskApi } from "./features/api/risk/riskApi";
import { notificationsApi } from "./features/api/notifications/notificationsApi";
import { securityApi } from "./features/api/security/securityApi";
import { mlApi } from "./features/api/ml/mlApi";
import authReducer from "./features/auth/authSlice";
import userReducer from "./features/user/userSlice";
import { registrationApi } from "../../services/registrationApi";
import { loadAuthState, saveAuthState } from "../utils/services/authPersist";
import { loadUserState, saveUserState } from "../utils/services/userPersist";
import { authUserSyncMiddleware } from "../utils/middleware/authUserSyncMiddleware";
import { clearAllAuthData } from "./features/auth/authSlice";
import { forceUserClear } from "./features/user/userSlice";
import {
  validateAndFixPersistedState,
  saveAuthState as enhancedSaveAuthState,
  saveUserState as enhancedSaveUserState,
} from "../utils/services";

const { issues, clearedAll } = validateAndFixPersistedState();
if (clearedAll) {
}

const preloadedState = {
  auth: loadAuthState(),
  user: loadUserState(),
};

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    [applicationsApi.reducerPath]: applicationsApi.reducer,
    [riskApi.reducerPath]: riskApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [securityApi.reducerPath]: securityApi.reducer,
    [mlApi.reducerPath]: mlApi.reducer,
    [registrationApi.reducerPath]: registrationApi.reducer,
    auth: authReducer,
    user: userReducer,
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionsPaths: ["payload.timestamp"],
        ignoredPaths: [
          "auth.lastUpdated",
          "user.lastUpdated",
          "user.lastAuthSync",
        ],
        ignoredActions: [
          "persist/FLUSH",
          "persist/REHYDRATE",
          "persist/PAUSE",
          "persist/PERSIST",
          "persist/PURGE",
          "persist/REGISTER",
        ],
      },
    })
      .concat(apiSlice.middleware)
      .concat(applicationsApi.middleware)
      .concat(riskApi.middleware)
      .concat(notificationsApi.middleware)
      .concat(securityApi.middleware)
      .concat(mlApi.middleware)
      .concat(registrationApi.middleware)
      .concat(authUserSyncMiddleware),
  devTools: process.env.NODE_ENV !== "production",
});

let lastAuthState: any = null;
let lastUserState: any = null;

store.subscribe(() => {
  const state = store.getState();

  // Only save if state actually changed
  if (JSON.stringify(state.auth) !== JSON.stringify(lastAuthState)) {
    if (typeof enhancedSaveAuthState === "function") {
      enhancedSaveAuthState(state.auth);
    } else {
      saveAuthState(state.auth);
    }
    lastAuthState = state.auth;
  }

  if (JSON.stringify(state.user) !== JSON.stringify(lastUserState)) {
    if (typeof enhancedSaveUserState === "function") {
      enhancedSaveUserState(state.user);
    } else {
      saveUserState(state.user);
    }
    lastUserState = state.user;
  }
});

// Initialize last states
lastAuthState = store.getState().auth;
lastUserState = store.getState().user;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Utility function to reset entire application state
export const resetApplicationState = () => {
  store.dispatch(clearAllAuthData());
  store.dispatch(forceUserClear());
  store.dispatch(apiSlice.util.resetApiState());
  store.dispatch(applicationsApi.util.resetApiState());
  store.dispatch(riskApi.util.resetApiState());
  store.dispatch(notificationsApi.util.resetApiState());
  store.dispatch(securityApi.util.resetApiState());
  store.dispatch(mlApi.util.resetApiState());
  store.dispatch(registrationApi.util.resetApiState());
};

// Function to check and log current state consistency
export const debugStateConsistency = () => {
  const state = store.getState();
  const { auth, user } = state;




};

export const handleStoreError = (error: any, context: string) => {
  debugStateConsistency();

  // You might want to dispatch an error action or show a user notification
  // store.dispatch(showErrorNotification({ message: 'Something went wrong', context }));
};

// Helper to get current authentication status
export const getCurrentAuthStatus = () => {
  const state = store.getState();
  return {
    isAuthenticated: state.auth.isAuthenticated,
    hasUser: !!state.auth.user,
    hasProfile: !!state.user.profile,
    isConsistent:
      state.auth.isAuthenticated === !!state.auth.user &&
      state.auth.user?.id === state.user.profile?.id,
  };
};
