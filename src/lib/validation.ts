import { z } from "zod";
import type { StringKey } from "../i18n/strings";
import { isValidPhone } from "./phone";

/** Schema messages are keys into strings.ts, so errors can show in both languages. */
const message = (key: StringKey) => ({ message: key });

export const phoneField = z.string().refine(isValidPhone, message("errPhone"));

export const newPasswordField = z
  .string()
  .min(8, message("errPasswordShort"))
  .max(128, message("errPasswordLong"));

export const codeField = z.string().regex(/^\d{6}$/, message("errCode"));

export const loginSchema = z.object({
  phone: phoneField,
  password: z.string().min(1, message("errPasswordRequired")).max(128, message("errPasswordLong")),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, message("errName")).max(80, message("errName")),
  phone: phoneField,
  password: newPasswordField,
  role: z.enum(["CUSTOMER", "WORKER", "BOTH"], message("errRole")),
  acceptTerms: z.literal(true, message("errTerms")),
});

export const verifySchema = z.object({ code: codeField });

export const forgotSchema = z.object({ phone: phoneField });

export const resetSchema = z.object({ code: codeField, newPassword: newPasswordField });
