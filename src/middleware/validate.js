import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
      return next(new ApiError(400, "Validation failed", errorMessages));
    }

    // Assign sanitized data back where permitted
    if (parsed.data.body) req.body = parsed.data.body;
    if (parsed.data.query && req.query) {
      Object.assign(req.query, parsed.data.query);
    }
    if (parsed.data.params && req.params) {
      Object.assign(req.params, parsed.data.params);
    }

    next();
  } catch (error) {
    next(error);
  }
};
