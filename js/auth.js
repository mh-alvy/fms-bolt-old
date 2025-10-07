class AuthManager {
    constructor() {
        this.currentUser = null;
        this.maxLoginAttempts = 5;
        this.loginAttempts = this.loadLoginAttempts();
        this.localDB = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        await this.waitForLocalDB();
        this.initialized = true;
        await this.checkSession();
    }

    async waitForLocalDB() {
        let attempts = 0;
        while (!window.localAuthDB && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.localAuthDB) {
            throw new Error('Local auth database not initialized');
        }

        this.localDB = window.localAuthDB;
        console.log('Local auth database initialized successfully');
    }

    async checkSession() {
        try {
            const sessionData = localStorage.getItem('btf_user_session');

            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                const sessionAge = Date.now() - parsed.timestamp;
                const maxSessionAge = 24 * 60 * 60 * 1000;

                if (sessionAge < maxSessionAge && parsed.user) {
                    const userData = this.localDB.getUserById(parsed.user.id);

                    if (userData) {
                        const { password_hash, ...userWithoutHash } = userData;
                        this.currentUser = userWithoutHash;
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

            console.log('Looking up user in local database...');
            const user = this.localDB.getUserByUsername(username);

            if (!user) {
                console.log('No user found with username:', username);
                this.recordLoginAttempt(username, false);
                return { success: false, message: 'Invalid credentials' };
            }

            console.log('User found, verifying password...');
            const isValidPassword = await this.localDB.verifyPassword(password, user.password_hash);

            if (!isValidPassword) {
                console.log('Password verification failed');
                this.recordLoginAttempt(username, false);
                return { success: false, message: 'Invalid credentials' };
            }

            console.log('Login successful!');
            this.recordLoginAttempt(username, true);

            const { password_hash, ...userWithoutHash } = user;
            this.currentUser = userWithoutHash;

            localStorage.setItem('btf_user_session', JSON.stringify({
                user: userWithoutHash,
                timestamp: Date.now()
            }));

            return { success: true, user: userWithoutHash };
        } catch (error) {
            console.error('=== LOGIN EXCEPTION ===');
            console.error('Error:', error);
            this.recordLoginAttempt(username, false);
            return { success: false, message: 'Login failed. Please try again.' };
        }
    }

    async initializeDemoUsers() {
        console.log('Demo users are pre-configured in local storage');
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
            const email = `${username}@breakthefear.local`;
            return await this.localDB.addUser(username, email, password, role);
        } catch (error) {
            console.error('Add user error:', error);
            return { success: false, message: 'Failed to add user' };
        }
    }

    async updateUser(id, updates) {
        try {
            return await this.localDB.updateUser(id, updates);
        } catch (error) {
            console.error('Update user error:', error);
            return { success: false, message: 'Failed to update user' };
        }
    }

    async deleteUser(id) {
        try {
            return this.localDB.deleteUser(id);
        } catch (error) {
            console.error('Delete user error:', error);
            return { success: false, message: 'Failed to delete user' };
        }
    }

    async getAllUsers() {
        try {
            return this.localDB.getUsersForDisplay();
        } catch (error) {
            console.error('Get all users error:', error);
            return [];
        }
    }
}

window.authManager = new AuthManager();
