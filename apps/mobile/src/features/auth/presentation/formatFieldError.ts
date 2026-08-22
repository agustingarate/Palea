type IssueLike = { code?: unknown; format?: unknown; message?: unknown; minimum?: unknown; maximum?: unknown };

const translatedMessages: Record<string, string> = {
  'password.minLength': 'La contraseña debe tener al menos 8 caracteres.',
  'password.uppercase': 'La contraseña debe incluir una mayúscula.',
  'password.lowercase': 'La contraseña debe incluir una minúscula.',
  'password.number': 'La contraseña debe incluir un número.',
  'password.mismatch': 'Las contraseñas no coinciden.',
  'interests.max': 'Podés seleccionar hasta 3 intereses.',
  'interests.duplicate': 'No podés seleccionar un interés más de una vez.',
  'skills.max': 'Podés seleccionar hasta 10 habilidades.',
  'skills.duplicate': 'No podés seleccionar una habilidad más de una vez.',
  'work.endDateForCurrent': 'No indiques una fecha de fin si actualmente trabajás allí.',
  'work.endBeforeStart': 'La fecha de fin debe ser posterior a la fecha de inicio.',
  'resume.maxSize': 'El archivo supera el tamaño máximo permitido.',
};

function messageFor(error: unknown): string | undefined {
  if (typeof error === 'string') return translatedMessages[error] ?? error;
  if (error instanceof Error) return translatedMessages[error.message] ?? error.message;
  if (!error || typeof error !== 'object') return undefined;
  const issue = error as IssueLike;
  const original = typeof issue.message === 'string' ? issue.message : undefined;
  if (original && translatedMessages[original]) return translatedMessages[original];
  if (issue.code === 'too_small') return typeof issue.minimum === 'number' ? `Ingresá al menos ${issue.minimum} caracteres.` : 'Completá este campo.';
  if (issue.code === 'too_big') return typeof issue.maximum === 'number' ? `Ingresá como máximo ${issue.maximum} caracteres.` : 'El valor es demasiado largo.';
  if (issue.code === 'invalid_type') return 'Completá este campo.';
  if (issue.code === 'invalid_format') {
    if (issue.format === 'email') return 'Ingresá un email válido.';
    if (issue.format === 'date') return 'Ingresá una fecha válida con formato AAAA-MM-DD.';
    return 'El formato ingresado no es válido.';
  }
  if (original?.toLowerCase().includes('email')) return 'Ingresá un email válido.';
  if (original?.toLowerCase().includes('date')) return 'Ingresá una fecha válida con formato AAAA-MM-DD.';
  return 'El valor ingresado no es válido.';
}

export function formatFieldError(errors: readonly unknown[]): string | undefined {
  const messages = errors.map(messageFor).filter((message): message is string => Boolean(message));
  return messages.length ? messages.join(' ') : undefined;
}