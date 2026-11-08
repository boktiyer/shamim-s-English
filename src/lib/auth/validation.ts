import { z } from "zod";

/** Bangladeshi mobile number: 01XXXXXXXXX, optionally with +88 / 88 in front. */
const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

// Trim/lowercase first, then validate (so " Name@Mail.com " is accepted).
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(254));

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Enter your full name").max(120),
    email,
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s-]/g, ""))
      .pipe(z.string().regex(BD_PHONE, "Enter a valid Bangladeshi mobile number (e.g. 01712345678)")),
    college: z.string().trim().min(2, "Enter your college name").max(160),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** Shape returned by every auth form action. */
export type FormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Previously entered (non-secret) values, so the form keeps them after an error */
  values?: Record<string, string>;
};
