
export interface RegisterRequest {
  /** min 3, max 20 caracteres */
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}


export interface JwtResponse {
  token: string;
  type: string;     
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  active: boolean;
  disabledAt: string | null;  
  createdAt: string;          
  roles: string[];
}
