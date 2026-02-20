const { default: z } = require("zod");

const createNewRouteValidation = z.object({
//   child_id: z.number().min(1, "child_id must be a positive number"),
//   driver_id: z.number().min(1, "driver_id must be a positive number"),
  school_id: z.number().min(1, "school_id must be a positive number"),
  van_id: z.number().min(1, "van_id must be a positive number"),
  longitude: z.number().min(1, "longitude must be a positive number"),
  latitude: z.number().min(1, "latitude must be a positive number"),
  stop_name: z
    .string()
    .min(2, "stop_name must be at least 2 characters")
    .trim(),
});

const updateRouteValidation = z.object({
  longitude: z.number().min(1, "longitude must be a positive number"),
  latitude: z.number().min(1, "latitude must be a positive number"),
});

module.exports = {
  createNewRouteValidation,
  updateRouteValidation,
};
