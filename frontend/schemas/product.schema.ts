import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  sku: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  base_price: z.coerce.number().min(0, 'Prix invalide').default(0),
  sale_price: z.coerce.number().min(0.01, 'Le prix de vente doit être supérieur à 0'),
  stock: z.coerce.number().int().min(0, 'Stock invalide').default(0),
  category: z.union([
    z.coerce.number(),
    z.literal(''),
    z.null(),
    z.undefined(),
  ]).optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
});

export type ProductFormData = z.infer<typeof productSchema>;
// Valeurs brutes du formulaire, avant coercition par zod
export type ProductFormInput = z.input<typeof productSchema>;