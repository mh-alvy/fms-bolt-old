// Data Storage Manager
class StorageManager {
    constructor() {
        this.cache = {
            batches: [],
            courses: [],
            months: [],
            institutions: [],
            students: [],
            payments: [],
            activities: []
        };
        this.init();
    }

    init() {
        // Initialize cache - data will be loaded from API
        this.loadAllData();
    }

    async loadAllData() {
        try {
            // Load all data from API and cache it
            await Promise.all([
                this.loadBatches(),
                this.loadCourses(),
                this.loadMonths(),
                this.loadInstitutions(),
                this.loadStudents(),
                this.loadPayments(),
                this.loadActivities()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async loadBatches() {
        try {
            this.cache.batches = await window.apiService.getBatches();
        } catch (error) {
            console.error('Error loading batches:', error);
            this.cache.batches = [];
        }
    }

    async loadCourses() {
        try {
            this.cache.courses = await window.apiService.getCourses();
        } catch (error) {
            console.error('Error loading courses:', error);
            this.cache.courses = [];
        }
    }

    async loadMonths() {
        try {
            this.cache.months = await window.apiService.getMonths();
        } catch (error) {
            console.error('Error loading months:', error);
            this.cache.months = [];
        }
    }

    async loadInstitutions() {
        try {
            this.cache.institutions = await window.apiService.getInstitutions();
        } catch (error) {
            console.error('Error loading institutions:', error);
            this.cache.institutions = [];
        }
    }

    async loadStudents() {
        try {
            this.cache.students = await window.apiService.getStudents();
        } catch (error) {
            console.error('Error loading students:', error);
            this.cache.students = [];
        }
    }

    async loadPayments() {
        try {
            this.cache.payments = await window.apiService.getPayments();
        } catch (error) {
            console.error('Error loading payments:', error);
            this.cache.payments = [];
        }
    }

    async loadActivities() {
        try {
            this.cache.activities = await window.apiService.getActivities();
        } catch (error) {
            console.error('Error loading activities:', error);
            this.cache.activities = [];
        }
    }

    generateId(prefix = 'item') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateStudentId() {
        const year = new Date().getFullYear().toString().slice(-2);
        const existing = this.getStudents().length;
        return `BTF${year}${(existing + 1).toString().padStart(4, '0')}`;
    }

    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const existing = this.getPayments().length;
        return `INV${year}${month}${(existing + 1).toString().padStart(4, '0')}`;
    }

    // Activity logging
    async addActivity(type, description, data = {}) {
        try {
            const activity = await window.apiService.createActivity({
                type,
                description,
                data
            });
            
            // Update cache
            this.cache.activities.unshift(activity);
            
            // Keep only last 100 activities in cache
            if (this.cache.activities.length > 100) {
                this.cache.activities.splice(100);
            }
            
            return activity;
        } catch (error) {
            console.error('Error adding activity:', error);
            return null;
        }
    }

    // Batch operations
    async addBatch(batchData) {
        try {
            const batch = await window.apiService.createBatch(batchData);
            this.cache.batches.push(batch);
            await this.addActivity('batch_created', `Batch "${batch.name}" created`, { batchId: batch._id });
            return batch;
        } catch (error) {
            console.error('Error adding batch:', error);
            throw error;
        }
    }

    async updateBatch(id, updates) {
        try {
            const batch = await window.apiService.updateBatch(id, updates);
            const index = this.cache.batches.findIndex(b => b._id === id);
            if (index !== -1) {
                this.cache.batches[index] = batch;
            }
            await this.addActivity('batch_updated', `Batch "${batch.name}" updated`, { batchId: id });
            return batch;
        } catch (error) {
            console.error('Error updating batch:', error);
            throw error;
        }
    }

    async deleteBatch(id) {
        try {
            const batch = this.getBatchById(id);
            await window.apiService.deleteBatch(id);
            this.cache.batches = this.cache.batches.filter(b => b._id !== id);
            if (batch) {
                await this.addActivity('batch_deleted', `Batch "${batch.name}" deleted`, { batchId: id });
            }
            return { success: true };
        } catch (error) {
            console.error('Error deleting batch:', error);
            return { success: false, message: error.message };
        }
    }

    // Course operations
    async addCourse(courseData) {
        try {
            const course = await window.apiService.createCourse(courseData);
            this.cache.courses.push(course);
            await this.addActivity('course_created', `Course "${course.name}" created`, { courseId: course._id });
            return course;
        } catch (error) {
            console.error('Error adding course:', error);
            throw error;
        }
    }

    async updateCourse(id, updates) {
        try {
            const course = await window.apiService.updateCourse(id, updates);
            const index = this.cache.courses.findIndex(c => c._id === id);
            if (index !== -1) {
                this.cache.courses[index] = course;
            }
            await this.addActivity('course_updated', `Course "${course.name}" updated`, { courseId: id });
            return course;
        } catch (error) {
            console.error('Error updating course:', error);
            throw error;
        }
    }

    async deleteCourse(id) {
        try {
            const course = this.getCourseById(id);
            await window.apiService.deleteCourse(id);
            this.cache.courses = this.cache.courses.filter(c => c._id !== id);
            if (course) {
                await this.addActivity('course_deleted', `Course "${course.name}" deleted`, { courseId: id });
            }
            return { success: true };
        } catch (error) {
            console.error('Error deleting course:', error);
            return { success: false, message: error.message };
        }
    }

    // Month operations
    async addMonth(monthData) {
        try {
            const month = await window.apiService.createMonth(monthData);
            this.cache.months.push(month);
            await this.addActivity('month_created', `Month "${month.name}" created`, { monthId: month._id });
            return month;
        } catch (error) {
            console.error('Error adding month:', error);
            throw error;
        }
    }

    async updateMonth(id, updates) {
        try {
            const month = await window.apiService.updateMonth(id, updates);
            const index = this.cache.months.findIndex(m => m._id === id);
            if (index !== -1) {
                this.cache.months[index] = month;
            }
            await this.addActivity('month_updated', `Month "${month.name}" updated`, { monthId: id });
            return month;
        } catch (error) {
            console.error('Error updating month:', error);
            throw error;
        }
    }

    async deleteMonth(id) {
        try {
            const month = this.getMonthById(id);
            await window.apiService.deleteMonth(id);
            this.cache.months = this.cache.months.filter(m => m._id !== id);
            if (month) {
                await this.addActivity('month_deleted', `Month "${month.name}" deleted`, { monthId: id });
            }
            return { success: true };
        } catch (error) {
            console.error('Error deleting month:', error);
            return { success: false, message: error.message };
        }
    }

    // Institution operations
    async addInstitution(institutionData) {
        try {
            const institution = await window.apiService.createInstitution(institutionData);
            this.cache.institutions.push(institution);
            await this.addActivity('institution_created', `Institution "${institution.name}" created`, { institutionId: institution._id });
            return institution;
        } catch (error) {
            console.error('Error adding institution:', error);
            throw error;
        }
    }

    async updateInstitution(id, updates) {
        try {
            const institution = await window.apiService.updateInstitution(id, updates);
            const index = this.cache.institutions.findIndex(i => i._id === id);
            if (index !== -1) {
                this.cache.institutions[index] = institution;
            }
            await this.addActivity('institution_updated', `Institution "${institution.name}" updated`, { institutionId: id });
            return institution;
        } catch (error) {
            console.error('Error updating institution:', error);
            throw error;
        }
    }

    async deleteInstitution(id) {
        try {
            const institution = this.getInstitutionById(id);
            await window.apiService.deleteInstitution(id);
            this.cache.institutions = this.cache.institutions.filter(i => i._id !== id);
            if (institution) {
                await this.addActivity('institution_deleted', `Institution "${institution.name}" deleted`, { institutionId: id });
            }
            return { success: true };
        } catch (error) {
            console.error('Error deleting institution:', error);
            return { success: false, message: error.message };
        }
    }

    // Student operations
    async addStudent(studentData) {
        try {
            const student = await window.apiService.createStudent(studentData);
            this.cache.students.push(student);
            await this.addActivity('student_added', `Student "${student.name}" added with ID ${student.studentId}`, { studentId: student._id });
            return student;
        } catch (error) {
            console.error('Error adding student:', error);
            throw error;
        }
    }

    async updateStudent(id, updates) {
        try {
            const student = await window.apiService.updateStudent(id, updates);
            const index = this.cache.students.findIndex(s => s._id === id);
            if (index !== -1) {
                this.cache.students[index] = student;
            }
            await this.addActivity('student_updated', `Student "${student.name}" updated`, { studentId: id });
            return student;
        } catch (error) {
            console.error('Error updating student:', error);
            throw error;
        }
    }

    async deleteStudent(id) {
        try {
            const student = this.getStudentById(id);
            await window.apiService.deleteStudent(id);
            this.cache.students = this.cache.students.filter(s => s._id !== id);
            if (student) {
                await this.addActivity('student_deleted', `Student "${student.name}" deleted`, { studentId: id });
            }
            return { success: true };
        } catch (error) {
            console.error('Error deleting student:', error);
            return { success: false, message: error.message };
        }
    }

    // Payment operations
    async addPayment(paymentData) {
        try {
            const payment = await window.apiService.createPayment(paymentData);
            this.cache.payments.push(payment);
            await this.addActivity('payment_received', `Payment of ৳${payment.paidAmount} received from ${payment.studentName}`, { paymentId: payment._id });
            return payment;
        } catch (error) {
            console.error('Error adding payment:', error);
            throw error;
        }
    }

    // Getter methods - now use cache
    getBatches() {
        return this.cache.batches || [];
    }

    getCourses() {
        return this.cache.courses || [];
    }

    getMonths() {
        return this.cache.months || [];
    }

    getInstitutions() {
        return this.cache.institutions || [];
    }

    getStudents() {
        return this.cache.students || [];
    }

    getPayments() {
        return this.cache.payments || [];
    }

    getActivities() {
        return this.cache.activities || [];
    }

    // Utility methods - updated to work with MongoDB ObjectIds
    getBatchById(id) {
        return this.getBatches().find(batch => batch._id === id);
    }

    getCourseById(id) {
        return this.getCourses().find(course => course._id === id);
    }

    getMonthById(id) {
        return this.getMonths().find(month => month._id === id);
    }

    getInstitutionById(id) {
        return this.getInstitutions().find(institution => institution._id === id);
    }

    getStudentById(id) {
        return this.getStudents().find(student => student._id === id);
    }

    getStudentByStudentId(studentId) {
        return this.getStudents().find(student => student.studentId === studentId);
    }

    getCoursesByBatch(batchId) {
        return this.getCourses().filter(course => {
            // Handle both populated and non-populated batchId
            const courseBatchId = course.batchId?._id || course.batchId;
            return courseBatchId === batchId;
        });
    }

    getMonthsByCourse(courseId) {
        return this.getMonths().filter(month => {
            // Handle both populated and non-populated courseId
            const monthCourseId = month.courseId?._id || month.courseId;
            return monthCourseId === courseId;
        });
    }

    getStudentsByBatch(batchId) {
        return this.getStudents().filter(student => {
            // Handle both populated and non-populated batchId
            const studentBatchId = student.batchId?._id || student.batchId;
            return studentBatchId === batchId;
        });
    }

    getPaymentsByStudent(studentId) {
        return this.getPayments().filter(payment => {
            // Handle both populated and non-populated studentId
            const paymentStudentId = payment.studentId?._id || payment.studentId;
            return paymentStudentId === studentId;
        });
    }

    // Get month payment details for a student
    getMonthPaymentDetails(studentId) {
        const payments = this.getPaymentsByStudent(studentId);
        const monthPayments = {};
        
        payments.forEach(payment => {
            if (payment.monthPayments) {
                payment.monthPayments.forEach(monthPayment => {
                    const monthId = monthPayment.monthId?._id || monthPayment.monthId;
                    if (!monthPayments[monthId]) {
                        monthPayments[monthId] = {
                            totalPaid: 0,
                            totalDiscount: 0,
                            monthFee: monthPayment.monthFee || 0,
                            payments: []
                        };
                    }
                    monthPayments[monthId].totalPaid += monthPayment.paidAmount;
                    monthPayments[monthId].totalDiscount += (monthPayment.discountAmount || 0);
                    monthPayments[monthId].payments.push({
                        paymentId: payment._id,
                        paidAmount: monthPayment.paidAmount,
                        discountAmount: monthPayment.discountAmount || 0,
                        date: payment.createdAt
                    });
                });
            } else if (payment.months) {
                // Handle legacy payments
                payment.months.forEach(monthId => {
                    const actualMonthId = monthId?._id || monthId;
                    const month = this.getMonthById(actualMonthId);
                    if (month) {
                        if (!monthPayments[actualMonthId]) {
                            monthPayments[actualMonthId] = {
                                totalPaid: 0,
                                totalDiscount: 0,
                                monthFee: month.payment,
                                payments: []
                            };
                        }
                        const amountPaid = payment.paidAmount / payment.months.length;
                        let discountAmount = 0;
                        if (payment.discountAmount > 0 && payment.discountApplicableMonths) {
                            if (payment.discountApplicableMonths.includes(actualMonthId)) {
                                const applicableMonthsCount = payment.discountApplicableMonths.length;
                                if (applicableMonthsCount > 0) {
                                    if (payment.discountType === 'percentage') {
                                        const discountPercentage = parseFloat(payment.discountAmount || 0);
                                        discountAmount = (month.payment * discountPercentage) / 100;
                                    } else {
                                        discountAmount = payment.discountAmount / applicableMonthsCount;
                                    }
                                }
                            }
                        } else if (payment.discountAmount > 0) {
                            if (payment.discountType === 'percentage') {
                                const discountPercentage = parseFloat(payment.discountAmount || 0);
                                discountAmount = (month.payment * discountPercentage) / 100;
                            } else {
                                discountAmount = payment.discountAmount / payment.months.length;
                            }
                        }
                        
                        monthPayments[actualMonthId].totalPaid += amountPaid;
                        monthPayments[actualMonthId].totalDiscount += discountAmount;
                        monthPayments[actualMonthId].payments.push({
                            paymentId: payment._id,
                            paidAmount: amountPaid,
                            discountAmount: discountAmount,
                            date: payment.createdAt
                        });
                    }
                });
            }
        });
        
        return monthPayments;
    }

    // Get payments with discounts
    async getDiscountedPayments() {
        try {
            return await window.apiService.getDiscountedPayments();
        } catch (error) {
            console.error('Error getting discounted payments:', error);
            return this.getPayments().filter(payment => 
                payment.discountAmount && payment.discountAmount > 0
            );
        }
    }
}

// Global storage manager instance
window.storageManager = new StorageManager();
            type,
            description,
            data,
            timestamp: new Date().toISOString(),
            user: window.authManager.getCurrentUser()?.username || 'System'
        };

        activities.unshift(activity); // Add to beginning
        
        // Keep only last 100 activities
        if (activities.length > 100) {
            activities.splice(100);
        }

        localStorage.setItem('btf_activities', JSON.stringify(activities));
        return activity;
    }

