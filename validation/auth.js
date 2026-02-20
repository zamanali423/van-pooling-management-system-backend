const { z } = require("zod");

const registerAuth = z.object({
  full_name: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .trim(),
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password Must contain one uppercase letter")
    .regex(/[0-9]/, "Password Must contain one number"),
  phone: z
    .number()
    .min(10, "Phone must be at least 10 characters"),
  role: z.enum(['ADMIN','DRIVER','PARENT','GUARD','SCHOOL'], {
    errorMap: (issue) => ({
      message: "Role must be ADMIN, DRIVER, PARENT, GUARD, or SCHOOL"
    })
  }),
});

const loginAuth = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

module.exports = {
  registerAuth,
  loginAuth,
};
