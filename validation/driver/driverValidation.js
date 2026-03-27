const { default: z } = require("zod");

const createNewRouteValidation = z.object({
  //   child_id: z.number().min(1, "child_id must be a positive number"),
  //   driver_id: z.number().min(1, "driver_id must be a positive number"),
  // school_id: z.number().min(1, "school_id must be a positive number"),
  // longitude: z.coerce.number().min(1, "longitude must be a positive number"),
  // latitude: z.coerce.number().min(1, "latitude must be a positive number"),
  pickup_address: z
    .string()
    .min(2, "stop_name must be at least 2 characters")
    .trim(),
  van_id: z.coerce.number().min(1, "van_id must be a positive number"),
  stops: z.array(
    z.object({
      lat: z.coerce.number().min(1, "latitude must be a positive number"),
      lng: z.coerce
        .number()
        .min(1, "longitude must be a positive number"),
    })
  ),
});

const updateRouteValidation = z.object({
  lng: z.coerce
    .number()
    .min(1, "longitude must be a positive number")
    .optional(),
  lat: z.coerce
    .number()
    .min(1, "latitude must be a positive number")
    .optional(),
});

module.exports = {
  createNewRouteValidation,
  updateRouteValidation,
};
