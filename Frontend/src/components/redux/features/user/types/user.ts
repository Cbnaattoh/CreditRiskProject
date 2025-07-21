export interface BaseUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  phone_number?: string;
  is_verified: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface AuthUser extends BaseUser {
  name: string;
  mfa_enabled: boolean;
  mfa_fully_configured: boolean;
}

export interface UserProfile extends BaseUser {
  full_name: string;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  company?: string;
  job_title?: string;
  department?: string;
  bio?: string;
  timezone?: string;
}

export interface CompleteUser extends BaseUser {
  name: string;
  full_name: string;
  mfa_enabled: boolean;
  mfa_fully_configured: boolean;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  company?: string;
  job_title?: string;
  department?: string;
  bio?: string;
  timezone?: string;
}

export interface LoginResponse {
  refresh: string;
  access: string;
  user: AuthUser;

  requires_mfa?: boolean;
  temp_token?: string;
  uid?: string;

  requires_password_change?: boolean;
  password_expired?: boolean;
}

export interface MFARequiredResponse {
  requires_mfa: true;
  temp_token: string;
  uid: string;
  user: AuthUser;
  message: string;
}

export interface UserProfileResponse extends UserProfile {}

export interface LoginHistoryEntry {
  id: string;
  user_email: string;
  ip_address: string;
  user_agent: string;
  login_timestamp: string;
  was_successful: boolean;
  session_duration: string | null;
}

export interface LoginHistoryResponse {
  count: number;
  next?: string;
  previous?: string;
  results: LoginHistoryEntry[];
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  password: string;
  confirm_password: string;
  user_type: string;
  profile_picture?: File;
  mfa_enabled?: boolean;
  terms_accepted: boolean;
}

export interface RegisterResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  is_verified: boolean;
  access?: string;
  refresh?: string;
  message?: string;
  errors?: Record<string, string[]>;
  requiresVerification?: boolean;
}

export interface MFACredentials {
  uid: string;
  temp_token: string;
  token: string;
  backup_code?: string;
}

export interface MFASetupRequest {
  enable: boolean;
  backup_codes_acknowledged?: boolean;
}

export interface MFASetupResponse {
  status: string;
  secret?: string;
  uri?: string;
  backup_codes?: string[];
  message?: string;
}

export interface MFAVerifyResponse {
  user: AuthUser;
  access: string;
  refresh: string;
  mfa_verified: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Helper functions for data transformation
export const transformAuthUser = (backendUser: any): AuthUser => ({
  id: backendUser.id,
  email: backendUser.email,
  first_name: backendUser.first_name || "",
  last_name: backendUser.last_name || "",
  name:
    backendUser.name ||
    `${backendUser.first_name} ${backendUser.last_name}`.trim(),
  user_type: backendUser.role || backendUser.user_type || "USER",
  phone_number: backendUser.phone_number,
  is_verified: backendUser.is_verified || false,
  mfa_enabled: backendUser.mfa_enabled || false,
  mfa_fully_configured: backendUser.mfa_fully_configured || false,
  date_joined: backendUser.date_joined || new Date().toISOString(),
  last_login: backendUser.last_login || null,
});

export const transformUserProfile = (backendProfile: any): UserProfile => ({
  id: backendProfile.id,
  email: backendProfile.email,
  first_name: backendProfile.first_name || "",
  last_name: backendProfile.last_name || "",
  full_name:
    backendProfile.full_name ||
    `${backendProfile.first_name} ${backendProfile.last_name}`.trim(),
  user_type: backendProfile.user_type || "USER",
  phone_number: backendProfile.phone_number,
  is_verified: backendProfile.is_verified || false,
  profile_picture: backendProfile.profile_picture,
  profile_picture_url: backendProfile.profile_picture_url,
  company: backendProfile.company,
  job_title: backendProfile.job_title,
  department: backendProfile.department,
  bio: backendProfile.bio,
  timezone: backendProfile.timezone,
  date_joined: backendProfile.date_joined || new Date().toISOString(),
  last_login: backendProfile.last_login || null,
});

export const combineUserData = (
  authUser: AuthUser,
  userProfile: UserProfile
): CompleteUser => ({
  ...authUser,
  ...userProfile,
  name: authUser.name || userProfile.full_name,
  full_name: userProfile.full_name || authUser.name,
});