    // Batch operations
    addBatch(batchData) {
        const batches = this.getBatches();
        const batch = {
            id: this.generateId('batch'),
            ...batchData,
            createdAt: new Date().toISOString()
        };

        batches.push(batch);
        localStorage.setItem('btf_batches', JSON.stringify(batches));
        this.addActivity('batch_created', `Batch "${batch.name}" created`, { batchId: batch.id });
        return batch;
    }

    updateBatch(id, updates) {
        const batches = this.getBatches();
        const index = batches.findIndex(batch => batch.id === id);
        
        if (index !== -1) {
            batches[index] = { ...batches[index], ...updates, updatedAt: new Date().toISOString() };
            localStorage.setItem('btf_batches', JSON.stringify(batches));
            this.addActivity('batch_updated', `Batch "${batches[index].name}" updated`, { batchId: id });
            return batches[index];
        }
        return null;
    }

    deleteBatch(id) {
        const batches = this.getBatches();
        const batch = batches.find(b => b.id === id);
        
        if (batch) {
            // Check if batch has courses
            const hasCourses = this.getCourses().some(course => course.batchId === id);
            if (hasCourses) {
                return { success: false, message: 'Cannot delete batch with existing courses' };
            }

            const filteredBatches = batches.filter(b => b.id !== id);
            localStorage.setItem('btf_batches', JSON.stringify(filteredBatches));
            this.addActivity('batch_deleted', `Batch "${batch.name}" deleted`, { batchId: id });
            return { success: true };
        }
        return { success: false, message: 'Batch not found' };
    }

