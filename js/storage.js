class StorageManager {
    constructor() {
        this.supabase = null;
        this.init();
    }

    async init() {
        await this.waitForSupabase();
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
        console.log('Storage Manager: Supabase connected');
    }

    generateStudentId() {
        const year = new Date().getFullYear().toString().substr(-2);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `BTF${year}${random}`;
    }

    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `INV${year}${month}${random}`;
    }

    async addActivity(type, description, data = {}) {
        try {
            const user = window.authManager?.getCurrentUser();

            const { data: activity, error } = await this.supabase
                .from('activities')
                .insert([{
                    type,
                    description,
                    data,
                    user_id: user?.id || null,
                    username: user?.username || 'System'
                }])
                .select()
                .single();

            if (error) throw error;
            return activity;
        } catch (error) {
            console.error('Add activity error:', error);
            return null;
        }
    }

    async addBatch(batchData) {
        try {
            const { data: batch, error } = await this.supabase
                .from('batches')
                .insert([{ name: batchData.name }])
                .select()
                .single();

            if (error) throw error;

            await this.addActivity('batch_created', `Batch "${batch.name}" created`, { batchId: batch.id });
            return batch;
        } catch (error) {
            console.error('Add batch error:', error);
            throw error;
        }
    }

    async updateBatch(id, updates) {
        try {
            const { data: batch, error } = await this.supabase
                .from('batches')
                .update({ name: updates.name })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            await this.addActivity('batch_updated', `Batch "${batch.name}" updated`, { batchId: id });
            return batch;
        } catch (error) {
            console.error('Update batch error:', error);
            return null;
        }
    }

    async deleteBatch(id) {
        try {
            const { data: batch } = await this.supabase
                .from('batches')
                .select('name')
                .eq('id', id)
                .maybeSingle();

            if (!batch) {
                return { success: false, message: 'Batch not found' };
            }

            const { data: courses } = await this.supabase
                .from('courses')
                .select('id')
                .eq('batch_id', id)
                .limit(1);

            if (courses && courses.length > 0) {
                return { success: false, message: 'Cannot delete batch with existing courses' };
            }

            const { error } = await this.supabase
                .from('batches')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.addActivity('batch_deleted', `Batch "${batch.name}" deleted`, { batchId: id });
            return { success: true };
        } catch (error) {
            console.error('Delete batch error:', error);
            return { success: false, message: 'Failed to delete batch' };
        }
    }

    async addCourse(courseData) {
        try {
            const { data: course, error } = await this.supabase
                .from('courses')
                .insert([{
                    name: courseData.name,
                    batch_id: courseData.batchId
                }])
                .select()
                .single();

            if (error) throw error;

            await this.addActivity('course_created', `Course "${course.name}" created`, { courseId: course.id });
            return course;
        } catch (error) {
            console.error('Add course error:', error);
            throw error;
        }
    }

    async updateCourse(id, updates) {
        try {
            const { data: course, error } = await this.supabase
                .from('courses')
                .update({ name: updates.name })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            await this.addActivity('course_updated', `Course "${course.name}" updated`, { courseId: id });
            return course;
        } catch (error) {
            console.error('Update course error:', error);
            return null;
        }
    }

    async deleteCourse(id) {
        try {
            const { data: course } = await this.supabase
                .from('courses')
                .select('name')
                .eq('id', id)
                .maybeSingle();

            if (!course) {
                return { success: false, message: 'Course not found' };
            }

            const { data: months } = await this.supabase
                .from('months')
                .select('id')
                .eq('course_id', id)
                .limit(1);

            if (months && months.length > 0) {
                return { success: false, message: 'Cannot delete course with existing months' };
            }

            const { error } = await this.supabase
                .from('courses')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.addActivity('course_deleted', `Course "${course.name}" deleted`, { courseId: id });
            return { success: true };
        } catch (error) {
            console.error('Delete course error:', error);
            return { success: false, message: 'Failed to delete course' };
        }
    }

    async addMonth(monthData) {
        try {
            const { data: month, error } = await this.supabase
                .from('months')
                .insert([{
                    name: monthData.name,
                    month_number: monthData.monthNumber || 1,
                    course_id: monthData.courseId,
                    payment: monthData.payment
                }])
                .select()
                .single();

            if (error) throw error;

            await this.addActivity('month_created', `Month "${month.name}" created`, { monthId: month.id });
            return month;
        } catch (error) {
            console.error('Add month error:', error);
            throw error;
        }
    }

    async updateMonth(id, updates) {
        try {
            const updateData = {};
            if (updates.name) updateData.name = updates.name;
            if (updates.monthNumber) updateData.month_number = updates.monthNumber;
            if (updates.payment !== undefined) updateData.payment = updates.payment;

            const { data: month, error } = await this.supabase
                .from('months')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            await this.addActivity('month_updated', `Month "${month.name}" updated`, { monthId: id });
            return month;
        } catch (error) {
            console.error('Update month error:', error);
            return null;
        }
    }

    async deleteMonth(id) {
        try {
            const { data: month } = await this.supabase
                .from('months')
                .select('name')
                .eq('id', id)
                .maybeSingle();

            if (!month) {
                return { success: false, message: 'Month not found' };
            }

            const { error } = await this.supabase
                .from('months')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.addActivity('month_deleted', `Month "${month.name}" deleted`, { monthId: id });
            return { success: true };
        } catch (error) {
            console.error('Delete month error:', error);
            return { success: false, message: 'Failed to delete month' };
        }
    }

    async addInstitution(institutionData) {
        try {
            const { data: institution, error } = await this.supabase
                .from('institutions')
                .insert([{
                    name: institutionData.name,
                    address: institutionData.address || ''
                }])
                .select()
                .single();

            if (error) throw error;

            await this.addActivity('institution_created', `Institution "${institution.name}" created`, { institutionId: institution.id });
            return institution;
        } catch (error) {
            console.error('Add institution error:', error);
            throw error;
        }
    }

    async updateInstitution(id, updates) {
        try {
            const updateData = {};
            if (updates.name) updateData.name = updates.name;
            if (updates.address !== undefined) updateData.address = updates.address;

            const { data: institution, error } = await this.supabase
                .from('institutions')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            await this.addActivity('institution_updated', `Institution "${institution.name}" updated`, { institutionId: id });
            return institution;
        } catch (error) {
            console.error('Update institution error:', error);
            return null;
        }
    }

    async deleteInstitution(id) {
        try {
            const { data: institution } = await this.supabase
                .from('institutions')
                .select('name')
                .eq('id', id)
                .maybeSingle();

            if (!institution) {
                return { success: false, message: 'Institution not found' };
            }

            const { data: students } = await this.supabase
                .from('students')
                .select('id')
                .eq('institution_id', id)
                .limit(1);

            if (students && students.length > 0) {
                return { success: false, message: 'Cannot delete institution with existing students' };
            }

            const { error } = await this.supabase
                .from('institutions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.addActivity('institution_deleted', `Institution "${institution.name}" deleted`, { institutionId: id });
            return { success: true };
        } catch (error) {
            console.error('Delete institution error:', error);
            return { success: false, message: 'Failed to delete institution' };
        }
    }

    async addStudent(studentData) {
        try {
            const studentId = this.generateStudentId();

            const { data: student, error } = await this.supabase
                .from('students')
                .insert([{
                    student_id: studentId,
                    name: studentData.name,
                    institution_id: studentData.institutionId,
                    gender: studentData.gender,
                    phone: studentData.phone,
                    guardian_name: studentData.guardianName,
                    guardian_phone: studentData.guardianPhone,
                    batch_id: studentData.batchId,
                    enrolled_courses: studentData.enrolledCourses || []
                }])
                .select()
                .single();

            if (error) throw error;

            await this.addActivity('student_added', `Student "${student.name}" added with ID ${student.student_id}`, { studentId: student.id });
            return student;
        } catch (error) {
            console.error('Add student error:', error);
            throw error;
        }
    }

    async updateStudent(id, updates) {
        try {
            const updateData = {};
            if (updates.name) updateData.name = updates.name;
            if (updates.institutionId) updateData.institution_id = updates.institutionId;
            if (updates.gender) updateData.gender = updates.gender;
            if (updates.phone) updateData.phone = updates.phone;
            if (updates.guardianName) updateData.guardian_name = updates.guardianName;
            if (updates.guardianPhone) updateData.guardian_phone = updates.guardianPhone;
            if (updates.batchId) updateData.batch_id = updates.batchId;
            if (updates.enrolledCourses) updateData.enrolled_courses = updates.enrolledCourses;

            const { data: student, error } = await this.supabase
                .from('students')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            await this.addActivity('student_updated', `Student "${student.name}" updated`, { studentId: id });
            return student;
        } catch (error) {
            console.error('Update student error:', error);
            return null;
        }
    }

    async deleteStudent(id) {
        try {
            const { data: student } = await this.supabase
                .from('students')
                .select('name')
                .eq('id', id)
                .maybeSingle();

            if (!student) {
                return { success: false, message: 'Student not found' };
            }

            const { error } = await this.supabase
                .from('students')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.addActivity('student_deleted', `Student "${student.name}" deleted`, { studentId: id });
            return { success: true };
        } catch (error) {
            console.error('Delete student error:', error);
            return { success: false, message: 'Failed to delete student' };
        }
    }

    async addPayment(paymentData) {
        try {
            const invoiceNumber = this.generateInvoiceNumber();
            const user = window.authManager?.getCurrentUser();

            const { data: payment, error } = await this.supabase
                .from('payments')
                .insert([{
                    invoice_number: invoiceNumber,
                    student_id: paymentData.studentId,
                    student_name: paymentData.studentName,
                    student_display_id: paymentData.studentDisplayId,
                    batch_id: paymentData.batchId,
                    courses: paymentData.courses || [],
                    months: paymentData.months || [],
                    month_payments: paymentData.monthPayments || [],
                    total_amount: paymentData.totalAmount,
                    discount_type: paymentData.discountType || 'fixed',
                    discount_amount: paymentData.discountAmount || 0,
                    discount_applicable_months: paymentData.discountApplicableMonths || [],
                    discounted_amount: paymentData.discountedAmount,
                    paid_amount: paymentData.paidAmount,
                    due_amount: paymentData.dueAmount || 0,
                    reference: paymentData.reference || '',
                    received_by: paymentData.receivedBy || '',
                    created_by: user?.id || null
                }])
                .select()
                .single();

            if (error) throw error;

            await this.addActivity('payment_received', `Payment of ৳${payment.paid_amount} received from ${payment.student_name}`, { paymentId: payment.id });
            return payment;
        } catch (error) {
            console.error('Add payment error:', error);
            throw error;
        }
    }

    async getBatches() {
        try {
            if (!this.supabase) {
                console.warn('Supabase client not initialized in getBatches');
                return [];
            }

            const { data, error } = await this.supabase
                .from('batches')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get batches error:', error);
            return [];
        }
    }

    async getCourses() {
        try {
            if (!this.supabase) {
                console.warn('Supabase client not initialized in getCourses');
                return [];
            }

            const { data, error } = await this.supabase
                .from('courses')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get courses error:', error);
            return [];
        }
    }

    async getMonths() {
        try {
            const { data, error } = await this.supabase
                .from('months')
                .select('*')
                .order('month_number', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get months error:', error);
            return [];
        }
    }

    async getInstitutions() {
        try {
            if (!this.supabase) {
                console.warn('Supabase client not initialized in getInstitutions');
                return [];
            }

            const { data, error } = await this.supabase
                .from('institutions')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get institutions error:', error);
            return [];
        }
    }

    async getStudents() {
        try {
            if (!this.supabase) {
                console.warn('Supabase client not initialized in getStudents');
                return [];
            }

            const { data, error } = await this.supabase
                .from('students')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get students error:', error);
            return [];
        }
    }

    async getPayments() {
        try {
            if (!this.supabase) {
                console.warn('Supabase client not initialized in getPayments');
                return [];
            }

            const { data, error } = await this.supabase
                .from('payments')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get payments error:', error);
            return [];
        }
    }

    async getActivities() {
        try {
            const { data, error } = await this.supabase
                .from('activities')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get activities error:', error);
            return [];
        }
    }

    async getBatchById(id) {
        try {
            const { data, error } = await this.supabase
                .from('batches')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get batch error:', error);
            return null;
        }
    }

    async getCourseById(id) {
        try {
            const { data, error } = await this.supabase
                .from('courses')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get course error:', error);
            return null;
        }
    }

    async getMonthById(id) {
        try {
            const { data, error } = await this.supabase
                .from('months')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get month error:', error);
            return null;
        }
    }

    async getInstitutionById(id) {
        try {
            const { data, error } = await this.supabase
                .from('institutions')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get institution error:', error);
            return null;
        }
    }

    async getStudentById(id) {
        try {
            const { data, error } = await this.supabase
                .from('students')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get student error:', error);
            return null;
        }
    }

    async getStudentByStudentId(studentId) {
        try {
            const { data, error } = await this.supabase
                .from('students')
                .select('*')
                .eq('student_id', studentId)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get student error:', error);
            return null;
        }
    }

    async getCoursesByBatch(batchId) {
        try {
            const { data, error } = await this.supabase
                .from('courses')
                .select('*')
                .eq('batch_id', batchId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get courses error:', error);
            return [];
        }
    }

    async getMonthsByCourse(courseId) {
        try {
            const { data, error } = await this.supabase
                .from('months')
                .select('*')
                .eq('course_id', courseId)
                .order('month_number', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get months error:', error);
            return [];
        }
    }

    async getStudentsByBatch(batchId) {
        try {
            const { data, error } = await this.supabase
                .from('students')
                .select('*')
                .eq('batch_id', batchId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get students error:', error);
            return [];
        }
    }

    async getPaymentsByStudent(studentId) {
        try {
            const { data, error } = await this.supabase
                .from('payments')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get payments error:', error);
            return [];
        }
    }

    async getMonthPaymentDetails(studentId) {
        const payments = await this.getPaymentsByStudent(studentId);
        const monthPayments = {};

        for (const payment of payments) {
            if (payment.month_payments && Array.isArray(payment.month_payments)) {
                for (const monthPayment of payment.month_payments) {
                    const monthId = monthPayment.monthId;
                    if (!monthPayments[monthId]) {
                        monthPayments[monthId] = {
                            totalPaid: 0,
                            totalDiscount: 0,
                            monthFee: monthPayment.monthFee || 0,
                            payments: []
                        };
                    }
                    monthPayments[monthId].totalPaid += monthPayment.paidAmount || 0;
                    monthPayments[monthId].totalDiscount += (monthPayment.discountAmount || 0);
                    monthPayments[monthId].payments.push({
                        paymentId: payment.id,
                        paidAmount: monthPayment.paidAmount,
                        discountAmount: monthPayment.discountAmount || 0,
                        date: payment.created_at
                    });
                }
            }
        }

        return monthPayments;
    }

    async getDiscountedPayments() {
        try {
            const { data, error } = await this.supabase
                .from('payments')
                .select('*')
                .gt('discount_amount', 0)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get discounted payments error:', error);
            return [];
        }
    }

    async getReferenceOptions() {
        try {
            if (!this.supabase) {
                console.warn('Supabase client not initialized in getReferenceOptions');
                return [];
            }

            const { data, error } = await this.supabase
                .from('reference_options')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get reference options error:', error);
            return [];
        }
    }

    async addReferenceOption(name) {
        try {
            const { data, error } = await this.supabase
                .from('reference_options')
                .insert([{ name }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Add reference option error:', error);
            throw error;
        }
    }

    async deleteReferenceOption(id) {
        try {
            const { error } = await this.supabase
                .from('reference_options')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete reference option error:', error);
            return { success: false, message: 'Failed to delete reference option' };
        }
    }

    async getReceiverOptions() {
        try {
            if (!this.supabase) {
                console.warn('Supabase client not initialized in getReceiverOptions');
                return [];
            }

            const { data, error } = await this.supabase
                .from('receiver_options')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get receiver options error:', error);
            return [];
        }
    }

    async addReceiverOption(name) {
        try {
            const { data, error } = await this.supabase
                .from('receiver_options')
                .insert([{ name }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Add receiver option error:', error);
            throw error;
        }
    }

    async deleteReceiverOption(id) {
        try {
            const { error } = await this.supabase
                .from('receiver_options')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete receiver option error:', error);
            return { success: false, message: 'Failed to delete receiver option' };
        }
    }
}

window.storageManager = new StorageManager();
