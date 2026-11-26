exports.notFound = (req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: `No route for ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const fields = Object.fromEntries(
      Object.entries(err.errors).map(([key, value]) => [key, value.message])
    );
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid input.', fields });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: 'DUPLICATE', message: 'That record already exists.' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'BAD_ID', message: 'Invalid identifier.' });
  }

  res.status(500).json({ error: 'SERVER_ERROR', message: 'Something went wrong.' });
};
