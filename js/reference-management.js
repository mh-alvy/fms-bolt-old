// Reference Management
class ReferenceManagementManager {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        this.bindEvents();
        this.refresh();
    }

    bindEvents() {
        // Add Reference Form
        const addReferenceForm = document.getElementById('addReferenceForm');
        if (addReferenceForm) {
            addReferenceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addReference();
            });
        }

        // Add Received By Form
        const addReceivedByForm = document.getElementById('addReceivedByForm');
        if (addReceivedByForm) {
            addReceivedByForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addReceivedBy();
            });
        }
    }

    addReference() {
        const referenceText = document.getElementById('newReference').value.trim();
        
        if (!referenceText) {
            Utils.showToast('Please enter a reference option', 'error');
            return;
        }

        const references = this.getReferences();
        
        // Check if reference already exists
        if (references.includes(referenceText)) {
            Utils.showToast('Reference option already exists', 'error');
            return;
        }

        references.push(referenceText);
        this.saveReferences(references);
        
        Utils.showToast('Reference option added successfully', 'success');
        document.getElementById('addReferenceForm').reset();
        this.refresh();
        this.updateReferenceDropdowns();
    }

    addReceivedBy() {
        const receivedByText = document.getElementById('newReceivedBy').value.trim();
        
        if (!receivedByText) {
            Utils.showToast('Please enter a receiver name', 'error');
            return;
        }

        const receivedByOptions = this.getReceivedByOptions();
        
        // Check if option already exists
        if (receivedByOptions.includes(receivedByText)) {
            Utils.showToast('Receiver option already exists', 'error');
            return;
        }

        receivedByOptions.push(receivedByText);
        this.saveReceivedByOptions(receivedByOptions);
        
        Utils.showToast('Receiver option added successfully', 'success');
        document.getElementById('addReceivedByForm').reset();
        this.refresh();
        this.updateReceivedByDropdowns();
    }

    getReferences() {
        try {
            // This will be loaded from API
            return this.references || ["Cash Payment", "Bank Transfer", "Mobile Banking", "Check Payment"];
        } catch (e) {
            return ["Cash Payment", "Bank Transfer", "Mobile Banking", "Check Payment"];
        }
    }

    getReceivedByOptions() {
        try {
            // This will be loaded from API
            return this.receivedByOptions || ["Reception Desk", "Admin Office", "Accounts Department"];
        } catch (e) {
            return ["Reception Desk", "Admin Office", "Accounts Department"];
        }
    }

    async loadReferences() {
        try {
            this.references = await window.apiService.getReferences();
        } catch (error) {
            console.error('Error loading references:', error);
            this.references = ["Cash Payment", "Bank Transfer", "Mobile Banking", "Check Payment"];
        }
    }

    async loadReceivedByOptions() {
        try {
            this.receivedByOptions = await window.apiService.getReceivedByOptions();
        } catch (error) {
            console.error('Error loading received by options:', error);
            this.receivedByOptions = ["Reception Desk", "Admin Office", "Accounts Department"];
        }
    }

    async refresh() {
        await this.loadReferences();
        await this.loadReceivedByOptions();
        this.loadReferenceOptions();
        this.loadReceivedByOptions();
        this.updateReferenceDropdowns();
        this.updateReceivedByDropdowns();
    }

    async addReference() {
        const referenceList = document.getElementById('referenceOptionsList');
        if (!referenceList) return;

        const references = this.getReferences();
        
        if (references.length === 0) {
            referenceList.innerHTML = '<p class="text-center">No reference options created yet</p>';
            return;
        }

        referenceList.innerHTML = references.map((reference, index) => `
            <div class="entity-item">
                <div class="entity-info">
                    <div class="entity-name">${reference}</div>
                </div>
                <div class="entity-actions">
                    <button class="btn btn-small btn-outline" onclick="referenceManagementManager.editReference(${index})">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="referenceManagementManager.deleteReference(${index})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    loadReceivedByOptions() {
        const receivedByList = document.getElementById('receivedByOptionsList');
        if (!receivedByList) return;

        try {
            await window.apiService.addReference(referenceText);
            Utils.showToast('Reference option added successfully', 'success');
            document.getElementById('addReferenceForm').reset();
            await this.refresh();
        } catch (error) {
            Utils.showToast(error.message || 'Error adding reference option', 'error');

                </div>
            </div>
        }
    }
    async addReceivedBy() {
    }

    updateReferenceDropdowns() {
        const referenceSelect = document.getElementById('referenceSelect');
        if (!referenceSelect) return;

        const references = this.getReferences();
        try {
            await window.apiService.addReceivedBy(receivedByText);
            Utils.showToast('Receiver option added successfully', 'success');
            document.getElementById('addReceivedByForm').reset();
            await this.refresh();
        } catch (error) {
            Utils.showToast(error.message || 'Error adding receiver option', 'error');
        }
    }
    updateReceivedByDropdowns() {
    }

    async editReference(index) {
        const references = this.getReferences();
        const currentReference = references[index];
        
        const newReference = prompt('Edit reference option:', currentReference);
        if (newReference && newReference !== currentReference) {
            try {
                // Delete old and add new (since we don't have update endpoint)
                await window.apiService.deleteReference(index);
                await window.apiService.addReference(Utils.sanitizeInput(newReference));
                Utils.showToast('Reference option updated successfully', 'success');
                await this.refresh();
            } catch (error) {
                Utils.showToast(error.message || 'Error updating reference option', 'error');
            }
        }
    }

    async editReceivedBy(index) {
        const options = this.getReceivedByOptions();
        const currentOption = options[index];
        
        const newOption = prompt('Edit receiver option:', currentOption);
        if (newOption && newOption !== currentOption) {
            try {
                // Delete old and add new (since we don't have update endpoint)
                await window.apiService.deleteReceivedBy(index);
                await window.apiService.addReceivedBy(Utils.sanitizeInput(newOption));
                Utils.showToast('Receiver option updated successfully', 'success');
                await this.refresh();
            } catch (error) {
                Utils.showToast(error.message || 'Error updating receiver option', 'error');
            }
        }
    }

    async deleteReference(index) {
        const references = this.getReferences();
        const referenceToDelete = references[index];
        
        Utils.confirm(`Are you sure you want to delete "${referenceToDelete}"?`, async () => {
            try {
                await window.apiService.deleteReference(index);
                Utils.showToast('Reference option deleted successfully', 'success');
                await this.refresh();
            } catch (error) {
                Utils.showToast(error.message || 'Error deleting reference option', 'error');
            }
        });
    }

    async deleteReceivedBy(index) {
        const options = this.getReceivedByOptions();
        const optionToDelete = options[index];
        
        Utils.confirm(`Are you sure you want to delete "${optionToDelete}"?`, async () => {
            try {
                await window.apiService.deleteReceivedBy(index);
                Utils.showToast('Receiver option deleted successfully', 'success');
                await this.refresh();
            } catch (error) {
                Utils.showToast(error.message || 'Error deleting receiver option', 'error');
            }
        });
    }
}

// Global reference management manager instance
window.referenceManagementManager = new ReferenceManagementManager();