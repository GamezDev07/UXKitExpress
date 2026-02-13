const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { supabase } = require('../../config/supabase');
const bcrypt = require('bcrypt');

// Get user favorites
router.get('/favorites', authMiddleware, async (req, res) => {
    try {
        const { data: favorites, error } = await supabase
            .from('favorites')
            .select(`
        *,
        pack:packs(*)
      `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ favorites });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ message: 'Failed to fetch favorites' });
    }
});

// Add to favorites
router.post('/favorites', authMiddleware, async (req, res) => {
    try {
        const { pack_id } = req.body;

        // Check if already favorited
        const { data: existing } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('pack_id', pack_id)
            .single();

        if (existing) {
            return res.status(400).json({ message: 'Already in favorites' });
        }

        const { data: favorite, error } = await supabase
            .from('favorites')
            .insert([
                {
                    user_id: req.user.id,
                    pack_id
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ favorite });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ message: 'Failed to add favorite' });
    }
});

// Remove from favorites
router.delete('/favorites/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id); // Ensure user owns this favorite

        if (error) throw error;

        res.json({ message: 'Removed from favorites' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ message: 'Failed to remove favorite' });
    }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { full_name } = req.body;

        // Update in Supabase Auth user metadata
        const { data, error } = await supabase.auth.admin.updateUserById(
            req.user.id,
            {
                user_metadata: { full_name }
            }
        );

        if (error) throw error;

        res.json({ message: 'Profile updated', user: data.user });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

// Update password
router.put('/password', authMiddleware, async (req, res) => {
    try {
        const { new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Update password in Supabase Auth
        const { error } = await supabase.auth.admin.updateUserById(
            req.user.id,
            { password: new_password }
        );

        if (error) throw error;

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Failed to update password' });
    }
});

module.exports = router;
