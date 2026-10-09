export function formatZodError(error: any): string {
  if (error && error.issues && error.issues.length > 0) {
    return error.issues[0].message;
  }
  if (error && error.errors && error.errors.length > 0) {
    return error.errors[0].message;
  }
  return error?.message || 'Invalid request parameters.';
}
