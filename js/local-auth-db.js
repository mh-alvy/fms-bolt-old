class LocalAuthDB {
    constructor() {
        this.STORAGE_KEY = 'btf_local_users';
        this.initializeDefaultUsers();
    }

    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'salt_btf_2024');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async verifyPassword(password, hash) {
        const computedHash = await this.hashPassword(password);
        return computedHash === hash;
    }

    initializeDefaultUsers() {
        const users = this.getAllUsers();

        if (users.length === 0) {
            const defaultUsers = [
                {
                    id: '11111111-1111-1111-1111-111111111111',
                    username: 'admin',
                    email: 'admin@breakthefear.local',
                    role: 'admin',
                    password: 'admin123'
                },
                {
                    id: '22222222-2222-2222-2222-222222222222',
                    username: 'manager',
                    email: 'manager@breakthefear.local',
                    role: 'manager',
                    password: 'manager123'
                },
                {
                    id: '33333333-3333-3333-3333-333333333333',
                    username: 'developer',
                    email: 'developer@breakthefear.local',
                    role: 'developer',
                    password: 'dev123'
                }
            ];

            this.hashAndSaveUsers(defaultUsers);
        }
    }

    async hashAndSaveUsers(users) {
        const hashedUsers = [];

        for (const user of users) {
            const passwordHash = await this.hashPassword(user.password);
            hashedUsers.push({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                password_hash: passwordHash
            });
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(hashedUsers));
    }

    getAllUsers() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading users from localStorage:', e);
            return [];
        }
    }

    getUserByUsername(username) {
        const users = this.getAllUsers();
        return users.find(u => u.username === username);
    }

    getUserById(id) {
        const users = this.getAllUsers();
        return users.find(u => u.id === id);
    }

    async addUser(username, email, password, role) {
        const users = this.getAllUsers();

        if (users.find(u => u.username === username)) {
            return { success: false, message: 'Username already exists' };
        }

        const newUser = {
            id: crypto.randomUUID(),
            username,
            email,
            role,
            password_hash: await this.hashPassword(password)
        };

        users.push(newUser);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));

        const { password_hash, ...userWithoutHash } = newUser;
        return { success: true, user: userWithoutHash };
    }

    async updateUser(id, updates) {
        const users = this.getAllUsers();
        const index = users.findIndex(u => u.id === id);

        if (index === -1) {
            return { success: false, message: 'User not found' };
        }

        if (updates.username && users.find(u => u.username === updates.username && u.id !== id)) {
            return { success: false, message: 'Username already exists' };
        }

        const user = users[index];

        if (updates.username) user.username = updates.username;
        if (updates.email) user.email = updates.email;
        if (updates.role) user.role = updates.role;
        if (updates.password) {
            user.password_hash = await this.hashPassword(updates.password);
        }

        users[index] = user;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));

        const { password_hash, ...userWithoutHash } = user;
        return { success: true, user: userWithoutHash };
    }

    deleteUser(id) {
        const users = this.getAllUsers();
        const user = users.find(u => u.id === id);

        if (!user) {
            return { success: false, message: 'User not found' };
        }

        if (user.role === 'developer') {
            const developerCount = users.filter(u => u.role === 'developer').length;
            if (developerCount <= 1) {
                return { success: false, message: 'Cannot delete the last developer account' };
            }
        }

        const filteredUsers = users.filter(u => u.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredUsers));

        return { success: true };
    }

    getUsersForDisplay() {
        const users = this.getAllUsers();
        return users.map(({ id, username, email, role }) => ({ id, username, email, role }));
    }
}

window.localAuthDB = new LocalAuthDB();
