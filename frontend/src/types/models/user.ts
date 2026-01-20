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
  created_at: string;
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
  access_token: string;
  token_type: string;
  user_email: string;
  is_internal: boolean;
  is_admin: boolean;
  requires_totp?: boolean;
  session_token?: string;
}

