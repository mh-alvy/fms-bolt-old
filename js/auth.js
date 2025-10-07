class AuthManager {
    constructor() {
        this.currentUser = null;
        this.maxLoginAttempts = 5;
        this.loginAttempts = this.loadLoginAttempts();
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        this.initialized = true;
        await this.checkSession();
    }

    async checkSession() {
        try {
            const sessionData = localStorage.getItem('btf_user_session');

            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                const sessionAge = Date.now() - parsed.timestamp;
                const maxSessionAge = 24 * 60 * 60 * 1000;

                if (sessionAge < maxSessionAge && parsed.user) {
                    const supabaseUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
                    const verifyUrl = `${supabaseUrl}/functions/v1/auth/verify-session`;

                    const response = await fetch(verifyUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ userId: parsed.user.id })
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        this.currentUser = result.user;
                    } else {
                        localStorage.removeItem('btf_user_session');
                    }
                } else {
                    localStorage.removeItem('btf_user_session');
                }
            }
        } catch (error) {
            console.error('Error checking session:', error);
            localStorage.removeItem('btf_user_session');
        }
    }

    loadLoginAttempts() {
        try {
            return JSON.parse(localStorage.getItem('btf_login_attempts') || '{}');
        } catch (e) {
            return {};
        }
    }

    saveLoginAttempts() {
        localStorage.setItem('btf_login_attempts', JSON.stringify(this.loginAttempts));
    }

    isAccountLocked(username) {
        const attempts = this.loginAttempts[username];
        if (!attempts) return false;

        const now = Date.now();
        const lockoutTime = 15 * 60 * 1000;

        if (attempts.count >= this.maxLoginAttempts) {
            if (now - attempts.lastAttempt < lockoutTime) {
                return true;
            }
            delete this.loginAttempts[username];
            this.saveLoginAttempts();
        }
        return false;
    }

    recordLoginAttempt(username, success) {
        if (success) {
            delete this.loginAttempts[username];
        } else {
            if (!this.loginAttempts[username]) {
                this.loginAttempts[username] = { count: 0, lastAttempt: 0 };
            }
            this.loginAttempts[username].count++;
            this.loginAttempts[username].lastAttempt = Date.now();
        }
        this.saveLoginAttempts();
    }

    async login(username, password) {
        try {
            console.log('=== LOGIN ATTEMPT ===');
            console.log('Username:', username);

            if (this.isAccountLocked(username)) {
                console.log('Account is locked');
                return {
                    success: false,
                    message: 'Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.'
                };
            }

            console.log('Authenticating via edge function...');
            const supabaseUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
            const authUrl = `${supabaseUrl}/functions/v1/auth/login`;

            const response = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                console.log('Authentication failed:', result.message);
                this.recordLoginAttempt(username, false);
                return { success: false, message: result.message || 'Invalid credentials' };
            }

            const user = result.user;
            console.log('Login successful!');
            this.recordLoginAttempt(username, true);

            this.currentUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            };

            localStorage.setItem('btf_user_session', JSON.stringify({
                user: this.currentUser,
                timestamp: Date.now()
            }));

            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('=== LOGIN EXCEPTION ===');
            console.error('Error:', error);
            this.recordLoginAttempt(username, false);
            return { success: false, message: 'Login failed. Please check your connection and try again.' };
        }
    }

    async logout() {
        try {
            localStorage.removeItem('btf_user_session');
            this.currentUser = null;
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    hasPermission(requiredRoles) {
        if (!this.currentUser) return false;
        if (!requiredRoles || requiredRoles.length === 0) return true;
        return requiredRoles.includes(this.currentUser.role);
    }

    async addUser(username, password, role, email) {
        try {
            if (!email) {
                email = `${username}@breakthefear.local`;
            }

            const passwordHash = await this.hashPassword(password);

            const { data, error } = await window.supabase
                .from('users')
                .insert([{
                    username,
                    email,
                    role,
                    password_hash: passwordHash
                }])
                .select()
                .single();

            if (error) {
                console.error('Add user error:', error);
                if (error.code === '23505') {
                    return { success: false, message: 'Username already exists' };
                }
                return { success: false, message: 'Failed to add user' };
            }

            const { password_hash, ...userWithoutHash } = data;
            return { success: true, user: userWithoutHash };
        } catch (error) {
            console.error('Add user error:', error);
            return { success: false, message: 'Failed to add user' };
        }
    }

    async hashPassword(password) {
        const { data, error } = await window.supabase
            .rpc('hash_password', { password });

        if (error) {
            throw new Error('Failed to hash password');
        }

        return data;
    }

    async updateUser(id, updates) {
        try {
            const updateData = {};

            if (updates.username) updateData.username = updates.username;
            if (updates.email) updateData.email = updates.email;
            if (updates.role) updateData.role = updates.role;

            if (updates.password) {
                updateData.password_hash = await this.hashPassword(updates.password);
            }

            const { data, error } = await window.supabase
                .from('users')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Update user error:', error);
                if (error.code === '23505') {
                    return { success: false, message: 'Username already exists' };
                }
                return { success: false, message: 'Failed to update user' };
            }

            const { password_hash, ...userWithoutHash } = data;
            return { success: true, user: userWithoutHash };
        } catch (error) {
            console.error('Update user error:', error);
            return { success: false, message: 'Failed to update user' };
        }
    }

    async deleteUser(id) {
        try {
            const { data: developerCount } = await window.supabase
                .from('users')
                .select('id', { count: 'exact' })
                .eq('role', 'developer');

            if (developerCount && developerCount.length <= 1) {
                const { data: userToDelete } = await window.supabase
                    .from('users')
                    .select('role')
                    .eq('id', id)
                    .maybeSingle();

                if (userToDelete && userToDelete.role === 'developer') {
                    return { success: false, message: 'Cannot delete the last developer account' };
                }
            }

            const { error } = await window.supabase
                .from('users')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Delete user error:', error);
                return { success: false, message: 'Failed to delete user' };
            }

            return { success: true };
        } catch (error) {
            console.error('Delete user error:', error);
            return { success: false, message: 'Failed to delete user' };
        }
    }

    async getAllUsers() {
        try {
            const { data, error } = await window.supabase
                .from('users')
                .select('id, username, email, role')
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Get all users error:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Get all users error:', error);
            return [];
        }
    }
}

window.authManager = new AuthManager();
