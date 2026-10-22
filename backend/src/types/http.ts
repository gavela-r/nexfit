// types/http.ts
// Envoltura estándar de respuesta de la API NEXFIT.

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
}

export interface ApiErrorBody {
  ok: false;
  error: string;
  details?: string[];
}