    // Course operations
    addCourse(courseData) {
        const courses = this.getCourses();
        const course = {
            id: this.generateId('course'),
            ...courseData,
            createdAt: new Date().toISOString()
        };

        courses.push(course);
        localStorage.setItem('btf_courses', JSON.stringify(courses));
        this.addActivity('course_created', `Course "${course.name}" created`, { courseId: course.id });
        return course;
    }

    updateCourse(id, updates) {
        const courses = this.getCourses();
        const index = courses.findIndex(course => course.id === id);
        
        if (index !== -1) {
            courses[index] = { ...courses[index], ...updates, updatedAt: new Date().toISOString() };
            localStorage.setItem('btf_courses', JSON.stringify(courses));
            this.addActivity('course_updated', `Course "${courses[index].name}" updated`, { courseId: id });
            return courses[index];
        }
        return null;
    }

    deleteCourse(id) {
        const courses = this.getCourses();
        const course = courses.find(c => c.id === id);
        
        if (course) {
            // Check if course has months
            const hasMonths = this.getMonths().some(month => month.courseId === id);
            if (hasMonths) {
                return { success: false, message: 'Cannot delete course with existing months' };
            }

            const filteredCourses = courses.filter(c => c.id !== id);
            localStorage.setItem('btf_courses', JSON.stringify(filteredCourses));
            this.addActivity('course_deleted', `Course "${course.name}" deleted`, { courseId: id });
            return { success: true };
        }
        return { success: false, message: 'Course not found' };
    }

