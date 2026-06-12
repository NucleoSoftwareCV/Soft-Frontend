// ============================================================
// Mapeado desde: RegisterRequest.java
// POST /api/v1/auth/register
// ============================================================
export interface RegisterRequest {
  /** min 3, max 20 caracteres */
  username: string;
  /** max 50 caracteres, formato email */
  email: string;
  /** min 6, max 40 caracteres */
  password: string;
}

// ============================================================
// Mapeado desde: LoginRequest.java
// POST /api/v1/auth/login
// ============================================================
export interface LoginRequest {
  username: string;
  password: string;
}

// ============================================================
// Mapeado desde: JwtResponse.java
// Respuesta del login — type siempre es "Bearer"
// ============================================================
export interface JwtResponse {
  token: string;
  type: string;       // siempre "Bearer"
  id: number;
  username: string;
  email: string;
  roles: string[];
}

// ============================================================
// Mapeado desde: UserDTO.java
// Respuesta del register — LocalDateTime llega como string ISO
// ============================================================
export interface UserDTO {
  id: number;
  username: string;
  email: string;
  active: boolean;
  disabledAt: string | null;   // LocalDateTime → ISO string
  createdAt: string;           // LocalDateTime → ISO string
  roles: string[];
}
