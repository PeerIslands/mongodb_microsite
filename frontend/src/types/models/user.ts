export interface User {
  id: string;
  first_name: string;
  last_name: string;
  user_email: string;
  company: string;
  job_function: string;
  business_phone: string;
  country: string;
  is_internal: boolean;
  is_admin: boolean;
  totp_enabled: boolean;
  registration_status: 'pending_mfa' | 'completed';
  account_active: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  original_email?: string;
  created_at: string;
  registration_completed_at?: string;
}

export interface UserStats {
  total: number;
  admin: number;
  internal: number;
  external: number;
  active: number;
  pending_mfa: number;
  completed: number;
  deleted: number;
}

export interface GetUsersResponse {
  total_users: number;
  filtered_count: number;
  stats: UserStats;
  users: User[];
}

export interface CreateUserDto {
  first_name: string;
  last_name: string;
  user_email: string;
  user_password: string;
  company: string;
  job_function: string;
  business_phone: string;
  country: string;
}

export interface LoginDto {
  user_email: string;
  user_password: string;
}

export interface TOTPSetup {
  secret: string;
  qr_code: string;
  manual_entry_key: string;
  issuer: string;
  account_name: string;
  otpauth_url: string;
}

export interface SignupResponse {
  user_id: string;
  is_internal: boolean;
  message: string;
  totp_setup: TOTPSetup;
}

export interface LoginResponse {
  success?: boolean;
  access_token?: string;
  token_type?: string;
  user_email?: string;
  is_internal?: boolean;
  is_admin?: boolean;
  requires_totp?: boolean;
  session_token?: string;
  registration_incomplete?: boolean;
  registration_status?: string;
  redirect_to?: string;
  message?: string;
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  user_email: string;
  company: string;
  job_function: string;
  business_phone: string;
  country: string;
  is_admin: boolean;
  totp_enabled: boolean;
  registration_completed_at: string | null;
  created_at: string;
}

export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  company?: string;
  job_function?: string;
  business_phone?: string;
  country?: string;
}
