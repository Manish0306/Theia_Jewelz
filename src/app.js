// Main application logic
import { database } from './database.js';
import { ui } from './ui-components.js';
import { analytics } from './analytics.js';
import { pdfGenerator } from './pdf-generator.js';
import { excelHandler } from './excel-handler.js';

// Import Firebase functions for password management
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from './firebase-config.js';

class JewelryApp {
    constructor() {
        this.currentSale = null;
        // Don't auto-initialize, wait for login
    }

    async initialize() {
        console.log('Initializing Jewelry App...');
        await this.loadSettings();
        // Initialize PDF generator with delay to ensure jsPDF is loaded
        setTimeout(() => {
            pdfGenerator.init();
        }, 100);
        this.initializeEventListeners();
        this.loadInitialData();
        
        // Test Firebase functionality
        await this.testFirebaseConnection();
    }

    async testFirebaseConnection() {
        try {
            console.log('Testing Firebase connection...');
            
            // Test reading from settings
            const appName = await database.getSetting('appName');
            console.log('Firebase read test successful:', appName);
            
            // Test writing to settings
            await database.setSetting('lastConnectionTest', new Date().toISOString());
            console.log('Firebase write test successful');
            
            // Update connection status
            const statusElement = document.getElementById('sync-status');
            if (statusElement) {
                statusElement.innerHTML = '<i class="fas fa-wifi status-online"></i>';
                statusElement.title = 'Firebase connected successfully';
            }
        } catch (error) {
            console.error('Firebase connection test failed:', error);
            const statusElement = document.getElementById('sync-status');
            if (statusElement) {
                statusElement.innerHTML = '<i class="fas fa-wifi-slash status-offline"></i>';
                statusElement.title = 'Firebase connection failed - using offline mode';
            }
        }
    }

    async loadSettings() {
        try {
            const appName = await database.getSetting('appName') || 'Theia Jewelz';
            document.getElementById('app-name').textContent = appName;
            document.getElementById('app-name-setting').value = appName;
            document.title = `${appName} - Sales Management`;
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    initializeEventListeners() {
        // Sales form
        this.initializeSalesForm();
        
        // Customer search
        this.initializeCustomerSearch();
        
        // Recent sales
        this.initializeRecentSales();
        
        // Customer management
        this.initializeCustomerManagement();
        
        // Settings
        this.initializeSettings();
        
        // Analytics
        this.initializeAnalytics();
        
        // Export/Import
        this.initializeExportImport();
        
        // Logo upload
        this.initializeLogoUpload();
        
        // Password change
        this.initializePasswordChange();
    }

    initializeSalesForm() {
        const salesForm = document.getElementById('sales-form');
        const costPriceInput = document.getElementById('cost-price');
        const sellingPriceInput = document.getElementById('selling-price');
        const shippingCostInput = document.getElementById('shipping-cost');
        const profitInput = document.getElementById('profit');
        const categorySelect = document.getElementById('category');
        const otherCategoryInput = document.getElementById('other-category');
        const generateReceiptBtn = document.getElementById('generate-receipt');

        // Set default sale date
        const saleDateInput = document.getElementById('sale-date');
        if (saleDateInput) {
            saleDateInput.value = new Date().toISOString().split('T')[0];
        }

        // Auto-calculate profit
        const calculateProfit = () => {
            const cost = parseFloat(costPriceInput.value) || 0;
            const selling = parseFloat(sellingPriceInput.value) || 0;
            const shipping = parseFloat(shippingCostInput.value) || 0;
            const profit = selling - cost - shipping;
            profitInput.value = profit.toFixed(2);
        };

        costPriceInput.addEventListener('input', calculateProfit);
        sellingPriceInput.addEventListener('input', calculateProfit);
        shippingCostInput.addEventListener('input', calculateProfit);

        // Handle category selection
        categorySelect.addEventListener('change', () => {
            const selectedValues = Array.from(categorySelect.selectedOptions).map(option => option.value);
            otherCategoryInput.style.display = selectedValues.includes('Other') ? 'block' : 'none';
        });

        // Form submission
        salesForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSalesSubmission();
        });

        // Generate receipt
        generateReceiptBtn.addEventListener('click', () => {
            if (this.currentSale) {
                try {
                    const customerData = {
                        name: this.currentSale.customerName,
                        phone: this.currentSale.customerPhone,
                        address: this.currentSale.customerAddress,
                        email: this.currentSale.customerEmail
                    };
                    
                    const appName = document.getElementById('app-name').textContent;
                    const success = pdfGenerator.generateReceipt(this.currentSale, customerData, appName);
                    
                    if (success) {
                        ui.showToast('Receipt generated successfully!', 'success');
                    } else {
                        ui.showToast('Error generating receipt', 'error');
                    }
                } catch (error) {
                    console.error('Error generating receipt:', error);
                    ui.showToast('Error generating receipt', 'error');
                }
            } else {
                ui.showToast('No sale data available for receipt generation', 'warning');
            }
        });

        // Form reset
        salesForm.addEventListener('reset', () => {
            this.currentSale = null;
            generateReceiptBtn.disabled = true;
            otherCategoryInput.style.display = 'none';
            saleDateInput.value = new Date().toISOString().split('T')[0];
            document.getElementById('quantity').value = '1';
            document.getElementById('tracking-id').value = '';
        });

        // Barcode scanning
        this.initializeBarcodeScanning();
    }

