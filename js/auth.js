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
            const { data: { session } } = await this.supabase.auth.getSession();

            if (session && session.user) {
                const { data: userData, error } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (userData && !error) {
                    this.currentUser = userData;
                }
            }
        } catch (error) {
            console.error('Error checking session:', error);
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
                .select('*')
                .eq('username', username);

            if (userError || !users || users.length === 0) {
                await this.initializeDemoUsers();

                const { data: retryUsers, error: retryError } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('username', username);

                if (retryError || !retryUsers || retryUsers.length === 0) {
                    this.recordLoginAttempt(username, false);
                    return { success: false, message: 'Invalid credentials' };
                }

                const demoCredentials = {
                    'admin': 'admin123',
                    'manager': 'manager123',
                    'developer': 'dev123'
                };

                if (demoCredentials[username] === password) {
                    this.recordLoginAttempt(username, true);
                    this.currentUser = retryUsers[0];
                    return { success: true, user: retryUsers[0] };
                } else {
                    this.recordLoginAttempt(username, false);
                    return { success: false, message: 'Invalid credentials' };
                }
            }

            const user = users[0];
            const email = user.email || `${username}@breakthefear.local`;

            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                const demoCredentials = {
                    'admin': 'admin123',
                    'manager': 'manager123',
                    'developer': 'dev123'
                };

                if (demoCredentials[username] === password) {
                    this.recordLoginAttempt(username, true);
                    this.currentUser = user;
                    return { success: true, user };
                }

                this.recordLoginAttempt(username, false);
                return { success: false, message: 'Invalid credentials' };
            }

            this.recordLoginAttempt(username, true);
            this.currentUser = user;

            return { success: true, user };
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
            await this.supabase.auth.signOut();
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
                .eq('username', username);

            if (existingUsers && existingUsers.length > 0) {
                return { success: false, message: 'Username already exists' };
            }

            const email = `${username}@breakthefear.local`;

            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username,
                        role: role
                    }
                }
            });

            if (authError) {
                console.error('Auth signup error:', authError);
                return { success: false, message: authError.message };
            }

            const { data: newUser, error: insertError } = await this.supabase
                .from('users')
                .insert([
                    {
                        id: authData.user.id,
                        username: username,
                        email: email,
                        role: role
                    }
                ])
                .select()
                .single();

            if (insertError) {
                console.error('User insert error:', insertError);
                return { success: false, message: 'Failed to create user profile' };
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
                .select('*')
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
                    .neq('id', id);

                if (duplicateCheck && duplicateCheck.length > 0) {
                    return { success: false, message: 'Username already exists' };
                }
            }

            const { data: updatedUser, error } = await this.supabase
                .from('users')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Update user error:', error);
                return { success: false, message: 'Failed to update user' };
            }

            if (updates.password) {
                await this.supabase.auth.admin.updateUserById(id, {
                    password: updates.password
                });
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