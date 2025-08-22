export interface UserRole {
  id: number;
  name: string;
}

export interface BaseUser {
  id: number;
  email: string;
  name: string;
  role: string;
  first_name?: string;
  last_name?: string;
  user_type?: string;
  phone_number?: string;
  is_verified: boolean;
  mfa_enabled: boolean;
  mfa_fully_configured: boolean;
  roles: UserRole[];
  permissions: string[];
  date_joined?: string;
  last_login?: string | null;
}

export interface AuthUser extends BaseUser {}

export interface UserProfile extends BaseUser {
  full_name: string;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  company?: string;
  job_title?: string;
  department?: string;
  bio?: string;
  timezone?: string;
  // Enhanced fields for credit risk assessment
  phone_secondary?: string;
  address?: string;
  date_of_birth?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface CompleteUser extends BaseUser {
  full_name?: string;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  company?: string;
  job_title?: string;
  department?: string;
  bio?: string;
  timezone?: string;
  // Enhanced fields for credit risk assessment
  phone_secondary?: string;
  address?: string;
  date_of_birth?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface LoginResponse {
  refresh: string;
  access: string;
  user: AuthUser;
  token_type: string;
  requires_mfa_setup: boolean;
  requires_mfa?: boolean;
  message?: string;
  limited_access?: boolean;
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
  ghana_card_number: string;
  ghana_card_front_image: File;
  ghana_card_back_image: File;
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
  name: backendUser.name || `${backendUser.first_name || ''} ${backendUser.last_name || ''}`.trim(),
  role: backendUser.role || 'CLIENT',
  first_name: backendUser.first_name || '',
  last_name: backendUser.last_name || '',
  user_type: backendUser.user_type || backendUser.role || 'CLIENT',
  phone_number: backendUser.phone_number,
  is_verified: backendUser.is_verified || false,
  mfa_enabled: backendUser.mfa_enabled || false,
  mfa_fully_configured: backendUser.mfa_fully_configured || false,
  roles: backendUser.roles || [],
  permissions: backendUser.permissions || [],
  date_joined: backendUser.date_joined || new Date().toISOString(),
  last_login: backendUser.last_login || null,
});

export const transformUserProfile = (backendProfile: any): UserProfile => ({
  id: backendProfile.id,
  email: backendProfile.email,
  name: backendProfile.name || `${backendProfile.first_name || ''} ${backendProfile.last_name || ''}`.trim(),
  role: backendProfile.role || 'CLIENT',
  first_name: backendProfile.first_name || '',
  last_name: backendProfile.last_name || '',
  full_name: backendProfile.full_name || `${backendProfile.first_name || ''} ${backendProfile.last_name || ''}`.trim(),
  user_type: backendProfile.user_type || backendProfile.role || 'CLIENT',
  phone_number: backendProfile.phone_number,
  is_verified: backendProfile.is_verified || false,
  mfa_enabled: backendProfile.mfa_enabled || false,
  mfa_fully_configured: backendProfile.mfa_fully_configured || false,
  roles: backendProfile.roles || [],
  permissions: backendProfile.permissions || [],
  profile_picture: backendProfile.profile_picture,
  profile_picture_url: backendProfile.profile_picture_url,
  company: backendProfile.company,
  job_title: backendProfile.job_title,
  department: backendProfile.department,
  bio: backendProfile.bio,
  timezone: backendProfile.timezone,
  // Enhanced fields for credit risk assessment
  phone_secondary: backendProfile.phone_secondary,
  address: backendProfile.address,
  date_of_birth: backendProfile.date_of_birth,
  linkedin_url: backendProfile.linkedin_url,
  portfolio_url: backendProfile.portfolio_url,
  emergency_contact_name: backendProfile.emergency_contact_name,
  emergency_contact_phone: backendProfile.emergency_contact_phone,
  date_joined: backendProfile.date_joined || new Date().toISOString(),
  last_login: backendProfile.last_login || null,
});

export const combineUserData = (
  authUser: AuthUser,
  userProfile: UserProfile
): CompleteUser => ({
  ...authUser,
  ...userProfile,
  name: authUser.name || userProfile.full_name || '',
  full_name: userProfile.full_name || authUser.name,
});

// Role and permission type definitions for better type safety
export type UserRoleType = 'ADMIN' | 'CLIENT' | 'ANALYST' | 'AUDITOR' | 'MANAGER';
export type TokenType = 'full_access' | 'mfa_setup' | 'limited';

// Enhanced login response with MFA states
export interface EnhancedLoginResponse extends LoginResponse {
  token_type: TokenType;
  requires_mfa_setup: boolean;
  limited_access?: boolean;
}

// Utility function to determine if user needs MFA setup
export const needsMfaSetup = (response: LoginResponse): boolean => {
  return response.requires_mfa_setup === true || response.token_type === 'mfa_setup';
};

// Utility function to check if user has limited access
export const hasLimitedAccess = (response: LoginResponse): boolean => {
  return (response as EnhancedLoginResponse).limited_access === true;
};

// Utility function to extract user permissions
export const getUserPermissions = (user: AuthUser): string[] => {
  return user.permissions || [];
};

// Utility function to extract user role names
export const getUserRoleNames = (user: AuthUser): string[] => {
  return user.roles?.map(role => role.name) || [];
};