    initializeBarcodeScanning() {
        const scanButton = document.getElementById('scan-barcode');
        const cameraModal = document.getElementById('camera-modal');
        const cameraClose = document.getElementById('camera-close');
        const cameraVideo = document.getElementById('camera-video');
        const useScannedCode = document.getElementById('use-scanned-code');
        let stream = null;

        scanButton.addEventListener('click', async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                cameraVideo.srcObject = stream;
                cameraModal.style.display = 'flex';
                
                // Simple barcode detection (you can integrate a proper barcode library here)
                this.startBarcodeDetection(cameraVideo);
            } catch (error) {
                console.error('Camera access denied:', error);
                ui.showToast('Camera access denied. Please enter tracking ID manually.', 'error');
            }
        });

        cameraClose.addEventListener('click', () => {
            this.stopCamera(stream, cameraModal);
        });

        useScannedCode.addEventListener('click', () => {
            const scannedCode = document.getElementById('scanned-code').textContent;
            document.getElementById('tracking-id').value = scannedCode;
            this.stopCamera(stream, cameraModal);
        });
    }

    startBarcodeDetection(video) {
        // Simple mock barcode detection - in production, use a proper barcode library
        setTimeout(() => {
            const mockBarcode = 'TJ' + Date.now().toString().slice(-8);
            document.getElementById('scanned-code').textContent = mockBarcode;
            document.getElementById('camera-result').style.display = 'block';
        }, 2000);
    }

    stopCamera(stream, modal) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        modal.style.display = 'none';
        document.getElementById('camera-result').style.display = 'none';
    }

    async handleSalesSubmission() {
        try {
            ui.showLoading('Saving sale...');

            const formData = this.collectSalesFormData();
            
            // Validate required fields
            if (!formData.customerName || !formData.customerPhone || !formData.costPrice || !formData.sellingPrice) {
                ui.showToast('Please fill in all required fields', 'error');
                return;
            }

            // Save customer if new
            await this.saveCustomerFromSale(formData);

            // Save sale
            const sale = await database.addSale(formData);
            this.currentSale = sale;

            // Enable receipt generation
            document.getElementById('generate-receipt').disabled = false;

            // Show success message
            ui.showToast('Sale recorded successfully!', 'success');

            // Refresh recent sales if on that tab
            if (document.getElementById('recent-sales').classList.contains('active')) {
                await this.loadRecentSales();
            }

        } catch (error) {
            console.error('Error saving sale:', error);
            ui.showToast('Error saving sale', 'error');
        } finally {
            ui.hideLoading();
        }
    }

    collectSalesFormData() {
        const categorySelect = document.getElementById('category');
        const selectedCategories = Array.from(categorySelect.selectedOptions).map(option => option.value);
        
        // Handle "Other" category
        if (selectedCategories.includes('Other')) {
            const otherCategory = document.getElementById('other-category').value.trim();
            if (otherCategory) {
                selectedCategories[selectedCategories.indexOf('Other')] = otherCategory;
            }
        }

        return {
            customerName: document.getElementById('customer-name').value.trim(),
            customerPhone: document.getElementById('customer-phone').value.trim(),
            customerAddress: document.getElementById('customer-address').value.trim(),
            customerEmail: document.getElementById('customer-email').value.trim(),
            quantity: parseInt(document.getElementById('quantity').value) || 1,
            trackingId: document.getElementById('tracking-id').value.trim(),
            category: selectedCategories.filter(cat => cat),
            saleDate: document.getElementById('sale-date').value,
            costPrice: parseFloat(document.getElementById('cost-price').value) || 0,
            sellingPrice: parseFloat(document.getElementById('selling-price').value) || 0,
            shippingCost: parseFloat(document.getElementById('shipping-cost').value) || 0,
            profit: parseFloat(document.getElementById('profit').value) || 0,
            paymentMode: document.getElementById('payment-mode').value
        };
    }

    async saveCustomerFromSale(saleData) {
        try {
            // Check if customer already exists
            const existingCustomers = await database.searchCustomers(saleData.customerPhone);
            
            if (existingCustomers.length === 0) {
                // Add new customer
                await database.addCustomer({
                    name: saleData.customerName,
                    phone: saleData.customerPhone,
                    address: saleData.customerAddress,
                    email: saleData.customerEmail
                });
            }
        } catch (error) {
            console.error('Error saving customer:', error);
        }
    }

    initializeCustomerSearch() {
        const customerSearchInput = document.getElementById('customer-search');
        const suggestionsDropdown = document.getElementById('customer-suggestions');

        if (!customerSearchInput) return;

        const debouncedSearch = ui.debounce(async () => {
            const searchTerm = customerSearchInput.value.trim();
            
            if (searchTerm.length < 2) {
                suggestionsDropdown.style.display = 'none';
                return;
            }

            try {
                const customers = await database.searchCustomers(searchTerm);
                this.displayCustomerSuggestions(customers, suggestionsDropdown);
            } catch (error) {
                console.error('Error searching customers:', error);
            }
        }, 300);

        customerSearchInput.addEventListener('input', debouncedSearch);
        
        customerSearchInput.addEventListener('blur', () => {
            // Delay hiding to allow for click events
            setTimeout(() => {
                suggestionsDropdown.style.display = 'none';
            }, 200);
        });

        customerSearchInput.addEventListener('focus', () => {
            if (customerSearchInput.value.trim().length >= 2) {
                debouncedSearch();
            }
        });
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
                    <small>${customer.phone} • ${customer.address}</small>
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
        document.getElementById('customer-phone').value = customer.phone || '';
        document.getElementById('customer-address').value = customer.address || '';
        document.getElementById('customer-email').value = customer.email || '';
        document.getElementById('customer-search').value = customer.name || '';
    }

    initializeRecentSales() {
        const applyFiltersBtn = document.getElementById('apply-filters');
        
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.loadRecentSales();
            });
        }

        // Load initial data
        this.loadRecentSales();
    }

    async loadRecentSales() {
        try {
            ui.showLoading('Loading sales...');

            const filters = this.collectSalesFilters();
            const sales = await database.getSales(filters);

            this.displaySalesTable(sales);
            this.populateFilterOptions(sales);

        } catch (error) {
            console.error('Error loading sales:', error);
            ui.showToast('Error loading sales data', 'error');
        } finally {
            ui.hideLoading();
        }
    }

    collectSalesFilters() {
        return {
            startDate: document.getElementById('date-from')?.value,
            endDate: document.getElementById('date-to')?.value,
            category: document.getElementById('filter-category')?.value,
            paymentMode: document.getElementById('filter-payment')?.value
        };
    }

    displaySalesTable(sales) {
        const tableBody = document.querySelector('#sales-table tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (sales.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="10" style="text-align: center; padding: 2rem; color: var(--text-light);">
                    No sales records found
                </td>
            `;
            tableBody.appendChild(row);
            return;
        }

        sales.forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ui.formatDate(sale.createdAt || sale.saleDate)}</td>
                <td>${sale.customerName || 'N/A'}</td>
                <td>${sale.trackingId || 'N/A'}</td>
                <td>${sale.quantity || 1}</td>
                <td>${Array.isArray(sale.category) ? sale.category.join(', ') : (sale.category || 'N/A')}</td>
                <td>${ui.formatCurrency(sale.costPrice || 0)}</td>
                <td>${ui.formatCurrency(sale.sellingPrice || 0)}</td>
                <td>${ui.formatCurrency(sale.profit || 0)}</td>
                <td>${sale.paymentMode || 'N/A'}</td>
                <td class="actions">
                    <button class="btn btn-secondary" onclick="app.generateReceipt(${JSON.stringify(sale).replace(/"/g, '&quot;')})">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn btn-outline" onclick="app.editSale('${sale.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    populateFilterOptions(sales) {
        const categoryFilter = document.getElementById('filter-category');
        if (!categoryFilter) return;

        // Get unique categories
        const categories = new Set();
        sales.forEach(sale => {
            if (sale.category && Array.isArray(sale.category)) {
                sale.category.forEach(cat => categories.add(cat));
            }
        });

        // Clear existing options except first
        while (categoryFilter.children.length > 1) {
            categoryFilter.removeChild(categoryFilter.lastChild);
        }

        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    initializeCustomerManagement() {
        const customerSearchBar = document.getElementById('customer-search-bar');
        
        if (customerSearchBar) {
            const debouncedSearch = ui.debounce(() => {
                this.loadCustomers(customerSearchBar.value.trim());
            }, 300);

            customerSearchBar.addEventListener('input', debouncedSearch);
        }

        // Load initial data
        this.loadCustomers();
    }

    async loadCustomers(searchTerm = '') {
        try {
            ui.showLoading('Loading customers...');

            let customers = await database.getCustomers();
            
            if (searchTerm) {
                customers = customers.filter(customer =>
                    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    customer.phone.includes(searchTerm) ||
                    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            // Get sales data for customer statistics
            const sales = await database.getSales();
            this.displayCustomersTable(customers, sales);

        } catch (error) {
            console.error('Error loading customers:', error);
            ui.showToast('Error loading customers', 'error');
        } finally {
            ui.hideLoading();
        }
    }

    displayCustomersTable(customers, sales) {
        const tableBody = document.querySelector('#customers-table tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (customers.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-light);">
                    No customers found
                </td>
            `;
            tableBody.appendChild(row);
            return;
        }

        // Calculate customer statistics
        const customerStats = {};
        sales.forEach(sale => {
            const customerId = sale.customerId || sale.customerName;
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

        customers.forEach(customer => {
            const stats = customerStats[customer.id] || customerStats[customer.name] || {
                totalPurchases: 0,
                totalSpent: 0,
                lastPurchase: null
            };

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.name || 'N/A'}</td>
                <td>${customer.phone || 'N/A'}</td>
                <td>${customer.email || 'N/A'}</td>
                <td>${customer.address || 'N/A'}</td>
                <td>${stats.totalPurchases}</td>
                <td>${stats.lastPurchase ? ui.formatDate(stats.lastPurchase) : 'Never'}</td>
                <td class="actions">
                    <button class="btn btn-secondary" onclick="app.viewCustomerHistory('${customer.id}')">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="btn btn-outline" onclick="app.editCustomer(${JSON.stringify(customer).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    initializeSettings() {
        const saveAppSettingsBtn = document.getElementById('save-app-settings');
        const backupDataBtn = document.getElementById('backup-data');
        const restoreDataBtn = document.getElementById('restore-data');
        const restoreFileInput = document.getElementById('restore-file');
        const clearDataBtn = document.getElementById('clear-data');
        const forceSyncBtn = document.getElementById('force-sync');

        if (saveAppSettingsBtn) {
            saveAppSettingsBtn.addEventListener('click', async () => {
                const appName = document.getElementById('app-name-setting').value.trim();
                if (appName) {
                    await database.setSetting('appName', appName);
                    document.getElementById('app-name').textContent = appName;
                    document.title = `${appName} - Sales Management`;
                    ui.showToast('Settings saved successfully', 'success');
                }
            });
        }

        if (backupDataBtn) {
            backupDataBtn.addEventListener('click', async () => {
                try {
                    ui.showLoading('Creating backup...');
                    const data = await database.exportData();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `jewelry-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    ui.showToast('Backup created successfully', 'success');
                } catch (error) {
                    console.error('Error creating backup:', error);
                    ui.showToast('Error creating backup', 'error');
                } finally {
                    ui.hideLoading();
                }
            });
        }

        if (restoreDataBtn) {
            restoreDataBtn.addEventListener('click', () => {
                restoreFileInput.click();
            });
        }

        if (restoreFileInput) {
            restoreFileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    ui.showLoading('Restoring data...');
                    const text = await file.text();
                    const data = JSON.parse(text);
                    
                    const success = await database.importData(data);
                    if (success) {
                        ui.showToast('Data restored successfully', 'success');
                        // Refresh current view
                        window.location.reload();
                    } else {
                        ui.showToast('Error restoring data', 'error');
                    }
                } catch (error) {
                    console.error('Error restoring data:', error);
                    ui.showToast('Error restoring data', 'error');
                } finally {
                    ui.hideLoading();
                }
            });
        }

        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                ui.showModal(
                    'Clear All Data',
                    'Are you sure you want to clear all data? This action cannot be undone.',
                    {
                        confirmText: 'Clear Data',
                        confirmClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                ui.showLoading('Clearing data...');
                                await database.clearAllData();
                                ui.showToast('All data cleared successfully', 'success');
                                window.location.reload();
                            } catch (error) {
                                console.error('Error clearing data:', error);
                                ui.showToast('Error clearing data', 'error');
                            } finally {
                                ui.hideLoading();
                            }
                        }
                    }
                );
            });
        }

        if (forceSyncBtn) {
            forceSyncBtn.addEventListener('click', async () => {
                try {
                    ui.showLoading('Syncing data...');
                    await database.syncOfflineData();
                    ui.showToast('Data synced successfully', 'success');
                } catch (error) {
                    console.error('Error syncing data:', error);
                    ui.showToast('Error syncing data', 'error');
                } finally {
                    ui.hideLoading();
                }
            });
        }

        // Theme settings
        this.initializeThemeSettings();
    }

    initializeLogoUpload() {
        const logoUploadBtn = document.getElementById('logo-upload-btn');
        const logoUploadInput = document.getElementById('logo-upload');
        const logoFilename = document.getElementById('logo-filename');
        const appLogo = document.getElementById('app-logo');

        if (logoUploadBtn && logoUploadInput) {
            logoUploadBtn.addEventListener('click', () => {
                logoUploadInput.click();
            });

            logoUploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Validate file type
                const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'];
                if (!allowedTypes.includes(file.type)) {
                    ui.showToast('Please select a valid image file (PNG, JPG, SVG)', 'error');
                    return;
                }

                // Validate file size (2MB max)
                if (file.size > 2 * 1024 * 1024) {
                    ui.showToast('File size must be less than 2MB', 'error');
                    return;
                }

                // Read and display the file
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageData = e.target.result;
                    
                    // Update logo in header
                    if (appLogo) {
                        appLogo.src = imageData;
                    }
                    
                    // Save to localStorage
                    localStorage.setItem('customLogo', imageData);
                    
                    // Update filename display
                    if (logoFilename) {
                        logoFilename.textContent = file.name;
                    }
                    
                    ui.showToast('Logo updated successfully', 'success');
                };
                
                reader.onerror = () => {
                    ui.showToast('Error reading file', 'error');
                };
                
                reader.readAsDataURL(file);
            });
        }

        // Load saved logo on initialization
        const savedLogo = localStorage.getItem('customLogo');
        if (savedLogo && appLogo) {
            appLogo.src = savedLogo;
        }
    }

    initializePasswordChange() {
        const changePasswordForm = document.getElementById('change-password-form');
        
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const currentPassword = document.getElementById('current-password').value;
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                
                // Validate passwords match
                if (newPassword !== confirmPassword) {
                    ui.showToast('New passwords do not match', 'error');
                    return;
                }
                
                // Get current credentials
                const storedCredentials = JSON.parse(localStorage.getItem('adminCredentials') || '{"username": "admin", "password": "admin"}');
                
                // Validate current password
                if (currentPassword !== storedCredentials.password) {
                    ui.showToast('Current password is incorrect', 'error');
                    return;
                }
                
                // Update password
                storedCredentials.password = newPassword;
                localStorage.setItem('adminCredentials', JSON.stringify(storedCredentials));
                
                // Clear form
                changePasswordForm.reset();
                
                ui.showToast('Password changed successfully', 'success');
            });
        }
    }

    initializeThemeSettings() {
        const themeSelect = document.getElementById('theme-color');
        const applyThemeBtn = document.getElementById('apply-theme');

        // Load saved theme
        const savedTheme = localStorage.getItem('app-theme') || 'gold';
        themeSelect.value = savedTheme;
        this.applyTheme(savedTheme);

        applyThemeBtn.addEventListener('click', () => {
            const selectedTheme = themeSelect.value;
            this.applyTheme(selectedTheme);
            localStorage.setItem('app-theme', selectedTheme);
            ui.showToast('Theme applied successfully', 'success');
        });
    }

    applyTheme(theme) {
        const root = document.documentElement;
        root.className = root.className.replace(/theme-\w+/g, '');
        if (theme !== 'gold') {
            root.classList.add(`theme-${theme}`);
        }
    }

    initializeAnalytics() {
        const analyticsPeriodSelect = document.getElementById('analytics-period');
        const exportAnalyticsBtn = document.getElementById('export-analytics');

        if (analyticsPeriodSelect) {
            analyticsPeriodSelect.addEventListener('change', () => {
                analytics.refreshAnalytics();
            });
        }

        if (exportAnalyticsBtn) {
            exportAnalyticsBtn.addEventListener('click', () => {
                this.exportAnalyticsReport();
            });
        }
    }

    async exportAnalyticsReport() {
        try {
            ui.showLoading('Generating PDF report...');
            
            const salesData = await database.getSales();
            const customersData = await database.getCustomers();
            const appName = document.getElementById('app-name').textContent;
            
            // Generate comprehensive analytics PDF
            const success = pdfGenerator.generateAnalyticsReport(salesData, customersData, appName);
            
            if (success) {
                ui.showToast('Analytics report exported successfully', 'success');
            } else {
                ui.showToast('Error generating analytics report', 'error');
            }
        } catch (error) {
            console.error('Error exporting analytics report:', error);
            ui.showToast('Error exporting analytics report', 'error');
        } finally {
            ui.hideLoading();
        }
    }

    initializeExportImport() {
        // Sales export/import
        const exportSalesBtn = document.getElementById('export-sales');
        const importSalesBtn = document.getElementById('import-sales');
        const importFileInput = document.getElementById('import-file');

        if (exportSalesBtn) {
            exportSalesBtn.addEventListener('click', async () => {
                const filters = this.collectSalesFilters();
                const sales = await database.getSales(filters);
                
                ui.showModal(
                    'Export Sales Data',
                    `
                        <p>Choose export format:</p>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button id="export-excel" class="btn btn-primary">
                                <i class="fas fa-file-excel"></i> Excel
                            </button>
                            <button id="export-csv" class="btn btn-secondary">
                                <i class="fas fa-file-csv"></i> CSV
                            </button>
                            <button id="export-pdf" class="btn btn-secondary">
                                <i class="fas fa-file-pdf"></i> PDF Report
                            </button>
                        </div>
                    `,
                    { hideFooter: true }
                );

                // Add event listeners for export options
                setTimeout(() => {
                    document.getElementById('export-excel')?.addEventListener('click', () => {
                        excelHandler.exportSalesData(sales);
                        ui.hideModal();
                    });
                    
                    document.getElementById('export-csv')?.addEventListener('click', () => {
                        this.exportToCSV(sales, 'sales-data');
                        ui.hideModal();
                    });
                    
                    document.getElementById('export-pdf')?.addEventListener('click', () => {
                        pdfGenerator.generateSalesReport(sales, filters);
                        ui.hideModal();
                    });
                }, 100);
            });
        }

        if (importSalesBtn) {
            importSalesBtn.addEventListener('click', () => {
                importFileInput.click();
            });
        }

        if (importFileInput) {
            importFileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    ui.showLoading('Importing sales data...');
                    const salesData = await excelHandler.importFromExcel(file, 'sales');
                    
                    for (const sale of salesData) {
                        await database.addSale(sale);
                    }
                    
                    ui.showToast(`Imported ${salesData.length} sales records`, 'success');
                    await this.loadRecentSales();
                } catch (error) {
                    console.error('Error importing sales:', error);
                    ui.showToast('Error importing sales data', 'error');
                } finally {
                    ui.hideLoading();
                }
            });
        }

        // Customer export/import
        const exportCustomersBtn = document.getElementById('export-customers');
        const importCustomersBtn = document.getElementById('import-customers');
        const importCustomersFile = document.getElementById('import-customers-file');

        if (exportCustomersBtn) {
            exportCustomersBtn.addEventListener('click', async () => {
                const customers = await database.getCustomers();
                const sales = await database.getSales();
                excelHandler.exportCustomerData(customers, sales);
            });
        }

        if (importCustomersBtn) {
            importCustomersBtn.addEventListener('click', () => {
                importCustomersFile.click();
            });
        }

        if (importCustomersFile) {
            importCustomersFile.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    ui.showLoading('Importing customer data...');
                    const customerData = await excelHandler.importFromExcel(file, 'customers');
                    
                    for (const customer of customerData) {
                        await database.addCustomer(customer);
                    }
                    
                    ui.showToast(`Imported ${customerData.length} customers`, 'success');
                    await this.loadCustomers();
                } catch (error) {
                    console.error('Error importing customers:', error);
                    ui.showToast('Error importing customer data', 'error');
                } finally {
                    ui.hideLoading();
                }
            });
        }

        // Dashboard export
        const exportDashboardBtn = document.getElementById('export-dashboard');
        if (exportDashboardBtn) {
            exportDashboardBtn.addEventListener('click', async () => {
                const sales = await database.getSales();
                const customers = await database.getCustomers();
                excelHandler.exportDashboardData(sales, customers);
            });
        }
    }

    async loadInitialData() {
        // Load initial data for the active tab
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            const tabId = activeTab.id;
            ui.onTabSwitch(tabId);
        }
    }

    // Utility methods
    generateReceipt(sale) {
        try {
            console.log('Generating receipt for sale:', sale);
            
            if (!sale) {
                ui.showToast('No sale data provided', 'error');
                return false;
            }
            
            const customerData = {
                name: sale.customerName,
                phone: sale.customerPhone,
                address: sale.customerAddress,
                email: sale.customerEmail
            };

            const appName = document.getElementById('app-name').textContent;
            const success = pdfGenerator.generateReceipt(sale, customerData, appName);
            
            if (success) {
                ui.showToast('Receipt generated successfully', 'success');
                return true;
            } else {
                ui.showToast('Error generating receipt', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error generating receipt:', error);
            ui.showToast('Error generating receipt', 'error');
            return false;
        }
    }

    exportToCSV(data, filename) {
        try {
            const csvContent = this.convertToCSV(data);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            ui.showToast('CSV exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            ui.showToast('Error exporting CSV', 'error');
        }
    }

    convertToCSV(data) {
        if (!data.length) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }

    editSale(saleId) {
        ui.showModal(
            'Edit Sale',
            `
                <div id="edit-sale-form">
                    <div class="form-group">
                        <label for="edit-customer-name">Customer Name</label>
                        <input type="text" id="edit-customer-name" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-customer-phone">Phone</label>
                        <input type="tel" id="edit-customer-phone" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-selling-price">Selling Price</label>
                        <input type="number" id="edit-selling-price" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-payment-mode">Payment Mode</label>
                        <select id="edit-payment-mode">
                            <option value="UPI">UPI</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash">Cash</option>
                        </select>
                    </div>
                </div>
            `,
            {
                confirmText: 'Update Sale',
                onConfirm: async () => {
                    await this.updateSale(saleId);
                }
            }
        );
        
        // Load current sale data
        this.loadSaleForEdit(saleId);
    }

    async loadSaleForEdit(saleId) {
        try {
            const sales = await database.getSales();
            const sale = sales.find(s => s.id === saleId);
            
            if (sale) {
                document.getElementById('edit-customer-name').value = sale.customerName || '';
                document.getElementById('edit-customer-phone').value = sale.customerPhone || '';
                document.getElementById('edit-selling-price').value = sale.sellingPrice || '';
                document.getElementById('edit-payment-mode').value = sale.paymentMode || '';
            }
        } catch (error) {
            console.error('Error loading sale for edit:', error);
        }
    }

    async updateSale(saleId) {
        try {
            ui.showLoading('Updating sale...');
            
            const updatedData = {
                customerName: document.getElementById('edit-customer-name').value,
                customerPhone: document.getElementById('edit-customer-phone').value,
                sellingPrice: parseFloat(document.getElementById('edit-selling-price').value),
                paymentMode: document.getElementById('edit-payment-mode').value
            };
            
            // Update in database (you'll need to implement updateSale in database.js)
            await database.updateSale(saleId, updatedData);
            
            ui.showToast('Sale updated successfully', 'success');
            await this.loadRecentSales();
        } catch (error) {
            console.error('Error updating sale:', error);
            ui.showToast('Error updating sale', 'error');
        } finally {
            ui.hideLoading();
        }
    }

    editCustomer(customer) {
        ui.showModal(
            'Edit Customer',
            `
                <div id="edit-customer-form">
                    <div class="form-group">
                        <label for="edit-cust-name">Name</label>
                        <input type="text" id="edit-cust-name" value="${customer.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-cust-phone">Phone</label>
                        <input type="tel" id="edit-cust-phone" value="${customer.phone || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-cust-email">Email</label>
                        <input type="email" id="edit-cust-email" value="${customer.email || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-cust-address">Address</label>
                        <textarea id="edit-cust-address" rows="3">${customer.address || ''}</textarea>
                    </div>
                </div>
            `,
            {
                confirmText: 'Update Customer',
                onConfirm: async () => {
                    await this.updateCustomer(customer.id);
                }
            }
        );
    }

    async updateCustomer(customerId) {
        try {
            ui.showLoading('Updating customer...');
            
            const updatedData = {
                name: document.getElementById('edit-cust-name').value,
                phone: document.getElementById('edit-cust-phone').value,
                email: document.getElementById('edit-cust-email').value,
                address: document.getElementById('edit-cust-address').value
            };
            
            // Update in database (you'll need to implement updateCustomer in database.js)
            await database.updateCustomer(customerId, updatedData);
            
            ui.showToast('Customer updated successfully', 'success');
            await this.loadCustomers();
        } catch (error) {
            console.error('Error updating customer:', error);
            ui.showToast('Error updating customer', 'error');
        } finally {
            ui.hideLoading();
        }
    }

    viewCustomerHistory(customerId) {
        // TODO: Implement customer history view
        ui.showToast('Customer history coming soon', 'info');
    }
}

// Make app globally available
window.app = new JewelryApp();