    // Month operations
    addMonth(monthData) {
        const months = this.getMonths();
        const month = {
            id: this.generateId('month'),
            ...monthData,
            monthNumber: monthData.monthNumber || 1,
            createdAt: new Date().toISOString()
        };

        months.push(month);
        localStorage.setItem('btf_months', JSON.stringify(months));
        this.addActivity('month_created', `Month "${month.name}" created`, { monthId: month.id });
        return month;
    }

    updateMonth(id, updates) {
        const months = this.getMonths();
        const index = months.findIndex(month => month.id === id);
        
        if (index !== -1) {
            months[index] = { ...months[index], ...updates, updatedAt: new Date().toISOString() };
            localStorage.setItem('btf_months', JSON.stringify(months));
            this.addActivity('month_updated', `Month "${months[index].name}" updated`, { monthId: id });
            return months[index];
        }
        return null;
    }

    deleteMonth(id) {
        const months = this.getMonths();
        const month = months.find(m => m.id === id);
        
        if (month) {
            const filteredMonths = months.filter(m => m.id !== id);
            localStorage.setItem('btf_months', JSON.stringify(filteredMonths));
            this.addActivity('month_deleted', `Month "${month.name}" deleted`, { monthId: id });
            return { success: true };
        }
        return { success: false, message: 'Month not found' };
    }

