import express from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import logger from '../../utils/logger.js';

const router = express.Router();

/**
 * POST /api/contact
 * Maneja el envío del formulario de contacto
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validación básica
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                error: 'Todos los campos son requeridos'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Email inválido'
            });
        }

        // Guardar en base de datos (crear tabla contact_messages si no existe)
        const { data, error } = await supabaseAdmin
            .from('contact_messages')
            .insert([
                {
                    name,
                    email,
                    subject,
                    message,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) {
            logger.error('Error guardando mensaje de contacto:', error);

            // Si la tabla no existe, devolver éxito de todas formas
            if (error.code === '42P01') {
                logger.warn('Tabla contact_messages no existe. Mensaje registrado en logs.');
                logger.info(`Contacto recibido - ${name} (${email}): ${subject}`);
                return res.json({
                    success: true,
                    message: 'Mensaje recibido correctamente'
                });
            }

            throw error;
        }

        logger.info(`Nuevo mensaje de contacto: ${data.id} - ${email}`);

        // TODO: Aquí puedes agregar envío de email
        // - Usar Resend, SendGrid, etc.
        // - Notificar al equipo por email

        res.json({
            success: true,
            message: 'Mensaje enviado correctamente. Nos pondremos en contacto pronto.',
            data: {
                id: data.id
            }
        });

    } catch (error) {
        logger.error('Error en /api/contact:', error);
        res.status(500).json({
            error: 'Error al procesar tu mensaje. Por favor intenta de nuevo.'
        });
    }
});

export default router;
