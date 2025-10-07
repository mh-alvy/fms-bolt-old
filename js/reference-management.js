class ReferenceManagementManager {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        this.bindEvents();
        await this.refresh();
    }

    bindEvents() {
        const addReferenceForm = document.getElementById('addReferenceForm');
        if (addReferenceForm) {
            addReferenceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addReference();
            });
        }

        const addReceivedByForm = document.getElementById('addReceivedByForm');
        if (addReceivedByForm) {
            addReceivedByForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addReceivedBy();
            });
        }
    }

    async addReference() {
        const referenceText = document.getElementById('newReference').value.trim();

        if (!referenceText) {
            Utils.showToast('Please enter a reference option', 'error');
            return;
        }

        try {
            await window.storageManager.addReferenceOption(referenceText);
            Utils.showToast('Reference option added successfully', 'success');
            document.getElementById('addReferenceForm').reset();
            await this.refresh();
            await this.updateReferenceDropdowns();
        } catch (error) {
            if (error.code === '23505') {
                Utils.showToast('Reference option already exists', 'error');
            } else {
                Utils.showToast('Failed to add reference option', 'error');
            }
        }
    }

    async addReceivedBy() {
        const receivedByText = document.getElementById('newReceivedBy').value.trim();

        if (!receivedByText) {
            Utils.showToast('Please enter a receiver name', 'error');
            return;
        }

        try {
            await window.storageManager.addReceiverOption(receivedByText);
            Utils.showToast('Receiver option added successfully', 'success');
            document.getElementById('addReceivedByForm').reset();
            await this.refresh();
            await this.updateReceivedByDropdowns();
        } catch (error) {
            if (error.code === '23505') {
                Utils.showToast('Receiver option already exists', 'error');
            } else {
                Utils.showToast('Failed to add receiver option', 'error');
            }
        }
    }

    async refresh() {
        await this.loadReferenceOptions();
        await this.loadReceivedByOptions();
        await this.updateReferenceDropdowns();
        await this.updateReceivedByDropdowns();
    }

    async loadReferenceOptions() {
        const referenceList = document.getElementById('referenceOptionsList');
        if (!referenceList) return;

        const references = await window.storageManager.getReferenceOptions();

        if (references.length === 0) {
            referenceList.innerHTML = '<p class="text-center">No reference options created yet</p>';
            return;
        }

        referenceList.innerHTML = references.map(reference => `
            <div class="entity-item">
                <div class="entity-info">
                    <div class="entity-name">${reference.name}</div>
                </div>
                <div class="entity-actions">
                    <button class="btn btn-small btn-danger" onclick="referenceManagementManager.deleteReference('${reference.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    async loadReceivedByOptions() {
        const receivedByList = document.getElementById('receivedByOptionsList');
        if (!receivedByList) return;

        const options = await window.storageManager.getReceiverOptions();

        if (options.length === 0) {
            receivedByList.innerHTML = '<p class="text-center">No receiver options created yet</p>';
            return;
        }

        receivedByList.innerHTML = options.map(option => `
            <div class="entity-item">
                <div class="entity-info">
                    <div class="entity-name">${option.name}</div>
                </div>
                <div class="entity-actions">
                    <button class="btn btn-small btn-danger" onclick="referenceManagementManager.deleteReceivedBy('${option.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    async updateReferenceDropdowns() {
        const referenceSelect = document.getElementById('referenceSelect');
        if (!referenceSelect) return;

        const references = await window.storageManager.getReferenceOptions();

        referenceSelect.innerHTML = '<option value="">Select Reference</option>' +
            references.map(ref => `<option value="${ref.name}">${ref.name}</option>`).join('') +
            '<option value="custom">Custom</option>';
    }

    async updateReceivedByDropdowns() {
        const receivedBySelect = document.getElementById('receivedBySelect');
        if (!receivedBySelect) return;

        const options = await window.storageManager.getReceiverOptions();

        receivedBySelect.innerHTML = '<option value="">Select Receiver</option>' +
            options.map(option => `<option value="${option.name}">${option.name}</option>`).join('') +
            '<option value="custom">Custom</option>';
    }

    async deleteReference(id) {
        Utils.confirm('Are you sure you want to delete this reference option?', async () => {
            const result = await window.storageManager.deleteReferenceOption(id);
            if (result.success) {
                Utils.showToast('Reference option deleted successfully', 'success');
                await this.refresh();
            } else {
                Utils.showToast('Failed to delete reference option', 'error');
            }
        });
    }

    async deleteReceivedBy(id) {
        Utils.confirm('Are you sure you want to delete this receiver option?', async () => {
            const result = await window.storageManager.deleteReceiverOption(id);
            if (result.success) {
                Utils.showToast('Receiver option deleted successfully', 'success');
                await this.refresh();
            } else {
                Utils.showToast('Failed to delete receiver option', 'error');
            }
        });
    }
}

window.referenceManagementManager = new ReferenceManagementManager();
