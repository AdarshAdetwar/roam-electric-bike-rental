function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'The requested endpoint was not found.' } });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) ? error.status : 500;
  const code = error.code || 'INTERNAL_ERROR';
  if (status >= 500) console.error(error);
  const message = status === 500 ? 'An unexpected error occurred.' : error.message;
  res.status(status).json({ error: { code, message } });
}

module.exports = { notFound, errorHandler };
