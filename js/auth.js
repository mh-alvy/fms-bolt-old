class AuthManager {
    constructor() {
        this.currentUser = null;
        this.maxLoginAttempts = 5;
        this.loginAttempts = this.loadLoginAttempts();
        this.supabase = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        await this.waitForSupabase();
        this.initialized = true;
        await this.checkSession();
    }

    async waitForSupabase() {
        let attempts = 0;
        while (!window.supabase && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.supabase) {
            throw new Error('Supabase client not initialized');
        }

        this.supabase = window.supabase;
    }

    async checkSession() {
        try {
            const sessionData = localStorage.getItem('btf_user_session');

            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                const sessionAge = Date.now() - parsed.timestamp;
                const maxSessionAge = 24 * 60 * 60 * 1000;

                if (sessionAge < maxSessionAge && parsed.user) {
                    const { data: userData, error } = await this.supabase
                        .from('users')
                        .select('id, username, email, role')
                        .eq('id', parsed.user.id)
                        .maybeSingle();

                    if (userData && !error) {
                        this.currentUser = userData;
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
        const lockoutTime = 15 * 60 * 1000; // 15 minutes
        
        if (attempts.count >= this.maxLoginAttempts) {
            if (now - attempts.lastAttempt < lockoutTime) {
                return true;
            }
            // Reset attempts after lockout period
            delete this.loginAttempts[username];
            this.saveLoginAttempts();
        }
        return false;
    }

    recordLoginAttempt(username, success) {
        if (success) {
            // Clear failed attempts on successful login
            delete this.loginAttempts[username];
        } else {
            // Record failed attempt
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
            if (this.isAccountLocked(username)) {
                return {
                    success: false,
                    message: 'Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.'
                };
            }

            const { data: users, error: userError } = await this.supabase
                .from('users')
                .select('id, username, email, role, password_hash')
                .eq('username', username)
                .maybeSingle();

            if (userError) {
                console.error('Database error during login:', userError);
                this.recordLoginAttempt(username, false);
                return { success: false, message: 'Login failed. Please try again.' };
            }

            if (!users) {
                this.recordLoginAttempt(username, false);
                return { success: false, message: 'Invalid credentials' };
            }

            const { data: verificationResult, error: verifyError } = await this.supabase
                .rpc('verify_password', {
                    password: password,
                    password_hash: users.password_hash
                });

            if (verifyError) {
                console.error('Password verification error:', verifyError);
                this.recordLoginAttempt(username, false);
                return { success: false, message: 'Login failed. Please try again.' };
            }

            if (!verificationResult) {
                this.recordLoginAttempt(username, false);
                return { success: false, message: 'Invalid credentials' };
            }

            this.recordLoginAttempt(username, true);

            const userWithoutHash = {
                id: users.id,
                username: users.username,
                email: users.email,
                role: users.role
            };

            this.currentUser = userWithoutHash;

            localStorage.setItem('btf_user_session', JSON.stringify({
                user: userWithoutHash,
                timestamp: Date.now()
            }));

            return { success: true, user: userWithoutHash };
        } catch (error) {
            console.error('Login error:', error);
            this.recordLoginAttempt(username, false);
            return { success: false, message: 'Login failed. Please try again.' };
        }
    }

    async initializeDemoUsers() {
        try {
            const demoUsers = [
                { username: 'admin', email: 'admin@breakthefear.local', role: 'admin' },
                { username: 'manager', email: 'manager@breakthefear.local', role: 'manager' },
                { username: 'developer', email: 'developer@breakthefear.local', role: 'developer' }
            ];

            for (const demoUser of demoUsers) {
                const { data: existing } = await this.supabase
                    .from('users')
                    .select('id')
                    .eq('username', demoUser.username)
                    .maybeSingle();

                if (!existing) {
                    const userId = crypto.randomUUID();
                    await this.supabase
                        .from('users')
                        .insert([{
                            id: userId,
                            username: demoUser.username,
                            email: demoUser.email,
                            role: demoUser.role
                        }]);
                }
            }
        } catch (error) {
            console.error('Error initializing demo users:', error);
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

    async addUser(username, password, role) {
        try {
            const { data: existingUsers } = await this.supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .maybeSingle();

            if (existingUsers) {
                return { success: false, message: 'Username already exists' };
            }

            const email = `${username}@breakthefear.local`;

            const { data: hashedPassword, error: hashError } = await this.supabase
                .rpc('hash_password', { password: password });

            if (hashError || !hashedPassword) {
                console.error('Password hashing error:', hashError);
                return { success: false, message: 'Failed to create user' };
            }

            const { data: newUser, error: insertError } = await this.supabase
                .from('users')
                .insert([
                    {
                        username: username,
                        email: email,
                        role: role,
                        password_hash: hashedPassword
                    }
                ])
                .select('id, username, email, role')
                .single();

            if (insertError) {
                console.error('User insert error:', insertError);
                return { success: false, message: 'Failed to create user' };
            }

            return { success: true, user: newUser };
        } catch (error) {
            console.error('Add user error:', error);
            return { success: false, message: 'Failed to add user' };
        }
    }

    async updateUser(id, updates) {
        try {
            const { data: existingUser } = await this.supabase
                .from('users')
                .select('id, username, email, role')
                .eq('id', id)
                .maybeSingle();

            if (!existingUser) {
                return { success: false, message: 'User not found' };
            }

            if (updates.username && updates.username !== existingUser.username) {
                const { data: duplicateCheck } = await this.supabase
                    .from('users')
                    .select('username')
                    .eq('username', updates.username)
                    .neq('id', id)
                    .maybeSingle();

                if (duplicateCheck) {
                    return { success: false, message: 'Username already exists' };
                }
            }

            const updateData = {};
            if (updates.username) updateData.username = updates.username;
            if (updates.email) updateData.email = updates.email;
            if (updates.role) updateData.role = updates.role;

            if (updates.password) {
                const { data: hashedPassword, error: hashError } = await this.supabase
                    .rpc('hash_password', { password: updates.password });

                if (hashError || !hashedPassword) {
                    console.error('Password hashing error:', hashError);
                    return { success: false, message: 'Failed to update password' };
                }

                updateData.password_hash = hashedPassword;
            }

            const { data: updatedUser, error } = await this.supabase
                .from('users')
                .update(updateData)
                .eq('id', id)
                .select('id, username, email, role')
                .single();

            if (error) {
                console.error('Update user error:', error);
                return { success: false, message: 'Failed to update user' };
            }

            return { success: true, user: updatedUser };
        } catch (error) {
            console.error('Update user error:', error);
            return { success: false, message: 'Failed to update user' };
        }
    }

    async deleteUser(id) {
        try {
            const { data: user } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (!user) {
                return { success: false, message: 'User not found' };
            }

            if (user.role === 'developer') {
                const { data: developers } = await this.supabase
                    .from('users')
                    .select('id')
                    .eq('role', 'developer');

                if (developers && developers.length <= 1) {
                    return { success: false, message: 'Cannot delete the last developer account' };
                }
            }

            const { error } = await this.supabase
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
            const { data: users, error } = await this.supabase
                .from('users')
                .select('id, username, role')
                .order('username');

            if (error) {
                console.error('Get all users error:', error);
                return [];
            }

            return users || [];
        } catch (error) {
            console.error('Get all users error:', error);
            return [];
        }
    }
}

window.authManager = new AuthManager();