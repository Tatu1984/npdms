import { z } from 'zod';

// Common patterns
export const phoneRegex = /^[6-9]\d{9}$/;
export const aadharRegex = /^\d{12}$/;
export const pinCodeRegex = /^\d{6}$/;

// Sanitization helpers
export const sanitizeString = (str: string): string => {
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove potential XSS characters
    .trim();
};

// Helper for creating sanitized string schemas with validation
export const sanitizedText = (minLength = 0, maxLength = Infinity, message?: string) =>
  z.string()
    .min(minLength, message || `Must be at least ${minLength} characters`)
    .max(maxLength)
    .transform(sanitizeString);

// ============================================
// Auth Schemas
// ============================================
export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ============================================
// Person Schemas
// ============================================
export const addressSchema = z.object({
  street: sanitizedText(1, 200, 'Street address is required'),
  city: sanitizedText(1, 100, 'City is required'),
  district: sanitizedText(1, 100, 'District is required'),
  state: sanitizedText(1, 100, 'State is required'),
  pinCode: z.string().regex(pinCodeRegex, 'Invalid PIN code (must be 6 digits)'),
});

export const personSchema = z.object({
  name: sanitizedText(2, 100, 'Name must be at least 2 characters'),
  phone: z.string().regex(phoneRegex, 'Invalid phone number (10 digits starting with 6-9)').optional(),
  address: addressSchema.optional(),
});
