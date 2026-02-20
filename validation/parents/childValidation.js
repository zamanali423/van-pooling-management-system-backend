const { z } = require("zod");

const childValidation = z.object({
  full_name: z.string().min(2).trim(),

  date_of_birth: z.coerce.date(),

  gender: z
    .string()
    .transform((v) => v.toLowerCase())
    .refine((v) => ["male", "female"].includes(v), {
      message: "Gender must be male or female",
    }),

  grade: z.string().min(1).trim(),

  disease: z.string().trim().max(255).optional().or(z.literal("")),

  emergency_contact: z
    .string()
    .regex(/^\d+$/)
    .min(10)
    .optional()
    .or(z.literal("")),

  school_id: z.coerce.number().min(1),
  
  requires_girls_only: z.boolean().optional().or(z.literal("true")).or(z.literal("false")).or(z.literal(true)).or(z.literal(false)),
});

const childUpdate = z.object({
  full_name: z.string().min(2).trim().optional(),

  date_of_birth: z.coerce.date().optional(),

  gender: z
    .string()
    .transform((v) => v.toLowerCase())
    .refine((v) => ["male", "female"].includes(v), {
      message: "Gender must be male or female",
    })
    .optional(),

  grade: z.string().min(1).trim().optional(),

  disease: z.string().trim().max(255).optional().or(z.literal("")),

  emergency_contact: z
    .string()
    .regex(/^\d+$/)
    .min(10)
    .optional()
    .or(z.literal("")),

  school_id: z.coerce.number().min(1).optional(),
  
  requires_girls_only: z.boolean().optional().or(z.literal("true")).or(z.literal("false")).or(z.literal(true)).or(z.literal(false)).optional(),
});

module.exports = {
  childValidation,
  childUpdate,
};
