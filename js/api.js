// API Service for MongoDB backend
class ApiService {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
        this.token = localStorage.getItem('btf_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('btf_token', token);
        } else {
            localStorage.removeItem('btf_token');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // User endpoints
    async getUsers() {
        return this.request('/users');
    }

    async createUser(userData) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateUser(id, userData) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    // Batch endpoints
    async getBatches() {
        return this.request('/batches');
    }

    async createBatch(batchData) {
        return this.request('/batches', {
            method: 'POST',
            body: JSON.stringify(batchData)
        });
    }

    async updateBatch(id, batchData) {
        return this.request(`/batches/${id}`, {
            method: 'PUT',
            body: JSON.stringify(batchData)
        });
    }

    async deleteBatch(id) {
        return this.request(`/batches/${id}`, {
            method: 'DELETE'
        });
    }

    // Course endpoints
    async getCourses() {
        return this.request('/courses');
    }

    async getCoursesByBatch(batchId) {
        return this.request(`/courses/batch/${batchId}`);
    }

    async createCourse(courseData) {
        return this.request('/courses', {
            method: 'POST',
            body: JSON.stringify(courseData)
        });
    }

    async updateCourse(id, courseData) {
        return this.request(`/courses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(courseData)
        });
    }

    async deleteCourse(id) {
        return this.request(`/courses/${id}`, {
            method: 'DELETE'
        });
    }

    // Month endpoints
    async getMonths() {
        return this.request('/months');
    }

    async getMonthsByCourse(courseId) {
        return this.request(`/months/course/${courseId}`);
    }

    async createMonth(monthData) {
        return this.request('/months', {
            method: 'POST',
            body: JSON.stringify(monthData)
        });
    }

    async updateMonth(id, monthData) {
        return this.request(`/months/${id}`, {
            method: 'PUT',
            body: JSON.stringify(monthData)
        });
    }

    async deleteMonth(id) {
        return this.request(`/months/${id}`, {
            method: 'DELETE'
        });
    }

    // Institution endpoints
    async getInstitutions() {
        return this.request('/institutions');
    }

    async createInstitution(institutionData) {
        return this.request('/institutions', {
            method: 'POST',
            body: JSON.stringify(institutionData)
        });
    }

    async updateInstitution(id, institutionData) {
        return this.request(`/institutions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(institutionData)
        });
    }

    async deleteInstitution(id) {
        return this.request(`/institutions/${id}`, {
            method: 'DELETE'
        });
    }

    // Student endpoints
    async getStudents() {
        return this.request('/students');
    }

    async getStudent(id) {
        return this.request(`/students/${id}`);
    }

    async getStudentByStudentId(studentId) {
        return this.request(`/students/studentId/${studentId}`);
    }

    async createStudent(studentData) {
        return this.request('/students', {
            method: 'POST',
            body: JSON.stringify(studentData)
        });
    }

    async updateStudent(id, studentData) {
        return this.request(`/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(studentData)
        });
    }

    async deleteStudent(id) {
        return this.request(`/students/${id}`, {
            method: 'DELETE'
        });
    }

    // Payment endpoints
    async getPayments() {
        return this.request('/payments');
    }

    async getPaymentsByStudent(studentId) {
        return this.request(`/payments/student/${studentId}`);
    }

    async getDiscountedPayments() {
        return this.request('/payments/discounted');
    }

    async createPayment(paymentData) {
        return this.request('/payments', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    // Activity endpoints
    async getActivities() {
        return this.request('/activities');
    }

    async createActivity(activityData) {
        return this.request('/activities', {
            method: 'POST',
            body: JSON.stringify(activityData)
        });
    }

    // Reference endpoints
    async getReferences() {
        return this.request('/references/references');
    }

    async getReceivedByOptions() {
        return this.request('/references/receivedBy');
    }

    async addReference(value) {
        return this.request('/references/references', {
            method: 'POST',
            body: JSON.stringify({ value })
        });
    }

    async addReceivedBy(value) {
        return this.request('/references/receivedBy', {
            method: 'POST',
            body: JSON.stringify({ value })
        });
    }

    async deleteReference(index) {
        return this.request(`/references/references/${index}`, {
            method: 'DELETE'
        });
    }

    async deleteReceivedBy(index) {
        return this.request(`/references/receivedBy/${index}`, {
            method: 'DELETE'
        });
    }
}

// Global API service instance
window.apiService = new ApiService();