    // Institution operations
    addInstitution(institutionData) {
        const institutions = this.getInstitutions();
        const institution = {
            id: this.generateId('institution'),
            ...institutionData,
            createdAt: new Date().toISOString()
        };

        institutions.push(institution);
        localStorage.setItem('btf_institutions', JSON.stringify(institutions));
        this.addActivity('institution_created', `Institution "${institution.name}" created`, { institutionId: institution.id });
        return institution;
    }

    updateInstitution(id, updates) {
        const institutions = this.getInstitutions();
        const index = institutions.findIndex(institution => institution.id === id);
        
        if (index !== -1) {
            institutions[index] = { ...institutions[index], ...updates, updatedAt: new Date().toISOString() };
            localStorage.setItem('btf_institutions', JSON.stringify(institutions));
            this.addActivity('institution_updated', `Institution "${institutions[index].name}" updated`, { institutionId: id });
            return institutions[index];
        }
        return null;
    }

    deleteInstitution(id) {
        const institutions = this.getInstitutions();
        const institution = institutions.find(i => i.id === id);
        
        if (institution) {
            // Check if institution has students
            const hasStudents = this.getStudents().some(student => student.institutionId === id);
            if (hasStudents) {
                return { success: false, message: 'Cannot delete institution with existing students' };
            }

            const filteredInstitutions = institutions.filter(i => i.id !== id);
            localStorage.setItem('btf_institutions', JSON.stringify(filteredInstitutions));
            this.addActivity('institution_deleted', `Institution "${institution.name}" deleted`, { institutionId: id });
            return { success: true };
        }
        return { success: false, message: 'Institution not found' };
    }

