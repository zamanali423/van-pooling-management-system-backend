const { ZodError } = require('zod');

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      let issues = [];
      if (Array.isArray(error)) {
        issues = error;
      } else if (error instanceof ZodError) {
        issues = error.issues || [];
      } else if (error && Array.isArray(error.errors)) {
        issues = error.errors;
      } else if (error && Array.isArray(error.issues)) {
        issues = error.issues;
      }

      if (issues.length > 0) {
        const errors = issues.map((err) => {
          const field = Array.isArray(err.path) ? err.path.join('.') : (err.path || 'body');
          const message = err.message || 'Invalid value';
          return { field, message };
        });

        return res.status(400).json({ message: 'Validation Error', errors });
      }

      // Fallback for unexpected errors
      console.error('Validation middleware error:', error);
      return res.status(400).json({
        message: 'Validation Error',
        errors: [{ field: 'body', message: error && error.message ? error.message : 'Invalid request' }],
      });
    }
  };
};

errorMiddleware = (err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
};

routeNotFoundMiddleware = (req, res, next) => {
  res.status(404).json({ message: "Route not found" });
};

isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};


module.exports = {
  validateRequest,
  errorMiddleware,
  routeNotFoundMiddleware,
  isAdmin
};
