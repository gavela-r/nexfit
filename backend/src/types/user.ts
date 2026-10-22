// types/user.ts
// Modelos de usuario y sesión de la autenticación NEXFIT.

/** Vista pública del usuario: el hash de la contraseña nunca sale del servidor. */
export interface UserView {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

/** Registro completo en memoria: vista pública + credencial. */
export interface UserRecord extends UserView {
  passwordHash: string;
}

/** Respuesta de un alta o de un inicio de sesión correctos. */
export interface AuthPayload {
  user: UserView;
  token: string;
}
