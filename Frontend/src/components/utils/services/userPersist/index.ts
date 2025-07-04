import type { RootState } from "../../../redux/store";

export const loadUserState = (): RootState["user"] => {
  try {
    const serializedState = localStorage.getItem("userState");
    if (!serializedState)
      return {
        profile: null,
        isLoading: false,
        error: null,
        lastUpdated: null,
        preferences: {
          theme: "light",
          language: "en",
          notifications: true,
        },
      };

    const parsed = JSON.parse(serializedState);
    console.log("Loaded user state:", parsed);
    return parsed;
  } catch (err) {
    console.error("Error loading user state:", err);
    return {
      profile: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
      preferences: {
        theme: "light",
        language: "en",
        notifications: true,
      },
    };
  }
};

export const saveUserState = (state: RootState["user"]) => {
  try {
    const toPersist = {
      profile: state.profile,
      isLoading: false,
      error: null,
      lastUpdated: state.lastUpdated,
      preferences: state.preferences,
    };
    console.log("Saving user state:", toPersist);
    localStorage.setItem("userState", JSON.stringify(toPersist));
  } catch (err) {
    console.error("Error saving user state:", err);
  }
};

export const clearUserState = () => {
  try {
    localStorage.removeItem("userState");
  } catch {
    // ignore errors
  }
};
