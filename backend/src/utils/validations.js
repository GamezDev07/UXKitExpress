import { z } from 'zod';

export const userSchemas = {
  register: z.object({
    email: z.string()
      .email('Email inválido')
      .toLowerCase()
      .trim(),
    password: z.string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
    fullName: z.string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre es demasiado largo')
      .trim()
  }),

  login: z.object({
    email: z.string()
      .email('Email inválido')
      .toLowerCase()
      .trim(),
    password: z.string()
      .min(1, 'La contraseña es requerida')
  })
};

export const billingSchemas = {
  checkout: z.object({
    plan: z.enum(['basic', 'advance', 'pro', 'enterprise'], {
      errorMap: () => ({ message: 'Plan inválido' })
    }),
    billingInterval: z.enum(['monthly', 'yearly'], {
      errorMap: () => ({ message: 'Intervalo de facturación inválido' })
    }),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional()
  })
};

// Middleware para validar con Zod
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: error.errors
      });
    }
  };
};
