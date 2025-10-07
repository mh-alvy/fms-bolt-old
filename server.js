import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});

console.log('Backend API server starting...');
console.log('Supabase URL:', supabaseUrl);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend API is running' });
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, username, email, role, password_hash')
            .eq('username', username)
            .maybeSingle();

        if (userError) {
            console.error('Database error during login:', userError);
            return res.status(500).json({
                success: false,
                message: 'Login failed. Please try again.'
            });
        }

        if (!users) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const { data: verificationResult, error: verifyError } = await supabase
            .rpc('verify_password', {
                password: password,
                password_hash: users.password_hash
            });

        if (verifyError) {
            console.error('Password verification error:', verifyError);
            return res.status(500).json({
                success: false,
                message: 'Login failed. Please try again.'
            });
        }

        if (!verificationResult) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const userWithoutHash = {
            id: users.id,
            username: users.username,
            email: users.email,
            role: users.role
        };

        res.json({ success: true, user: userWithoutHash });
    } catch (error) {
        console.error('Login exception:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

app.post('/api/auth/check-session', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID required' });
        }

        const { data: userData, error } = await supabase
            .from('users')
            .select('id, username, email, role')
            .eq('id', userId)
            .maybeSingle();

        if (error || !userData) {
            return res.status(401).json({ success: false, message: 'Invalid session' });
        }

        res.json({ success: true, user: userData });
    } catch (error) {
        console.error('Session check error:', error);
        res.status(500).json({ success: false, message: 'Session check failed' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, email, role')
            .order('username');

        if (error) {
            console.error('Get users error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch users' });
        }

        res.json({ success: true, users: users || [] });
    } catch (error) {
        console.error('Get users exception:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, and role are required'
            });
        }

        const { data: existingUsers } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .maybeSingle();

        if (existingUsers) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        const email = `${username}@breakthefear.local`;

        const { data: hashedPassword, error: hashError } = await supabase
            .rpc('hash_password', { password: password });

        if (hashError || !hashedPassword) {
            console.error('Password hashing error:', hashError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create user'
            });
        }

        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
                username: username,
                email: email,
                role: role,
                password_hash: hashedPassword
            }])
            .select('id, username, email, role')
            .single();

        if (insertError) {
            console.error('User insert error:', insertError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create user'
            });
        }

        res.json({ success: true, user: newUser });
    } catch (error) {
        console.error('Create user exception:', error);
        res.status(500).json({ success: false, message: 'Failed to create user' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data: existingUser } = await supabase
            .from('users')
            .select('id, username, email, role')
            .eq('id', id)
            .maybeSingle();

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (updates.username && updates.username !== existingUser.username) {
            const { data: duplicateCheck } = await supabase
                .from('users')
                .select('username')
                .eq('username', updates.username)
                .neq('id', id)
                .maybeSingle();

            if (duplicateCheck) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }
        }

        const updateData = {};
        if (updates.username) updateData.username = updates.username;
        if (updates.email) updateData.email = updates.email;
        if (updates.role) updateData.role = updates.role;

        if (updates.password) {
            const { data: hashedPassword, error: hashError } = await supabase
                .rpc('hash_password', { password: updates.password });

            if (hashError || !hashedPassword) {
                console.error('Password hashing error:', hashError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update password'
                });
            }

            updateData.password_hash = hashedPassword;
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select('id, username, email, role')
            .single();

        if (error) {
            console.error('Update user error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update user'
            });
        }

        res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Update user exception:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'developer') {
            const { data: developers } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'developer');

            if (developers && developers.length <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete the last developer account'
                });
            }
        }

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete user error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete user'
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete user exception:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend API server running on port ${PORT}`);
});
