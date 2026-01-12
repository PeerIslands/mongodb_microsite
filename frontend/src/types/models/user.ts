export interface User {
  id: string;
  first_name: string;
  last_name: string;
  user_email: string;
  is_internal: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface CreateUserDto {
  first_name: string;
  last_name: string;
  user_email: string;
  user_password: string;
}

export interface LoginDto {
  user_email: string;
  user_password: string;
}

export interface SignupResponse {
  user_id: string;
  is_internal: boolean;
  message: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_email: string;
  is_internal: boolean;
  is_admin: boolean;
}

