// Theia Jewelz Enhanced Web Application
class TheiaJewelzApp {
    constructor() {
        this.currentPage = 'login-page';
        this.salesData = [];
        this.customersData = [];
        this.selectedSales = new Set();
        this.selectedCustomers = new Set();
        this.isFirebaseInitialized = false;
        this.currentUser = null;
        this.settings = {
            primaryColor: '#4285f4',
            buttonColor: '#34a853',
            accentColor: '#ea4335',
            currency: '₹',
            dateFormat: 'DD/MM/YYYY',
            autoBackup: false
        };
        this.charts = {};
        this.categories = ['necklaces', 'rings', 'earrings', 'bracelets', 'chains', 'sets', 'pendants', 'bangles'];
        this.excelHandler = null;
        this.editingSaleId = null;
        this.init();
    }

    async init() {
        console.log('Initializing Theia Jewelz App...');
        
        // Initialize Firebase
        await this.initializeFirebase();
        
        // Initialize Excel Handler
        await this.initializeExcelHandler();
        
        // Load settings
        this.loadSettings();
        
        // Apply saved colors
        this.applyColors();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check if user is logged in
        this.checkLoginStatus();
        
        console.log('App initialized successfully');
    }

    async initializeFirebase() {
        try {
            // Check if Firebase is already initialized by firebase-config.js
            if (typeof firebase !== 'undefined' && typeof db !== 'undefined' && db !== null) {
                this.db = db;
                this.auth = auth;
                this.isFirebaseInitialized = true;
                console.log('Firebase already initialized, using existing instance');
            } else {
                console.warn('Firebase not available, using local storage');
                this.isFirebaseInitialized = false;
            }
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.isFirebaseInitialized = false;
        }
    }