    // Student operations
    addStudent(studentData) {
        const students = this.getStudents();
        const student = {
            id: this.generateId('student'),
            ...studentData,
            studentId: this.generateStudentId(),
            enrolledCourses: studentData.enrolledCourses || [],
            createdAt: new Date().toISOString()
        };

        students.push(student);
        localStorage.setItem('btf_students', JSON.stringify(students));
        this.addActivity('student_added', `Student "${student.name}" added with ID ${student.studentId}`, { studentId: student.id });
        return student;
    }

    updateStudent(id, updates) {
        const students = this.getStudents();
        const index = students.findIndex(student => student.id === id);
        
        if (index !== -1) {
            students[index] = { ...students[index], ...updates, updatedAt: new Date().toISOString() };
            localStorage.setItem('btf_students', JSON.stringify(students));
            this.addActivity('student_updated', `Student "${students[index].name}" updated`, { studentId: id });
            return students[index];
        }
        return null;
    }

    deleteStudent(id) {
        const students = this.getStudents();
        const student = students.find(s => s.id === id);
        
        if (student) {
            const filteredStudents = students.filter(s => s.id !== id);
            localStorage.setItem('btf_students', JSON.stringify(filteredStudents));
            this.addActivity('student_deleted', `Student "${student.name}" deleted`, { studentId: id });
            return { success: true };
        }
        return { success: false, message: 'Student not found' };
    }

    // Payment operations
    addPayment(paymentData) {
        const payments = this.getPayments();
        const payment = {
            id: this.generateId('payment'),
            ...paymentData,
            invoiceNumber: this.generateInvoiceNumber(),
            monthPayments: paymentData.monthPayments || [],
            createdAt: new Date().toISOString()
        };

        payments.push(payment);
        localStorage.setItem('btf_payments', JSON.stringify(payments));
        this.addActivity('payment_received', `Payment of ৳${payment.paidAmount} received from ${payment.studentName}`, { paymentId: payment.id });
        return payment;
    }

    // Getter methods
    getBatches() {
        try {
            return JSON.parse(localStorage.getItem('btf_batches') || '[]');
        } catch (e) {
            return [];
        }
    }

    getCourses() {
        try {
            return JSON.parse(localStorage.getItem('btf_courses') || '[]');
        } catch (e) {
            return [];
        }
    }

    getMonths() {
        try {
            return JSON.parse(localStorage.getItem('btf_months') || '[]');
        } catch (e) {
            return [];
        }
    }

    getInstitutions() {
        try {
            return JSON.parse(localStorage.getItem('btf_institutions') || '[]');
        } catch (e) {
            return [];
        }
    }

    getStudents() {
        try {
            return JSON.parse(localStorage.getItem('btf_students') || '[]');
        } catch (e) {
            return [];
        }
    }

    getPayments() {
        try {
            return JSON.parse(localStorage.getItem('btf_payments') || '[]');
        } catch (e) {
            return [];
        }
    }

    getActivities() {
        try {
            return JSON.parse(localStorage.getItem('btf_activities') || '[]');
        } catch (e) {
            return [];
        }
    }

