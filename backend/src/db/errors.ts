// db/errors.ts
// Traducción de los errores de MySQL a casos de negocio conocidos.

interface MysqlError {
  code?: string;
  errno?: number;
  message?: string;
}

function asMysqlError(error: unknown): MysqlError {
  return (error ?? {}) as MysqlError;
}

/** Correo, favorito o línea duplicada (UNIQUE). */
export function isDuplicateEntry(error: unknown): boolean {
  return asMysqlError(error).code === "ER_DUP_ENTRY";
}

/** La fila referenciada no existe (clave foránea). */
export function isForeignKeyError(error: unknown): boolean {
  const code = asMysqlError(error).code;
  return code === "ER_NO_REFERENCED_ROW_2" || code === "ER_NO_REFERENCED_ROW";
}

/** La fila aún tiene referencias (no se puede borrar). */
export function isStillReferencedError(error: unknown): boolean {
  const code = asMysqlError(error).code;
  return code === "ER_ROW_IS_REFERENCED_2" || code === "ER_ROW_IS_REFERENCED";
}