    async initializeExcelHandler() {
        try {
            // Initialize Excel Handler with inline class since module import might not work
            this.excelHandler = new ExcelHandler();
            console.log('Excel handler initialized');
        } catch (error) {
            console.error('Excel handler initialization failed:', error);
            // Create a simple fallback handler
            this.excelHandler = {
                exportToExcel: (data, filename) => {
                    console.warn('Excel export not available');
                    this.showMessage('Excel export functionality not available', 'warning');
                },
                importFromExcel: () => {
                    console.warn('Excel import not available');
                    this.showMessage('Excel import functionality not available', 'warning');
                }
            };
        }
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Add sale form submission
        const addSaleForm = document.getElementById('add-sale-form');
        if (addSaleForm) {
            addSaleForm.addEventListener('submit', (e) => this.handleAddSale(e));
        }

        // Category checkboxes
        this.setupCategoryCheckboxes();

        // Customer search functionality
        const customerSearch = document.getElementById('customer-search');
        if (customerSearch) {
            customerSearch.addEventListener('input', (e) => this.handleCustomerSearch(e));
        }

        // Profit calculation
        const costPrice = document.getElementById('cost-price');
        const sellingPrice = document.getElementById('selling-price');
        const shippingCost = document.getElementById('shipping-cost');
        
        if (costPrice && sellingPrice && shippingCost) {
            costPrice.addEventListener('input', () => this.calculateProfit());
            sellingPrice.addEventListener('input', () => this.calculateProfit());
            shippingCost.addEventListener('input', () => this.calculateProfit());
        }

        // Change password form
        const changePasswordForm = document.getElementById('change-password-form');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => this.handleChangePassword(e));
        }

        // Import file handlers
        const importFile = document.getElementById('import-file');
        if (importFile) {
            importFile.addEventListener('change', (e) => this.handleImportSales(e));
        }

        const importCustomersFile = document.getElementById('import-customers-file');
        if (importCustomersFile) {
            importCustomersFile.addEventListener('change', (e) => this.handleImportCustomers(e));
        }

        // Edit form profit calculation
        const editCostPrice = document.getElementById('edit-cost-price');
        const editSellingPrice = document.getElementById('edit-selling-price');
        const editShippingCost = document.getElementById('edit-shipping-cost');
        
        if (editCostPrice && editSellingPrice && editShippingCost) {
            editCostPrice.addEventListener('input', () => this.calculateEditProfit());
            editSellingPrice.addEventListener('input', () => this.calculateEditProfit());
            editShippingCost.addEventListener('input', () => this.calculateEditProfit());
        }

        // Set up navigation click handlers
        window.navigateTo = (page) => this.navigateTo(page);
        window.logout = () => this.logout();
        window.applyFilters = () => this.applyFilters();
        window.togglePassword = () => this.togglePassword();
        window.previewReceipt = () => this.previewReceipt();
        
        // Global functions
        window.editSale = (id) => this.editSale(id);
        window.deleteSale = (id) => this.deleteSale(id);
        window.generateReceipt = (id) => this.generateReceipt(id);
        window.toggleSelectAll = () => this.toggleSelectAll();
        window.deleteSelected = () => this.deleteSelected();
        window.deleteAll = () => this.deleteAll();
        window.exportSales = () => this.exportSales();
        window.importSales = () => this.importSales();
        
        // Customer functions
        window.addNewCustomer = () => this.addNewCustomer();
        window.exportCustomers = () => this.exportCustomers();
        window.importCustomers = () => this.importCustomers();
        window.deleteSelectedCustomers = () => this.deleteSelectedCustomers();
        window.deleteAllCustomers = () => this.deleteAllCustomers();
        window.toggleSelectAllCustomers = () => this.toggleSelectAllCustomers();
        window.editCustomer = (id) => this.editCustomer(id);
        window.deleteCustomer = (id) => this.deleteCustomer(id);
        
        // Edit sale functions
        window.closeEditSaleModal = () => this.closeEditSaleModal();
        window.saveEditedSale = () => this.saveEditedSale();
        
        // Settings functions
        window.openChangePasswordModal = () => this.openChangePasswordModal();
        window.closeChangePasswordModal = () => this.closeChangePasswordModal();
        window.updatePrimaryColor = (color) => this.updatePrimaryColor(color);
        window.updateButtonColor = (color) => this.updateButtonColor(color);
        window.updateAccentColor = (color) => this.updateAccentColor(color);
        window.resetColors = () => this.resetColors();
        window.updateCurrency = (currency) => this.updateCurrency(currency);
        window.updateDateFormat = (format) => this.updateDateFormat(format);
        window.toggleAutoBackup = (enabled) => this.toggleAutoBackup(enabled);
        window.backupData = () => this.backupData();
        window.restoreData = () => this.restoreData();
        window.clearAllData = () => this.clearAllData();
        
        // Modal functions
        window.closeReceiptModal = () => this.closeReceiptModal();
        window.printReceipt = () => this.printReceipt();
    }

    setupCategoryCheckboxes() {
        this.categories.forEach(category => {
            const checkbox = document.getElementById(`cat-${category}`);
            const quantityInput = document.getElementById(`qty-${category}`);
            
            if (checkbox && quantityInput) {
                checkbox.addEventListener('change', (e) => {
                    quantityInput.disabled = !e.target.checked;
                    if (e.target.checked) {
                        quantityInput.value = '1';
                        quantityInput.focus();
                    } else {
                        quantityInput.value = '';
                    }
                });
            }
        });
    }

    checkLoginStatus() {
        const savedUser = localStorage.getItem('theiaJewelzUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.navigateTo('homepage');
            this.updateWelcomeMessage();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');

        console.log('Login attempt:', { username, password: '***' });
        this.showLoading(true);

        try {
            // For demo purposes, using simple authentication
            // In production, this should be properly secured
            const validCredentials = await this.validateCredentials(username, password);
            console.log('Credentials validation result:', validCredentials);
            
            if (validCredentials) {
                this.currentUser = { username, loginTime: new Date().toISOString() };
                localStorage.setItem('theiaJewelzUser', JSON.stringify(this.currentUser));
                
                // Load data after successful login
                await this.loadData();
                
                this.showMessage('Login successful!', 'success');
                this.navigateTo('homepage');
                this.updateWelcomeMessage();
            } else {
                throw new Error('Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage(error.message || 'Login failed', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async validateCredentials(username, password) {
        try {
            console.log('Validating credentials for:', username);
            console.log('Firebase initialized:', this.isFirebaseInitialized);
            
            if (this.isFirebaseInitialized) {
                console.log('Checking Firebase for user credentials...');
                // Check Firebase for user credentials
                const userDoc = await this.db.collection('users').doc(username).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    console.log('User found in Firebase');
                    // In production, use proper password hashing
                    return userData.password === this.hashPassword(password);
                } else {
                    console.log('User not found in Firebase, using fallback');
                }
            }
            
            // Fallback to default credentials
            console.log('Using fallback credentials validation');
            const isValid = (username === 'admin' && password === 'admin123') || 
                           (username === 'user' && password === 'user123');
            console.log('Fallback validation result:', isValid);
            return isValid;
        } catch (error) {
            console.error('Credential validation error:', error);
            // Fallback to default credentials
            console.log('Error occurred, using fallback credentials');
            const isValid = (username === 'admin' && password === 'admin123') || 
                           (username === 'user' && password === 'user123');
            console.log('Error fallback validation result:', isValid);
            return isValid;
        }
    }

    hashPassword(password) {
        // Simple hash for demo - use proper hashing in production
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    updateWelcomeMessage() {
        const welcomeElement = document.getElementById('welcome-user');
        if (welcomeElement && this.currentUser) {
            welcomeElement.textContent = `Welcome, ${this.currentUser.username}`;
        }
    }

    togglePassword() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('.toggle-password');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }

    logout() {
        localStorage.removeItem('theiaJewelzUser');
        this.currentUser = null;
        this.navigateTo('login-page');
        this.showMessage('Logged out successfully', 'success');
    }

    navigateTo(page) {
        // Hide current page
        const currentPageElement = document.getElementById(this.currentPage);
        if (currentPageElement) {
            currentPageElement.classList.remove('active');
        }

        // Show new page
        const newPageElement = document.getElementById(page);
        if (newPageElement) {
            newPageElement.classList.add('active');
            this.currentPage = page;

            // Page-specific initialization
            switch (page) {
                case 'homepage':
                    this.updateWelcomeMessage();
                    break;
                case 'dashboard':
                    this.updateDashboard();
                    this.initializeCharts();
                    break;
                case 'recent-sales':
                    this.renderSalesList();
                    break;
                case 'customers':
                    this.renderCustomersList();
                    break;
                case 'analytics':
                    this.initializeAnalyticsCharts();
                    break;
                case 'add-sale':
                    this.setDefaultSaleDate();
                    break;
                case 'settings':
                    this.loadSettingsUI();
                    break;
            }
        }
    }

    async loadData() {
        try {
            if (this.isFirebaseInitialized) {
                await this.loadFromFirebase();
            } else {
                this.loadFromLocalStorage();
            }
            
            this.updateDashboard();
            this.renderSalesList();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showMessage('Error loading data', 'error');
        }
    }

    async loadFromFirebase() {
        try {
            // Load sales data
            const salesSnapshot = await this.db.collection('sales').orderBy('saleDate', 'desc').get();
            this.salesData = salesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load customers data
            const customersSnapshot = await this.db.collection('customers').get();
            this.customersData = customersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load settings
            const settingsSnapshot = await this.db.collection('settings').doc('app').get();
            if (settingsSnapshot.exists) {
                this.settings = { ...this.settings, ...settingsSnapshot.data() };
            }

            console.log('Data loaded from Firebase');
        } catch (error) {
            console.error('Error loading from Firebase:', error);
            this.loadFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        this.salesData = JSON.parse(localStorage.getItem('theiaJewelzSales') || '[]');
        this.customersData = JSON.parse(localStorage.getItem('theiaJewelzCustomers') || '[]');
        this.settings = { ...this.settings, ...JSON.parse(localStorage.getItem('theiaJewelzSettings') || '{}') };
        console.log('Data loaded from local storage');
    }

    saveToLocalStorage() {
        localStorage.setItem('theiaJewelzSales', JSON.stringify(this.salesData));
        localStorage.setItem('theiaJewelzCustomers', JSON.stringify(this.customersData));
        localStorage.setItem('theiaJewelzSettings', JSON.stringify(this.settings));
    }

    async saveToFirebase(collection, data, docId = null) {
        if (!this.isFirebaseInitialized) return null;
        
        try {
            if (docId) {
                await this.db.collection(collection).doc(docId).set(data, { merge: true });
                return docId;
            } else {
                const docRef = await this.db.collection(collection).add(data);
                return docRef.id;
            }
        } catch (error) {
            console.error(`Error saving to Firebase ${collection}:`, error);
            throw error;
        }
    }

    calculateProfit() {
        const costPrice = parseFloat(document.getElementById('cost-price').value) || 0;
        const sellingPrice = parseFloat(document.getElementById('selling-price').value) || 0;
        const shippingCost = parseFloat(document.getElementById('shipping-cost').value) || 0;
        
        const profit = sellingPrice - costPrice - shippingCost;
        document.getElementById('profit').value = profit.toFixed(2);
    }

    async handleCustomerSearch(e) {
        const searchTerm = e.target.value.trim();
        const suggestionsDropdown = document.getElementById('customer-suggestions');
        
        if (searchTerm.length < 2) {
            suggestionsDropdown.style.display = 'none';
            return;
        }

        try {
            const customers = this.customersData.filter(customer =>
                customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.phone.includes(searchTerm)
            );

            this.displayCustomerSuggestions(customers, suggestionsDropdown);
        } catch (error) {
            console.error('Error searching customers:', error);
        }
    }

    displayCustomerSuggestions(customers, dropdown) {
        dropdown.innerHTML = '';
        
        if (customers.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        customers.slice(0, 5).forEach(customer => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.innerHTML = `
                <div>
                    <strong>${customer.name}</strong><br>
                    <small>${customer.phone} • ${customer.email || 'No email'}</small>
                </div>
            `;

            suggestionItem.addEventListener('click', () => {
                this.fillCustomerForm(customer);
                dropdown.style.display = 'none';
            });

            dropdown.appendChild(suggestionItem);
        });

        dropdown.style.display = 'block';
    }

    fillCustomerForm(customer) {
        document.getElementById('customer-name').value = customer.name || '';
        document.getElementById('phone-number').value = customer.phone || '';
        document.getElementById('email').value = customer.email || '';
        document.getElementById('address').value = customer.address || '';
        document.getElementById('customer-search').value = customer.name || '';
    }

    async handleAddSale(e) {
        e.preventDefault();
        
        this.showLoading(true);

        try {
            const formData = new FormData(e.target);
            
            // Get selected categories and quantities
            const selectedCategories = [];
            
            this.categories.forEach(category => {
                const checkbox = document.getElementById(`cat-${category}`);
                const quantityInput = document.getElementById(`qty-${category}`);
                
                if (checkbox && checkbox.checked) {
                    const quantity = parseInt(quantityInput.value) || 1;
                    selectedCategories.push({
                        category: checkbox.value,
                        quantity: quantity
                    });
                }
            });

            if (selectedCategories.length === 0) {
                throw new Error('Please select at least one category');
            }
            
            const saleData = {
                customerName: formData.get('customerName'),
                phoneNumber: formData.get('phoneNumber'),
                email: formData.get('email'),
                address: formData.get('address'),
                categories: selectedCategories,
                saleDate: formData.get('saleDate'),
                costPrice: parseFloat(formData.get('costPrice')),
                sellingPrice: parseFloat(formData.get('sellingPrice')),
                shippingCost: parseFloat(formData.get('shippingCost')) || 0,
                profit: parseFloat(formData.get('profit')),
                paymentMode: formData.get('paymentMode'),
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser?.username || 'unknown'
            };

            // Validate required fields
            if (!saleData.customerName || !saleData.phoneNumber || !saleData.costPrice || !saleData.sellingPrice) {
                throw new Error('Please fill in all required fields');
            }

            // Save to Firebase if available
            let saleId;
            if (this.isFirebaseInitialized) {
                saleId = await this.saveToFirebase('sales', saleData);
                saleData.id = saleId;
                console.log('Sale saved to Firebase with ID:', saleId);
            } else {
                saleData.id = Date.now().toString();
            }

            // Add to local data
            this.salesData.unshift(saleData);

            // Save customer if new
            await this.saveCustomer({
                name: saleData.customerName,
                phone: saleData.phoneNumber,
                email: saleData.email,
                address: saleData.address
            });

            // Save to local storage as backup
            this.saveToLocalStorage();

            // Reset form
            e.target.reset();
            this.setDefaultSaleDate();
            document.getElementById('profit').value = '';
            
            // Reset category checkboxes
            this.categories.forEach(category => {
                const checkbox = document.getElementById(`cat-${category}`);
                const quantityInput = document.getElementById(`qty-${category}`);
                if (checkbox) checkbox.checked = false;
                if (quantityInput) {
                    quantityInput.disabled = true;
                    quantityInput.value = '';
                }
            });

            // Show success message
            this.showMessage('Sale added successfully!', 'success');

            // Navigate back to homepage
            setTimeout(() => {
                this.navigateTo('homepage');
            }, 1500);

        } catch (error) {
            console.error('Error adding sale:', error);
            this.showMessage(error.message || 'Error adding sale', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async saveCustomer(customerData) {
        // Check if customer already exists
        const existingCustomer = this.customersData.find(
            customer => customer.phone === customerData.phone
        );

        if (!existingCustomer) {
            try {
                customerData.createdAt = new Date().toISOString();
                
                if (this.isFirebaseInitialized) {
                    const customerId = await this.saveToFirebase('customers', customerData);
                    customerData.id = customerId;
                } else {
                    customerData.id = Date.now().toString();
                }

                this.customersData.push(customerData);
                this.saveToLocalStorage();
                
                console.log('New customer saved:', customerData.name);
            } catch (error) {
                console.error('Error saving customer:', error);
            }
        }
    }

    setDefaultSaleDate() {
        const saleDateInput = document.getElementById('sale-date');
        if (saleDateInput) {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            saleDateInput.value = formattedDate;
        }
    }

    previewReceipt() {
        const form = document.getElementById('add-sale-form');
        const formData = new FormData(form);
        
        // Get selected categories and quantities
        const selectedCategories = [];
        
        this.categories.forEach(category => {
            const checkbox = document.getElementById(`cat-${category}`);
            const quantityInput = document.getElementById(`qty-${category}`);
            
            if (checkbox && checkbox.checked) {
                const quantity = parseInt(quantityInput.value) || 1;
                selectedCategories.push({
                    category: checkbox.value,
                    quantity: quantity
                });
            }
        });

        if (selectedCategories.length === 0) {
            this.showMessage('Please select at least one category', 'warning');
            return;
        }

        const receiptData = {
            customerName: formData.get('customerName') || 'N/A',
            phoneNumber: formData.get('phoneNumber') || 'N/A',
            email: formData.get('email') || 'N/A',
            address: formData.get('address') || 'N/A',
            categories: selectedCategories,
            saleDate: formData.get('saleDate') || new Date().toISOString().split('T')[0],
            costPrice: parseFloat(formData.get('costPrice')) || 0,
            sellingPrice: parseFloat(formData.get('sellingPrice')) || 0,
            shippingCost: parseFloat(formData.get('shippingCost')) || 0,
            profit: parseFloat(formData.get('profit')) || 0,
            paymentMode: formData.get('paymentMode') || 'Cash'
        };

        this.showReceiptModal(receiptData);
    }

    showReceiptModal(receiptData) {
        const modal = document.getElementById('receipt-modal');
        const receiptContent = document.getElementById('receipt-content');
        
        // Calculate total quantity
        const totalQuantity = receiptData.categories.reduce((sum, cat) => sum + cat.quantity, 0);
        
        // Generate receipt number
        const receiptNumber = `TJ-${Date.now().toString().slice(-6)}`;
        
        const categoriesHtml = receiptData.categories.map(cat => 
            `<tr class="item-row">
                <td class="item-name">${cat.category}</td>
                <td class="item-qty">${cat.quantity}</td>
            </tr>`
        ).join('');

        receiptContent.innerHTML = `
            <div class="receipt-container">
                <!-- Header Section -->
                <div class="receipt-header">
                    <div class="company-logo">
                        <i class="fas fa-gem"></i>
                    </div>
                    <h1 class="company-name">THEIA JEWELZ</h1>
                    <p class="company-tagline">Premium Artificial Jewelry Collection</p>
                    <div class="receipt-info">
                        <div class="receipt-number">Receipt #: ${receiptNumber}</div>
                        <div class="receipt-date">Date: ${this.formatDate(receiptData.saleDate)}</div>
                        <div class="receipt-time">Time: ${new Date().toLocaleTimeString()}</div>
                    </div>
                </div>
                
                <div class="receipt-divider"></div>
                
                <!-- Customer Details Section -->
                <div class="receipt-section">
                    <h3 class="section-title">
                        <i class="fas fa-user"></i>
                        Customer Details
                    </h3>
                    <div class="customer-info">
                        <div class="info-row">
                            <span class="info-label">Name:</span>
                            <span class="info-value">${receiptData.customerName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Phone:</span>
                            <span class="info-value">${receiptData.phoneNumber}</span>
                        </div>
                        ${receiptData.email ? `
                        <div class="info-row">
                            <span class="info-label">Email:</span>
                            <span class="info-value">${receiptData.email}</span>
                        </div>` : ''}
                        ${receiptData.address ? `
                        <div class="info-row">
                            <span class="info-label">Address:</span>
                            <span class="info-value">${receiptData.address}</span>
                        </div>` : ''}
                    </div>
                </div>
                
                <div class="receipt-divider"></div>
                
                <!-- Items Section -->
                <div class="receipt-section">
                    <h3 class="section-title">
                        <i class="fas fa-gem"></i>
                        Item Details
                    </h3>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Item Details</th>
                                <th>Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${categoriesHtml}
                        </tbody>
                    </table>
                </div>
                
                <div class="receipt-divider"></div>
                
                <!-- Payment Summary Section -->
                <div class="receipt-section">
                    <h3 class="section-title">
                        <i class="fas fa-credit-card"></i>
                        Payment Summary
                    </h3>
                    <div class="payment-details">
                        <div class="payment-row">
                            <span class="payment-label">Total Items Price:</span>
                            <span class="payment-value">${this.settings.currency}${receiptData.sellingPrice.toFixed(2)}</span>
                        </div>
                        <div class="payment-row">
                            <span class="payment-label">Shipping Cost:</span>
                            <span class="payment-value">${this.settings.currency}${receiptData.shippingCost.toFixed(2)}</span>
                        </div>
                        <div class="payment-row total-row">
                            <span class="payment-label">Total Amount:</span>
                            <span class="payment-value">${this.settings.currency}${(receiptData.sellingPrice + receiptData.shippingCost).toFixed(2)}</span>
                        </div>
                        <div class="payment-row">
                            <span class="payment-label">Payment Mode:</span>
                            <span class="payment-value payment-mode">${receiptData.paymentMode}</span>
                        </div>
                    </div>
                </div>
                
                <div class="receipt-divider"></div>
                
                <!-- Footer Section -->
                <div class="receipt-footer">
                    <div class="thank-you">
                        <i class="fas fa-heart"></i>
                        <p>Thank you for choosing Theia Jewelz!</p>
                        <p>We appreciate your business</p>
                    </div>

                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }

    closeReceiptModal() {
        const modal = document.getElementById('receipt-modal');
        modal.classList.remove('active');
    }

    printReceipt() {
        window.print();
    }

    updateDashboard() {
        if (this.salesData.length === 0) {
            document.getElementById('total-sales').textContent = `${this.settings.currency}0.00`;
            document.getElementById('total-profit').textContent = `${this.settings.currency}0.00`;
            document.getElementById('total-orders').textContent = '0';
            document.getElementById('avg-order-value').textContent = `${this.settings.currency}0.00`;
            return;
        }

        const totalSales = this.salesData.reduce((sum, sale) => sum + (sale.sellingPrice || 0), 0);
        const totalProfit = this.salesData.reduce((sum, sale) => sum + (sale.profit || 0), 0);
        const totalOrders = this.salesData.length;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        document.getElementById('total-sales').textContent = `${this.settings.currency}${totalSales.toFixed(2)}`;
        document.getElementById('total-profit').textContent = `${this.settings.currency}${totalProfit.toFixed(2)}`;
        document.getElementById('total-orders').textContent = totalOrders.toString();
        document.getElementById('avg-order-value').textContent = `${this.settings.currency}${avgOrderValue.toFixed(2)}`;
    }

    initializeCharts() {
        this.initializeMonthlySalesChart();
        this.initializeCategoryChart();
    }

    initializeMonthlySalesChart() {
        const ctx = document.getElementById('monthly-sales-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.monthlySales) {
            this.charts.monthlySales.destroy();
        }

        // Prepare data for last 6 months
        const months = [];
        const salesData = [];
        const currentDate = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            months.push(monthName);

            const monthSales = this.salesData.filter(sale => {
                const saleDate = new Date(sale.saleDate);
                return saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear();
            }).reduce((sum, sale) => sum + (sale.sellingPrice || 0), 0);

            salesData.push(monthSales);
        }

        this.charts.monthlySales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Monthly Sales',
                    data: salesData,
                    borderColor: this.settings.primaryColor,
                    backgroundColor: this.settings.primaryColor + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    initializeCategoryChart() {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.category) {
            this.charts.category.destroy();
        }

        // Prepare category data
        const categoryData = {};
        this.salesData.forEach(sale => {
            if (sale.categories && Array.isArray(sale.categories)) {
                sale.categories.forEach(cat => {
                    const category = cat.category || cat;
                    const quantity = cat.quantity || 1;
                    categoryData[category] = (categoryData[category] || 0) + quantity;
                });
            } else if (sale.category) {
                // Handle old format
                if (Array.isArray(sale.category)) {
                    sale.category.forEach(cat => {
                        categoryData[cat] = (categoryData[cat] || 0) + 1;
                    });
                } else {
                    categoryData[sale.category] = (categoryData[sale.category] || 0) + 1;
                }
            }
        });

        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ];

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initializeAnalyticsCharts() {
        this.initializeTopCategoriesChart();
        this.initializePerformanceChart();
        this.initializeProfitMarginChart();
        this.updateCustomerInsights();
    }

    initializeTopCategoriesChart() {
        const ctx = document.getElementById('top-categories-chart');
        if (!ctx) return;

        if (this.charts.topCategories) {
            this.charts.topCategories.destroy();
        }

        // Get top 5 categories by sales value
        const categoryData = {};
        this.salesData.forEach(sale => {
            if (sale.categories && Array.isArray(sale.categories)) {
                sale.categories.forEach(cat => {
                    const category = cat.category || cat;
                    categoryData[category] = (categoryData[category] || 0) + (sale.sellingPrice || 0);
                });
            }
        });

        const sortedCategories = Object.entries(categoryData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        const labels = sortedCategories.map(([category]) => category);
        const data = sortedCategories.map(([, value]) => value);

        this.charts.topCategories = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sales Value',
                    data: data,
                    backgroundColor: this.settings.buttonColor,
                    borderColor: this.settings.buttonColor,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    initializePerformanceChart() {
        const ctx = document.getElementById('performance-chart');
        if (!ctx) return;

        if (this.charts.performance) {
            this.charts.performance.destroy();
        }

        // Weekly performance for last 4 weeks
        const weeks = [];
        const salesData = [];
        const profitData = [];
        const currentDate = new Date();

        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(currentDate);
            weekStart.setDate(currentDate.getDate() - (i * 7) - currentDate.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            weeks.push(`Week ${4 - i}`);

            const weekSales = this.salesData.filter(sale => {
                const saleDate = new Date(sale.saleDate);
                return saleDate >= weekStart && saleDate <= weekEnd;
            });

            const totalSales = weekSales.reduce((sum, sale) => sum + (sale.sellingPrice || 0), 0);
            const totalProfit = weekSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

            salesData.push(totalSales);
            profitData.push(totalProfit);
        }

        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeks,
                datasets: [{
                    label: 'Sales',
                    data: salesData,
                    borderColor: this.settings.primaryColor,
                    backgroundColor: this.settings.primaryColor + '20',
                    borderWidth: 2,
                    fill: false
                }, {
                    label: 'Profit',
                    data: profitData,
                    borderColor: this.settings.buttonColor,
                    backgroundColor: this.settings.buttonColor + '20',
                    borderWidth: 2,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    initializeProfitMarginChart() {
        const ctx = document.getElementById('profit-margin-chart');
        if (!ctx) return;

        if (this.charts.profitMargin) {
            this.charts.profitMargin.destroy();
        }

        // Calculate profit margins by category
        const categoryMargins = {};
        this.salesData.forEach(sale => {
            if (sale.categories && Array.isArray(sale.categories)) {
                sale.categories.forEach(cat => {
                    const category = cat.category || cat;
                    if (!categoryMargins[category]) {
                        categoryMargins[category] = { totalProfit: 0, totalSales: 0 };
                    }
                    categoryMargins[category].totalProfit += (sale.profit || 0);
                    categoryMargins[category].totalSales += (sale.sellingPrice || 0);
                });
            }
        });

        const labels = Object.keys(categoryMargins);
        const margins = labels.map(category => {
            const data = categoryMargins[category];
            return data.totalSales > 0 ? (data.totalProfit / data.totalSales) * 100 : 0;
        });

        this.charts.profitMargin = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Profit Margin %',
                    data: margins,
                    borderColor: this.settings.accentColor,
                    backgroundColor: this.settings.accentColor + '20',
                    borderWidth: 2,
                    pointBackgroundColor: this.settings.accentColor
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    updateCustomerInsights() {
        // Top customer by total spending
        const customerSpending = {};
        this.salesData.forEach(sale => {
            const customer = sale.customerName;
            customerSpending[customer] = (customerSpending[customer] || 0) + (sale.sellingPrice || 0);
        });

        const topCustomer = Object.entries(customerSpending)
            .sort(([,a], [,b]) => b - a)[0];

        document.getElementById('top-customer').textContent = 
            topCustomer ? `${topCustomer[0]} (${this.settings.currency}${topCustomer[1].toFixed(2)})` : 'N/A';

        // Repeat customers
        const customerPurchases = {};
        this.salesData.forEach(sale => {
            const customer = sale.customerName;
            customerPurchases[customer] = (customerPurchases[customer] || 0) + 1;
        });

        const repeatCustomers = Object.values(customerPurchases).filter(count => count > 1).length;
        document.getElementById('repeat-customers').textContent = repeatCustomers.toString();

        // New customers this month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const newCustomersThisMonth = this.customersData.filter(customer => {
            const createdDate = new Date(customer.createdAt);
            return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
        }).length;

        document.getElementById('new-customers').textContent = newCustomersThisMonth.toString();
    }

    renderSalesList() {
        const tableBody = document.getElementById('sales-table-body');
        if (!tableBody) return;

        if (this.salesData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem;">No sales data available</td></tr>';
            return;
        }

        tableBody.innerHTML = this.salesData.map(sale => {
            const categoriesText = sale.categories && Array.isArray(sale.categories) 
                ? sale.categories.map(cat => `${cat.category || cat} (${cat.quantity || 1})`).join(', ')
                : (Array.isArray(sale.category) ? sale.category.join(', ') : sale.category || 'N/A');

            const totalQuantity = sale.categories && Array.isArray(sale.categories)
                ? sale.categories.reduce((sum, cat) => sum + (cat.quantity || 1), 0)
                : 1;

            return `
                <tr>
                    <td><input type="checkbox" value="${sale.id}" onchange="toggleSaleSelection('${sale.id}')"></td>
                    <td>${this.formatDate(sale.saleDate)}</td>
                    <td>
                        <strong>${sale.customerName}</strong><br>
                        <small>${sale.phoneNumber}</small>
                    </td>
                    <td>${categoriesText}</td>
                    <td>${totalQuantity}</td>
                    <td>${this.settings.currency}${(sale.costPrice || 0).toFixed(2)}</td>
                    <td>${this.settings.currency}${(sale.sellingPrice || 0).toFixed(2)}</td>
                    <td class="${(sale.profit || 0) >= 0 ? 'text-success' : 'text-danger'}">
                        ${this.settings.currency}${(sale.profit || 0).toFixed(2)}
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="generateReceipt('${sale.id}')" title="Generate Receipt">
                            <i class="fas fa-receipt"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="editSale('${sale.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteSale('${sale.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Add global function for sale selection
        window.toggleSaleSelection = (saleId) => {
            const checkbox = document.querySelector(`input[value="${saleId}"]`);
            if (checkbox.checked) {
                this.selectedSales.add(saleId);
            } else {
                this.selectedSales.delete(saleId);
            }
            
            // Update delete button state
            const deleteBtn = document.getElementById('delete-selected');
            if (deleteBtn) {
                deleteBtn.disabled = this.selectedSales.size === 0;
            }
            
            // Update select all checkbox state
            const totalCheckboxes = document.querySelectorAll('#sales-table-body input[type="checkbox"]').length;
            const selectedCount = this.selectedSales.size;
            
            const selectAllCheckbox = document.getElementById('select-all');
            const headerCheckbox = document.getElementById('header-checkbox');
            
            // If all items are selected, check the select all checkbox
            // If no items or some items are selected, uncheck the select all checkbox
            const shouldBeChecked = selectedCount === totalCheckboxes && totalCheckboxes > 0;
            
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = shouldBeChecked;
            }
            if (headerCheckbox) {
                headerCheckbox.checked = shouldBeChecked;
            }
        };
    }

    generateReceipt(saleId) {
        const sale = this.salesData.find(s => s.id === saleId);
        if (!sale) {
            this.showMessage('Sale not found', 'error');
            return;
        }

        this.showReceiptModal(sale);
    }

    renderCustomersList() {
        const tableBody = document.getElementById('customers-table-body');
        if (!tableBody) return;

        if (this.customersData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">No customers data available</td></tr>';
            return;
        }

        tableBody.innerHTML = this.customersData.map(customer => {
            const customerSales = this.salesData.filter(sale => sale.phoneNumber === customer.phone);
            const totalSpent = customerSales.reduce((sum, sale) => sum + (sale.sellingPrice || 0), 0);
            const purchaseCount = customerSales.length;

            return `
                <tr>
                    <td><input type="checkbox" value="${customer.id || customer.phone}" onchange="toggleCustomerSelection('${customer.id || customer.phone}')"></td>
                    <td><strong>${customer.name}</strong></td>
                    <td>${customer.phone}</td>
                    <td>${customer.email || '-'}</td>
                    <td>${customer.address || '-'}</td>
                    <td>${purchaseCount}</td>
                    <td>${this.settings.currency}${totalSpent.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="editCustomer('${customer.id || customer.phone}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCustomer('${customer.id || customer.phone}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Add global function for customer selection
        window.toggleCustomerSelection = (customerId) => {
            const checkbox = document.querySelector(`#customers-table-body input[value="${customerId}"]`);
            if (checkbox.checked) {
                this.selectedCustomers.add(customerId);
            } else {
                this.selectedCustomers.delete(customerId);
            }
            
            // Update delete button state
            const deleteBtn = document.getElementById('delete-selected-customers');
            if (deleteBtn) {
                deleteBtn.disabled = this.selectedCustomers.size === 0;
            }
            
            // Update select all checkbox state
            const totalCheckboxes = document.querySelectorAll('#customers-table-body input[type="checkbox"]').length;
            const selectedCount = this.selectedCustomers.size;
            
            const selectAllCheckbox = document.getElementById('select-all-customers');
            const headerCheckbox = document.getElementById('customers-header-checkbox');
            
            // If all items are selected, check the select all checkbox
            // If no items or some items are selected, uncheck the select all checkbox
            const shouldBeChecked = selectedCount === totalCheckboxes && totalCheckboxes > 0;
            
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = shouldBeChecked;
            }
            if (headerCheckbox) {
                headerCheckbox.checked = shouldBeChecked;
            }
        };
    }

    // Settings Functions
    loadSettingsUI() {
        document.getElementById('primary-color').value = this.settings.primaryColor;
        document.getElementById('button-color').value = this.settings.buttonColor;
        document.getElementById('accent-color').value = this.settings.accentColor;
        document.getElementById('currency').value = this.settings.currency;
        document.getElementById('date-format').value = this.settings.dateFormat;
        document.getElementById('auto-backup').checked = this.settings.autoBackup;

        this.updateColorPreviews();
    }

    updateColorPreviews() {
        document.getElementById('primary-preview').style.backgroundColor = this.settings.primaryColor;
        document.getElementById('button-preview').style.backgroundColor = this.settings.buttonColor;
        document.getElementById('accent-preview').style.backgroundColor = this.settings.accentColor;
    }

    updatePrimaryColor(color) {
        this.settings.primaryColor = color;
        this.applyColors();
        this.saveSettings();
        this.updateColorPreviews();
    }

    updateButtonColor(color) {
        this.settings.buttonColor = color;
        this.applyColors();
        this.saveSettings();
        this.updateColorPreviews();
    }

    updateAccentColor(color) {
        this.settings.accentColor = color;
        this.applyColors();
        this.saveSettings();
        this.updateColorPreviews();
    }

    resetColors() {
        this.settings.primaryColor = '#4285f4';
        this.settings.buttonColor = '#34a853';
        this.settings.accentColor = '#ea4335';
        
        document.getElementById('primary-color').value = this.settings.primaryColor;
        document.getElementById('button-color').value = this.settings.buttonColor;
        document.getElementById('accent-color').value = this.settings.accentColor;
        
        this.applyColors();
        this.saveSettings();
        this.updateColorPreviews();
        this.showMessage('Colors reset to default', 'success');
    }

    applyColors() {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', this.settings.primaryColor);
        root.style.setProperty('--primary-dark', this.darkenColor(this.settings.primaryColor, 20));
        root.style.setProperty('--primary-light', this.lightenColor(this.settings.primaryColor, 20));
        root.style.setProperty('--button-color', this.settings.buttonColor);
        root.style.setProperty('--button-hover', this.darkenColor(this.settings.buttonColor, 10));
        root.style.setProperty('--accent-color', this.settings.accentColor);
        root.style.setProperty('--accent-hover', this.darkenColor(this.settings.accentColor, 10));
        
        // Update gradients
        root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${this.settings.primaryColor}, ${this.darkenColor(this.settings.primaryColor, 20)})`);
        root.style.setProperty('--gradient-success', `linear-gradient(135deg, ${this.settings.buttonColor}, ${this.darkenColor(this.settings.buttonColor, 10)})`);
        root.style.setProperty('--gradient-danger', `linear-gradient(135deg, ${this.settings.accentColor}, ${this.darkenColor(this.settings.accentColor, 10)})`);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    updateCurrency(currency) {
        this.settings.currency = currency;
        this.saveSettings();
        this.updateDashboard();
        this.renderSalesList();
        this.showMessage('Currency updated', 'success');
    }

    updateDateFormat(format) {
        this.settings.dateFormat = format;
        this.saveSettings();
        this.showMessage('Date format updated', 'success');
    }

    toggleAutoBackup(enabled) {
        this.settings.autoBackup = enabled;
        this.saveSettings();
        this.showMessage(`Auto backup ${enabled ? 'enabled' : 'disabled'}`, 'success');
    }

    openChangePasswordModal() {
        const modal = document.getElementById('change-password-modal');
        modal.classList.add('active');
    }

    closeChangePasswordModal() {
        const modal = document.getElementById('change-password-modal');
        modal.classList.remove('active');
        document.getElementById('change-password-form').reset();
    }

    async handleChangePassword(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const currentPassword = formData.get('current-password');
        const newPassword = formData.get('new-password');
        const confirmPassword = formData.get('confirm-password');

        if (newPassword !== confirmPassword) {
            this.showMessage('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showMessage('Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            // Validate current password
            const isValidCurrent = await this.validateCredentials(this.currentUser.username, currentPassword);
            if (!isValidCurrent) {
                this.showMessage('Current password is incorrect', 'error');
                return;
            }

            // Save new password to Firebase
            if (this.isFirebaseInitialized) {
                await this.saveToFirebase('users', {
                    username: this.currentUser.username,
                    password: this.hashPassword(newPassword),
                    updatedAt: new Date().toISOString()
                }, this.currentUser.username);
            }

            this.closeChangePasswordModal();
            this.showMessage('Password changed successfully', 'success');
        } catch (error) {
            console.error('Error changing password:', error);
            this.showMessage('Error changing password', 'error');
        }
    }

    async saveSettings() {
        try {
            if (this.isFirebaseInitialized) {
                await this.saveToFirebase('settings', this.settings, 'app');
            }
            this.saveToLocalStorage();
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('theiaJewelzSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
    }

    backupData() {
        const backupData = {
            sales: this.salesData,
            customers: this.customersData,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '2.0.0'
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `theia-jewelz-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showMessage('Backup downloaded successfully', 'success');
    }

    restoreData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const backupData = JSON.parse(text);
                
                if (backupData.sales && backupData.customers) {
                    this.salesData = backupData.sales;
                    this.customersData = backupData.customers;
                    if (backupData.settings) {
                        this.settings = { ...this.settings, ...backupData.settings };
                    }
                    
                    this.saveToLocalStorage();
                    this.applyColors();
                    this.updateDashboard();
                    this.renderSalesList();
                    this.renderCustomersList();
                    
                    this.showMessage('Data restored successfully', 'success');
                } else {
                    throw new Error('Invalid backup file format');
                }
            } catch (error) {
                console.error('Error restoring data:', error);
                this.showMessage('Error restoring data: ' + error.message, 'error');
            }
        };
        
        input.click();
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            this.salesData = [];
            this.customersData = [];
            this.saveToLocalStorage();
            this.updateDashboard();
            this.renderSalesList();
            this.renderCustomersList();
            this.showMessage('All data cleared', 'success');
        }
    }

    // Utility Functions
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        const format = this.settings.dateFormat;
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        switch (format) {
            case 'MM/DD/YYYY':
                return `${month}/${day}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            default: // DD/MM/YYYY
                return `${day}/${month}/${year}`;
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            if (show) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        }
    }

    showMessage(message, type = 'info') {
        const toast = document.getElementById('message-toast');
        const toastContent = toast.querySelector('.toast-content');
        const toastIcon = toast.querySelector('.toast-icon');
        const toastMessage = toast.querySelector('.toast-message');
        
        // Set message and type
        toastMessage.textContent = message;
        toastContent.className = `toast-content ${type}`;
        
        // Set icon based on type
        let iconClass = 'fas fa-info-circle';
        switch (type) {
            case 'success':
                iconClass = 'fas fa-check-circle';
                break;
            case 'error':
                iconClass = 'fas fa-exclamation-circle';
                break;
            case 'warning':
                iconClass = 'fas fa-exclamation-triangle';
                break;
        }
        toastIcon.className = `toast-icon ${iconClass}`;
        
        // Show toast
        toast.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Placeholder functions for features to be implemented
    applyFilters() {
        // TODO: Implement filtering logic
        this.showMessage('Filters applied', 'success');
    }

    toggleSelectAll() {
        const selectAllCheckbox = document.getElementById('select-all') || document.getElementById('header-checkbox');
        const salesCheckboxes = document.querySelectorAll('#sales-table-body input[type="checkbox"]');
        const deleteBtn = document.getElementById('delete-selected');
        
        if (!selectAllCheckbox) return;
        
        const isChecked = selectAllCheckbox.checked;
        
        // Clear current selection
        this.selectedSales.clear();
        
        // Update all checkboxes and selection
        salesCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            if (isChecked) {
                this.selectedSales.add(checkbox.value);
            }
        });
        
        // Sync both select all checkboxes if they exist
        const otherSelectAllCheckbox = selectAllCheckbox.id === 'select-all' 
            ? document.getElementById('header-checkbox')
            : document.getElementById('select-all');
        
        if (otherSelectAllCheckbox) {
            otherSelectAllCheckbox.checked = isChecked;
        }
        
        // Update delete button state
        if (deleteBtn) {
            deleteBtn.disabled = this.selectedSales.size === 0;
        }
        
        console.log(`Select all toggled: ${isChecked ? 'checked' : 'unchecked'}, Selected items: ${this.selectedSales.size}`);
    }

    deleteSelected() {
        if (this.selectedSales.size === 0) {
            this.showMessage('No items selected', 'warning');
            return;
        }
        
        const selectedCount = this.selectedSales.size;
        const confirmMessage = `Are you sure you want to delete ${selectedCount} selected sale${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`;
        
        if (confirm(confirmMessage)) {
            // Remove selected sales from salesData
            this.salesData = this.salesData.filter(sale => !this.selectedSales.has(sale.id));
            
            // Clear selection
            this.selectedSales.clear();
            
            // Update UI
            this.saveToLocalStorage();
            this.renderSalesList();
            this.updateDashboard();
            
            // Reset select all checkboxes
            const selectAllCheckbox = document.getElementById('select-all');
            const headerCheckbox = document.getElementById('header-checkbox');
            if (selectAllCheckbox) selectAllCheckbox.checked = false;
            if (headerCheckbox) headerCheckbox.checked = false;
            
            // Disable delete button
            const deleteBtn = document.getElementById('delete-selected');
            if (deleteBtn) deleteBtn.disabled = true;
            
            this.showMessage(`${selectedCount} sale${selectedCount > 1 ? 's' : ''} deleted successfully`, 'success');
        }
    }

    deleteAll() {
        if (confirm('Are you sure you want to delete all sales? This action cannot be undone.')) {
            this.salesData = [];
            this.saveToLocalStorage();
            this.renderSalesList();
            this.updateDashboard();
            this.showMessage('All sales deleted', 'success');
        }
    }

    async exportSales() {
        try {
            if (this.salesData.length === 0) {
                this.showMessage('No sales data to export', 'warning');
                return;
            }

            // Check if XLSX library is available
            if (typeof XLSX === 'undefined') {
                this.showMessage('Excel library not loaded. Please refresh the page and try again.', 'error');
                return;
            }

            // Prepare data for export
            const exportData = this.salesData.map(sale => {
                // Handle categories - convert array to string
                let categories = '';
                if (Array.isArray(sale.category)) {
                    categories = sale.category.map(cat => cat.category || cat).join(', ');
                } else if (typeof sale.category === 'string') {
                    categories = sale.category;
                } else if (sale.category && sale.category.category) {
                    categories = sale.category.category;
                }

                return {
                    'Date': this.formatDate(sale.createdAt || sale.saleDate),
                    'Receipt Number': sale.receiptNumber || `TJ-${sale.id?.slice(-6) || '000000'}`,
                    'Customer Name': sale.customerName || '',
                    'Customer Phone': sale.customerPhone || sale.phoneNumber || '',
                    'Customer Email': sale.customerEmail || sale.email || '',
                    'Customer Address': sale.customerAddress || sale.address || '',
                    'Items': categories,
                    'Price (₹)': parseFloat(sale.sellingPrice || 0).toFixed(2),
                    'Shipping Cost (₹)': parseFloat(sale.shippingCost || 0).toFixed(2),
                    'Total Amount (₹)': (parseFloat(sale.sellingPrice || 0) + parseFloat(sale.shippingCost || 0)).toFixed(2),

                    'Payment Mode': sale.paymentMode || '',
                    'Sale ID': sale.id || ''
                };
            });

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Auto-size columns
            const range = XLSX.utils.decode_range(ws['!ref']);
            const cols = [];
            for (let C = range.s.c; C <= range.e.c; ++C) {
                let maxWidth = 10;
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[cellAddress];
                    if (cell && cell.v) {
                        const cellValue = cell.v.toString();
                        maxWidth = Math.max(maxWidth, cellValue.length);
                    }
                }
                cols[C] = { wch: Math.min(maxWidth + 2, 50) };
            }
            ws['!cols'] = cols;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Sales Data');

            // Generate filename with current date
            const filename = `Theia_Jewelz_Sales_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Download the file
            XLSX.writeFile(wb, filename);
            
            this.showMessage(`Sales data exported successfully as ${filename}`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showMessage('Failed to export sales data: ' + error.message, 'error');
        }
    }

    importSales() {
        // Trigger file input click
        const fileInput = document.getElementById('import-file');
        if (fileInput) {
            fileInput.click();
        } else {
            // Create a temporary file input if it doesn't exist
            const tempInput = document.createElement('input');
            tempInput.type = 'file';
            tempInput.accept = '.xlsx,.xls';
            tempInput.style.display = 'none';
            tempInput.addEventListener('change', (e) => this.handleImportSales(e));
            document.body.appendChild(tempInput);
            tempInput.click();
            document.body.removeChild(tempInput);
        }
    }

    editSale(id) {
        const sale = this.salesData.find(s => s.id === id);
        if (!sale) {
            this.showMessage('Sale not found', 'error');
            return;
        }

        this.editingSaleId = id;
        
        // Populate the edit form
        document.getElementById('edit-sale-id').value = sale.id;
        document.getElementById('edit-customer-name').value = sale.customerName || '';
        document.getElementById('edit-phone-number').value = sale.customerPhone || sale.phoneNumber || '';
        document.getElementById('edit-email').value = sale.customerEmail || sale.email || '';
        document.getElementById('edit-address').value = sale.customerAddress || sale.address || '';
        document.getElementById('edit-sale-date').value = this.formatDateForInput(sale.createdAt || sale.saleDate);
        document.getElementById('edit-cost-price').value = sale.costPrice || '';
        document.getElementById('edit-selling-price').value = sale.sellingPrice || '';
        document.getElementById('edit-shipping-cost').value = sale.shippingCost || '0';
        document.getElementById('edit-payment-mode').value = sale.paymentMode || 'UPI';
        
        // Populate categories
        this.populateEditCategories(sale.category);
        
        // Calculate profit
        this.calculateEditProfit();
        
        // Show the modal
        document.getElementById('edit-sale-modal').style.display = 'flex';
    }

    deleteSale(id) {
        if (confirm('Are you sure you want to delete this sale?')) {
            this.salesData = this.salesData.filter(sale => sale.id !== id);
            this.saveToLocalStorage();
            this.renderSalesList();
            this.updateDashboard();
            this.showMessage('Sale deleted', 'success');
        }
    }

    addNewCustomer() {
        // TODO: Implement add customer functionality
        this.showMessage('Add customer functionality coming soon', 'info');
    }

    async exportCustomers() {
        try {
            if (this.customersData.length === 0) {
                this.showMessage('No customer data to export', 'warning');
                return;
            }

            // Check if XLSX library is available
            if (typeof XLSX === 'undefined') {
                this.showMessage('Excel library not loaded. Please refresh the page and try again.', 'error');
                return;
            }

            // Calculate customer statistics from sales data
            const customerStats = {};
            this.salesData.forEach(sale => {
                const customerId = sale.customerPhone || sale.customerName;
                if (customerId) {
                    if (!customerStats[customerId]) {
                        customerStats[customerId] = {
                            totalPurchases: 0,
                            totalSpent: 0,
                            lastPurchase: null
                        };
                    }
                    customerStats[customerId].totalPurchases++;
                    customerStats[customerId].totalSpent += parseFloat(sale.sellingPrice || 0);
                    
                    const saleDate = new Date(sale.createdAt || sale.saleDate);
                    if (!customerStats[customerId].lastPurchase || saleDate > customerStats[customerId].lastPurchase) {
                        customerStats[customerId].lastPurchase = saleDate;
                    }
                }
            });

            // Prepare data for export
            const exportData = this.customersData.map(customer => {
                const stats = customerStats[customer.phone] || customerStats[customer.name] || {
                    totalPurchases: 0,
                    totalSpent: 0,
                    lastPurchase: null
                };

                return {
                    'Name': customer.name || '',
                    'Phone': customer.phone || '',
                    'Email': customer.email || '',
                    'Address': customer.address || '',
                    'Total Purchases': stats.totalPurchases,
                    'Total Spent (₹)': stats.totalSpent.toFixed(2),
                    'Last Purchase': stats.lastPurchase ? this.formatDate(stats.lastPurchase.toISOString()) : 'Never',
                    'Customer Since': customer.createdAt ? this.formatDate(customer.createdAt) : 'Unknown',
                    'Customer ID': customer.id || ''
                };
            });

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Auto-size columns
            const range = XLSX.utils.decode_range(ws['!ref']);
            const cols = [];
            for (let C = range.s.c; C <= range.e.c; ++C) {
                let maxWidth = 10;
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[cellAddress];
                    if (cell && cell.v) {
                        const cellValue = cell.v.toString();
                        maxWidth = Math.max(maxWidth, cellValue.length);
                    }
                }
                cols[C] = { wch: Math.min(maxWidth + 2, 50) };
            }
            ws['!cols'] = cols;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Customer Data');

            // Generate filename with current date
            const filename = `Theia_Jewelz_Customers_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Download the file
            XLSX.writeFile(wb, filename);
            
            this.showMessage(`Customer data exported successfully as ${filename}`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showMessage('Failed to export customer data: ' + error.message, 'error');
        }
    }

    importCustomers() {
        // TODO: Implement import customers functionality
        this.showMessage('Import customers functionality coming soon', 'info');
    }

    async handleImportSales(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Check if XLSX library is available
            if (typeof XLSX === 'undefined') {
                this.showMessage('Excel library not loaded. Please refresh the page and try again.', 'error');
                return;
            }

            this.showLoading(true);
            this.showMessage('Importing sales data...', 'info');

            // Read the file
            const data = await this.readExcelFile(file);
            
            // Process and validate the data
            const processedData = this.processSalesImportData(data);
            
            if (processedData.length === 0) {
                this.showMessage('No valid sales data found in the file', 'warning');
                return;
            }

            // Add imported data to existing sales
            let importedCount = 0;
            let skippedCount = 0;

            processedData.forEach(saleData => {
                try {
                    // Generate unique ID
                    saleData.id = this.generateId();
                    saleData.createdAt = new Date().toISOString();
                    
                    // Add to sales data
                    this.salesData.push(saleData);
                    importedCount++;
                } catch (error) {
                    console.error('Error processing sale:', error);
                    skippedCount++;
                }
            });

            // Save to storage and update UI
            this.saveToLocalStorage();
            this.renderSalesList();
            this.updateDashboard();

            // Show results
            let message = `Import completed: ${importedCount} sales imported`;
            if (skippedCount > 0) {
                message += `, ${skippedCount} skipped due to errors`;
            }
            this.showMessage(message, 'success');

        } catch (error) {
            console.error('Import error:', error);
            this.showMessage('Failed to import sales data: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
            // Clear the file input
            e.target.value = '';
        }
    }

    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get first worksheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Error processing Excel file: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    processSalesImportData(data) {
        return data.map(row => {
            try {
                // Parse categories
                let categories = [];
                const categoryStr = row['Items'] || row['Category'] || row['categories'] || '';
                if (categoryStr) {
                    categories = categoryStr.split(',').map(cat => ({
                        category: cat.trim(),
                        quantity: 1 // Default quantity
                    }));
                }

                // Parse date
                let saleDate = new Date().toISOString().split('T')[0];
                if (row['Date']) {
                    try {
                        const parsedDate = new Date(row['Date']);
                        if (!isNaN(parsedDate.getTime())) {
                            saleDate = parsedDate.toISOString().split('T')[0];
                        }
                    } catch (e) {
                        console.warn('Invalid date format:', row['Date']);
                    }
                }

                return {
                    customerName: row['Customer Name'] || row['customerName'] || '',
                    customerPhone: row['Customer Phone'] || row['customerPhone'] || row['phoneNumber'] || '',
                    customerEmail: row['Customer Email'] || row['customerEmail'] || row['email'] || '',
                    customerAddress: row['Customer Address'] || row['customerAddress'] || row['address'] || '',
                    category: categories,
                    costPrice: parseFloat(row['Cost Price (₹)'] || row['Cost Price'] || row['costPrice'] || 0),
                    sellingPrice: parseFloat(row['Selling Price (₹)'] || row['Selling Price'] || row['sellingPrice'] || 0),
                    shippingCost: parseFloat(row['Shipping Cost (₹)'] || row['Shipping Cost'] || row['shippingCost'] || 0),
                    profit: parseFloat(row['Profit (₹)'] || row['Profit'] || row['profit'] || 0),
                    paymentMode: row['Payment Mode'] || row['paymentMode'] || 'Cash',
                    saleDate: saleDate,
                    receiptNumber: row['Receipt Number'] || row['receiptNumber'] || ''
                };
            } catch (error) {
                console.error('Error processing row:', row, error);
                return null;
            }
        }).filter(item => item !== null && item.customerName && item.sellingPrice > 0);
    }

    // Generate sample Excel template for import
    generateSalesTemplate() {
        try {
            if (typeof XLSX === 'undefined') {
                this.showMessage('Excel library not loaded. Please refresh the page and try again.', 'error');
                return;
            }

            const templateData = [
                {
                    'Date': new Date().toLocaleDateString(),
                    'Customer Name': 'John Doe',
                    'Customer Phone': '+91-9876543210',
                    'Customer Email': 'john@example.com',
                    'Customer Address': '123 Main St, City, State',
                    'Items': 'Necklaces, Earrings',
                    'Cost Price (₹)': '1000.00',
                    'Selling Price (₹)': '1500.00',
                    'Shipping Cost (₹)': '50.00',
                    'Profit (₹)': '450.00',
                    'Payment Mode': 'UPI'
                },
                {
                    'Date': new Date().toLocaleDateString(),
                    'Customer Name': 'Jane Smith',
                    'Customer Phone': '+91-9876543211',
                    'Customer Email': 'jane@example.com',
                    'Customer Address': '456 Oak Ave, City, State',
                    'Items': 'Rings, Bracelets',
                    'Cost Price (₹)': '2000.00',
                    'Selling Price (₹)': '3000.00',
                    'Shipping Cost (₹)': '100.00',
                    'Profit (₹)': '900.00',
                    'Payment Mode': 'Bank Transfer'
                }
            ];

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(templateData);

            // Auto-size columns
            const range = XLSX.utils.decode_range(ws['!ref']);
            const cols = [];
            for (let C = range.s.c; C <= range.e.c; ++C) {
                let maxWidth = 10;
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[cellAddress];
                    if (cell && cell.v) {
                        const cellValue = cell.v.toString();
                        maxWidth = Math.max(maxWidth, cellValue.length);
                    }
                }
                cols[C] = { wch: Math.min(maxWidth + 2, 50) };
            }
            ws['!cols'] = cols;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Sales Import Template');

            // Download the template
            XLSX.writeFile(wb, 'Theia_Jewelz_Sales_Import_Template.xlsx');
            
            this.showMessage('Sales import template downloaded successfully!', 'success');
        } catch (error) {
            console.error('Template generation error:', error);
            this.showMessage('Failed to generate template: ' + error.message, 'error');
        }
    }

    generateCustomersTemplate() {
        try {
            if (typeof XLSX === 'undefined') {
                this.showMessage('Excel library not loaded. Please refresh the page and try again.', 'error');
                return;
            }

            const templateData = [
                {
                    'Name': 'John Doe',
                    'Phone': '+91-9876543210',
                    'Email': 'john@example.com',
                    'Address': '123 Main St, City, State'
                },
                {
                    'Name': 'Jane Smith',
                    'Phone': '+91-9876543211',
                    'Email': 'jane@example.com',
                    'Address': '456 Oak Ave, City, State'
                }
            ];

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(templateData);

            // Auto-size columns
            const range = XLSX.utils.decode_range(ws['!ref']);
            const cols = [];
            for (let C = range.s.c; C <= range.e.c; ++C) {
                let maxWidth = 10;
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[cellAddress];
                    if (cell && cell.v) {
                        const cellValue = cell.v.toString();
                        maxWidth = Math.max(maxWidth, cellValue.length);
                    }
                }
                cols[C] = { wch: Math.min(maxWidth + 2, 50) };
            }
            ws['!cols'] = cols;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Customer Import Template');

            // Download the template
            XLSX.writeFile(wb, 'Theia_Jewelz_Customer_Import_Template.xlsx');
            
            this.showMessage('Customer import template downloaded successfully!', 'success');
        } catch (error) {
            console.error('Template generation error:', error);
            this.showMessage('Failed to generate template: ' + error.message, 'error');
        }
    }

    // Helper functions for edit functionality
    formatDateForInput(dateString) {
        if (!dateString) return new Date().toISOString().split('T')[0];
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    populateEditCategories(categories) {
        const container = document.getElementById('edit-categories-container');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Create category checkboxes
        this.categories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            
            const isSelected = Array.isArray(categories) ? 
                categories.some(cat => (cat.category || cat).toLowerCase() === category.toLowerCase()) :
                false;
            
            const quantity = isSelected && Array.isArray(categories) ? 
                categories.find(cat => (cat.category || cat).toLowerCase() === category.toLowerCase())?.quantity || 1 : 1;

            categoryItem.innerHTML = `
                <input type="checkbox" id="edit-cat-${category}" name="categories" value="${category}" ${isSelected ? 'checked' : ''}>
                <label for="edit-cat-${category}">${category.charAt(0).toUpperCase() + category.slice(1)}</label>
                <input type="number" id="edit-qty-${category}" name="quantities" min="1" placeholder="Qty" 
                       value="${isSelected ? quantity : ''}" ${!isSelected ? 'disabled' : ''}>
            `;
            
            container.appendChild(categoryItem);

            // Add event listener for checkbox
            const checkbox = categoryItem.querySelector(`#edit-cat-${category}`);
            const quantityInput = categoryItem.querySelector(`#edit-qty-${category}`);
            
            checkbox.addEventListener('change', (e) => {
                quantityInput.disabled = !e.target.checked;
                if (e.target.checked) {
                    quantityInput.value = '1';
                    quantityInput.focus();
                } else {
                    quantityInput.value = '';
                }
            });
        });
    }

    calculateEditProfit() {
        const costPrice = parseFloat(document.getElementById('edit-cost-price').value) || 0;
        const sellingPrice = parseFloat(document.getElementById('edit-selling-price').value) || 0;
        const shippingCost = parseFloat(document.getElementById('edit-shipping-cost').value) || 0;
        
        const profit = sellingPrice - costPrice - shippingCost;
        document.getElementById('edit-profit').value = profit.toFixed(2);
    }

    closeEditSaleModal() {
        document.getElementById('edit-sale-modal').style.display = 'none';
        this.editingSaleId = null;
    }

    saveEditedSale() {
        if (!this.editingSaleId) {
            this.showMessage('No sale selected for editing', 'error');
            return;
        }

        try {
            // Get form data
            const form = document.getElementById('edit-sale-form');
            const formData = new FormData(form);
            
            // Get selected categories
            const selectedCategories = [];
            this.categories.forEach(category => {
                const checkbox = document.getElementById(`edit-cat-${category}`);
                const quantityInput = document.getElementById(`edit-qty-${category}`);
                
                if (checkbox && checkbox.checked) {
                    selectedCategories.push({
                        category: category,
                        quantity: parseInt(quantityInput.value) || 1
                    });
                }
            });

            if (selectedCategories.length === 0) {
                this.showMessage('Please select at least one category', 'error');
                return;
            }

            // Validate required fields
            const customerName = formData.get('customerName');
            const phoneNumber = formData.get('phoneNumber');
            const costPrice = parseFloat(formData.get('costPrice'));
            const sellingPrice = parseFloat(formData.get('sellingPrice'));

            if (!customerName || !phoneNumber || !costPrice || !sellingPrice) {
                this.showMessage('Please fill in all required fields', 'error');
                return;
            }

            // Find and update the sale
            const saleIndex = this.salesData.findIndex(sale => sale.id === this.editingSaleId);
            if (saleIndex === -1) {
                this.showMessage('Sale not found', 'error');
                return;
            }

            // Update sale data
            const updatedSale = {
                ...this.salesData[saleIndex],
                customerName: customerName,
                customerPhone: phoneNumber,
                customerEmail: formData.get('email') || '',
                customerAddress: formData.get('address') || '',
                phoneNumber: phoneNumber, // Keep both for compatibility
                email: formData.get('email') || '',
                address: formData.get('address') || '',
                category: selectedCategories,
                costPrice: costPrice,
                sellingPrice: sellingPrice,
                shippingCost: parseFloat(formData.get('shippingCost')) || 0,
                profit: parseFloat(document.getElementById('edit-profit').value) || 0,
                paymentMode: formData.get('paymentMode') || 'UPI',
                saleDate: formData.get('saleDate'),
                updatedAt: new Date().toISOString()
            };

            this.salesData[saleIndex] = updatedSale;

            // Save to storage and update UI
            this.saveToLocalStorage();
            this.renderSalesList();
            this.updateDashboard();

            // Close modal and show success message
            this.closeEditSaleModal();
            this.showMessage('Sale updated successfully!', 'success');

        } catch (error) {
            console.error('Error saving edited sale:', error);
            this.showMessage('Failed to save changes: ' + error.message, 'error');
        }
    }
}