    // Utility methods
    getBatchById(id) {
        return this.getBatches().find(batch => batch.id === id);
    }

    getCourseById(id) {
        return this.getCourses().find(course => course.id === id);
    }

    getMonthById(id) {
        return this.getMonths().find(month => month.id === id);
    }

    getInstitutionById(id) {
        return this.getInstitutions().find(institution => institution.id === id);
    }

    getStudentById(id) {
        return this.getStudents().find(student => student.id === id);
    }

    getStudentByStudentId(studentId) {
        return this.getStudents().find(student => student.studentId === studentId);
    }

    getCoursesByBatch(batchId) {
        return this.getCourses().filter(course => course.batchId === batchId);
    }

    getMonthsByCourse(courseId) {
        return this.getMonths().filter(month => month.courseId === courseId);
    }

    getStudentsByBatch(batchId) {
        return this.getStudents().filter(student => student.batchId === batchId);
    }

    getPaymentsByStudent(studentId) {
        return this.getPayments().filter(payment => payment.studentId === studentId);
    }

    // Get month payment details for a student
    getMonthPaymentDetails(studentId) {
        const payments = this.getPaymentsByStudent(studentId);
        const monthPayments = {};
        
        payments.forEach(payment => {
            if (payment.monthPayments) {
                payment.monthPayments.forEach(monthPayment => {
                    const monthId = monthPayment.monthId;
                    if (!monthPayments[monthId]) {
                        monthPayments[monthId] = {
                            totalPaid: 0,
                            totalDiscount: 0,
                            monthFee: monthPayment.monthFee || 0,
                            payments: []
                        };
                    }
                    monthPayments[monthId].totalPaid += monthPayment.paidAmount;
                    monthPayments[monthId].totalDiscount += (monthPayment.discountAmount || 0);
                    monthPayments[monthId].payments.push({
                        paymentId: payment.id,
                        paidAmount: monthPayment.paidAmount,
                        discountAmount: monthPayment.discountAmount || 0,
                        date: payment.createdAt
                    });
                });
            } else if (payment.months) {
                // Handle legacy payments
                payment.months.forEach(monthId => {
                    const month = this.getMonthById(monthId);
                    if (month) {
                        if (!monthPayments[monthId]) {
                            monthPayments[monthId] = {
                                totalPaid: 0,
                                totalDiscount: 0,
                                monthFee: month.payment,
                                payments: []
                            };
                        }
                        const amountPaid = payment.paidAmount / payment.months.length;
                        let discountAmount = 0;
                        if (payment.discountAmount > 0 && payment.discountApplicableMonths) {
                            if (payment.discountApplicableMonths.includes(monthId)) {
                                const applicableMonthsCount = payment.discountApplicableMonths.length;
                                if (applicableMonthsCount > 0) {
                                    if (payment.discountType === 'percentage') {
                                        const discountPercentage = parseFloat(payment.discountAmount || 0);
                                        discountAmount = (month.payment * discountPercentage) / 100;
                                    } else {
                                        discountAmount = payment.discountAmount / applicableMonthsCount;
                                    }
                                }
                            }
                        } else if (payment.discountAmount > 0) {
                            if (payment.discountType === 'percentage') {
                                const discountPercentage = parseFloat(payment.discountAmount || 0);
                                discountAmount = (month.payment * discountPercentage) / 100;
                            } else {
                                discountAmount = payment.discountAmount / payment.months.length;
                            }
                        }
                        
                        monthPayments[monthId].totalPaid += amountPaid;
                        monthPayments[monthId].totalDiscount += discountAmount;
                        monthPayments[monthId].payments.push({
                            paymentId: payment.id,
                            paidAmount: amountPaid,
                            discountAmount: discountAmount,
                            date: payment.createdAt
                        });
                    }
                });
            }
        });
        
        return monthPayments;
    }

    // Get payments with discounts
    getDiscountedPayments() {
        return this.getPayments().filter(payment => 
            payment.discountAmount && payment.discountAmount > 0
        );
    }
}

// Global storage manager instance
window.storageManager = new StorageManager();