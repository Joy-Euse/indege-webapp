import { z } from "zod";
import type { StringKey } from "../i18n/strings";
import {
  DISTRICTS,
  KIGALI_SECTORS,
  MAX_DAYS_AHEAD,
  MAX_DESCRIPTION_LENGTH,
  MAX_DURATION_HOURS,
  MAX_WAGE_RWF,
  MIN_WAGE_RWF,
  OFFERED_CATEGORIES,
} from "./jobs";
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

const DAY_MS = 24 * 60 * 60 * 1000;

function isBookableStart(value: string): boolean {
  const time = new Date(value).getTime();
  return time > Date.now() && time <= Date.now() + MAX_DAYS_AHEAD * DAY_MS;
}

export const jobSchema = z
  .object({
    category: z.enum(OFFERED_CATEGORIES, message("errCategory")),
    description: z
      .string()
      .trim()
      .min(10, message("errDescription"))
      .max(MAX_DESCRIPTION_LENGTH, message("errDescription")),
    district: z.enum(DISTRICTS, message("errDistrict")),
    sector: z.string().min(1, message("errSector")),
    landmark: z.string().trim().min(3, message("errLandmark")).max(120, message("errLandmark")),
    /** The value of a datetime-local input. */
    startsAt: z.string().refine(isBookableStart, message("errStartsAt")),
    durationHours: z
      .number(message("errDuration"))
      .int(message("errDuration"))
      .min(1, message("errDuration"))
      .max(MAX_DURATION_HOURS, message("errDuration")),
    wageRwf: z
      .number(message("errWage"))
      .int(message("errWage"))
      .min(MIN_WAGE_RWF, message("errWage"))
      .max(MAX_WAGE_RWF, message("errWage")),
  })
  .refine((job) => (KIGALI_SECTORS[job.district] as readonly string[]).includes(job.sector), {
    path: ["sector"],
    ...message("errSector"),
  });

export type JobValues = z.infer<typeof jobSchema>;

export const profileSchema = z
  .object({
    fullName: z.string().trim().min(2, message("errName")).max(80, message("errName")),
    bio: z.string().trim().max(300, message("errBio")),
    /** Empty means not set. */
    district: z.union([z.enum(DISTRICTS), z.literal("")]),
    sector: z.string(),
  })
  .refine(
    (profile) =>
      profile.district === ""
        ? profile.sector === ""
        : (KIGALI_SECTORS[profile.district] as readonly string[]).includes(profile.sector),
    { path: ["sector"], ...message("errSector") },
  );

export type ProfileValues = z.infer<typeof profileSchema>;

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().max(254, message("errEmail")).email(message("errEmail")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, message("errPasswordRequired")).max(128, message("errPasswordLong")),
    newPassword: newPasswordField,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    ...message("errPasswordMatch"),
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, message("errPasswordRequired")).max(128, message("errPasswordLong")),
});
