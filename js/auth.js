// Authentication System
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check for existing token
        const token = localStorage.getItem('btf_token');
        if (token) {
            window.apiService.setToken(token);
            this.loadCurrentUser();
        }
    }

    async loadCurrentUser() {
        try {
            const user = await window.apiService.getCurrentUser();
            this.currentUser = user;
        } catch (error) {
            console.error('Error loading current user:', error);
            this.logout();
        }
    }

    async login(username, password) {
        try {
            console.log('Login attempt:', { username });
            
            const response = await window.apiService.login(username, password);
            
            if (response.success) {
                this.currentUser = response.user;
                window.apiService.setToken(response.token);
                return { success: true, user: response.user };
            } else {
                return { success: false, message: response.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message || 'Login failed' };
        }
    }

    logout() {
        this.currentUser = null;
        window.apiService.setToken(null);
        localStorage.removeItem('btf_current_user');
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
            const response = await window.apiService.createUser({ username, password, role });
            return { success: true, user: response.user };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async updateUser(id, updates) {
        try {
            const response = await window.apiService.updateUser(id, updates);
            return { success: true, user: response.user };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async deleteUser(id) {
        try {
            await window.apiService.deleteUser(id);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getAllUsers() {
        try {
            const users = await window.apiService.getUsers();
            return users.map(user => ({
                id: user._id,
                username: user.username,
                role: user.role
            }));
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }
}

// Global auth manager instance
window.authManager = new AuthManager();