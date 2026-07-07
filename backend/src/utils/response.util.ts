export const formatSuccess = (data: unknown, message = 'Success') => ({
  success: true,
  message,
  data,
});

export const formatError = (message: string, statusCode = 400) => ({
  success: false,
  message,
  statusCode,
});
