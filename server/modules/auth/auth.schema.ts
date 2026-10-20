/**
 * FunBet Casino — Auth Validation Schemas (Zod)
 */
import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3, 'Le nom doit contenir au moins 3 caractères.').max(20, 'Le nom est trop long.').regex(/^[a-zA-Z0-9_]+$/, 'Seulement les lettres, chiffres et underscores.'),
  email: z.string().email('Format email invalide.'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').max(128),
  startingBalance: z.number().int().nonnegative().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Le nom d\'utilisateur est requis.'),
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Le token de rafraîchissement est requis.'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis.'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.'),
});

export const updateProfileSchema = z.object({
  paymentMethod: z.string().optional(),
  paymentNumber: z.string().optional(),
  paymentName: z.string().optional(),
  pays: z.string().optional(),
  telephone: z.string().optional(),
});
