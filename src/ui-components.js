// UI Components and interactions
export class UIComponents {
    constructor() {
        this.initializeComponents();
    }

    initializeComponents() {
        this.initializeTabs();
        this.initializeModals();
        this.initializeTooltips();
        this.initializeFormValidation();
    }

    // Tab Management
    initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
                
                // Trigger tab-specific initialization
                this.onTabSwitch(targetTab);
            });
        });
    }

    onTabSwitch(tabId) {
        switch(tabId) {
            case 'dashboard':
                // Refresh dashboard data
                setTimeout(() => {
                    if (window.analytics && window.analytics.isInitialized) {
                        window.analytics.refreshDashboard();
                    }
                }, 300);
                break;
            case 'analytics':
                // Refresh analytics with delay to ensure DOM is ready
                setTimeout(() => {
                    if (window.analytics && window.analytics.isInitialized) {
                        window.analytics.refreshAnalytics();
                    }
                }, 300);
                break;
            case 'recent-sales':
                // Refresh sales table
                if (window.app && window.app.loadRecentSales) {
                    window.app.loadRecentSales();
                }
                break;
            case 'customer':
                // Refresh customer table
                if (window.app && window.app.loadCustomers) {
                    window.app.loadCustomers();
                }
                break;
        }
    }

    // Modal Management
    initializeModals() {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalClose = document.getElementById('modal-close');
        const modalCancel = document.getElementById('modal-cancel');

        if (modalClose) {
            modalClose.addEventListener('click', () => this.hideModal());
        }
        
        if (modalCancel) {
            modalCancel.addEventListener('click', () => this.hideModal());
        }
        
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.hideModal();
                }
            });
        }
    }

    showModal(title, body, options = {}) {
        const modal = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');
        const confirmBtn = document.getElementById('modal-confirm');

        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = body;
        
        if (options.confirmText) {
            confirmBtn.textContent = options.confirmText;
        } else {
            confirmBtn.textContent = 'Confirm';
        }

        if (options.confirmClass) {
            confirmBtn.className = `btn ${options.confirmClass}`;
        } else {
            confirmBtn.className = 'btn btn-primary';
        }

        if (options.hideFooter) {
            modalFooter.style.display = 'none';
        } else {
            modalFooter.style.display = 'flex';
        }

        // Remove existing event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        if (options.onConfirm) {
            newConfirmBtn.addEventListener('click', () => {
                options.onConfirm();
                this.hideModal();
            });
        }

        modal.style.display = 'flex';
    }

    hideModal() {
        const modal = document.getElementById('modal-overlay');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Loading Management
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = overlay.querySelector('p');
        
        if (loadingText) {
            loadingText.textContent = message;
        }
        
        overlay.style.display = 'flex';
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = 'none';
    }

    // Toast Notifications
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add toast styles if not already present
        this.addToastStyles();

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }

    addToastStyles() {
        if (document.getElementById('toast-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                min-width: 300px;
                max-width: 500px;
            }
            
            .toast.show {
                transform: translateX(0);
            }
            
            .toast-content {
                padding: 1rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .toast-success {
                border-left: 4px solid var(--success-color);
            }
            
            .toast-success i {
                color: var(--success-color);
            }
            
            .toast-error {
                border-left: 4px solid var(--error-color);
            }
            
            .toast-error i {
                color: var(--error-color);
            }
            
            .toast-warning {
                border-left: 4px solid var(--warning-color);
            }
            
            .toast-warning i {
                color: var(--warning-color);
            }
            
            .toast-info {
                border-left: 4px solid var(--primary-color);
            }
            
            .toast-info i {
                color: var(--primary-color);
            }
            
            @media (max-width: 768px) {
                .toast {
                    right: 10px;
                    left: 10px;
                    min-width: auto;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    // Form Validation
    initializeFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });
            
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }

        // Phone validation
        if (field.type === 'tel' && value) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        // Number validation
        if (field.type === 'number' && value) {
            if (isNaN(value) || parseFloat(value) < 0) {
                isValid = false;
                errorMessage = 'Please enter a valid positive number';
            }
        }

        this.showFieldError(field, isValid, errorMessage);
        return isValid;
    }

    validateForm(form) {
        const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    showFieldError(field, isValid, errorMessage) {
        this.clearFieldError(field);

        if (!isValid) {
            field.classList.add('error');
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = errorMessage;
            
            field.parentNode.appendChild(errorDiv);
            
            // Add error styles if not present
            this.addFieldErrorStyles();
        }
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    addFieldErrorStyles() {
        if (document.getElementById('field-error-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'field-error-styles';
        styles.textContent = `
            .form-group input.error,
            .form-group select.error,
            .form-group textarea.error {
                border-color: var(--error-color);
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
            }
            
            .field-error {
                color: var(--error-color);
                font-size: 0.75rem;
                margin-top: 0.25rem;
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }
            
            .field-error::before {
                content: "⚠";
                font-size: 0.875rem;
            }
        `;
        document.head.appendChild(styles);
    }

    // Tooltip Management
    initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.getAttribute('data-tooltip'));
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.id = 'active-tooltip';
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltipRect.width / 2)}px`;
        tooltip.style.top = `${rect.top - tooltipRect.height - 10}px`;
        
        // Add tooltip styles
        this.addTooltipStyles();
        
        setTimeout(() => tooltip.classList.add('show'), 10);
    }

    hideTooltip() {
        const tooltip = document.getElementById('active-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    addTooltipStyles() {
        if (document.getElementById('tooltip-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'tooltip-styles';
        styles.textContent = `
            .tooltip {
                position: absolute;
                background: var(--text-primary);
                color: var(--background);
                padding: 0.5rem 0.75rem;
                border-radius: 4px;
                font-size: 0.75rem;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.2s ease;
                pointer-events: none;
                white-space: nowrap;
            }
            
            .tooltip.show {
                opacity: 1;
            }
            
            .tooltip::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 5px solid transparent;
                border-top-color: var(--text-primary);
            }
        `;
        document.head.appendChild(styles);
    }

    // Table utilities
    createTable(data, columns, options = {}) {
        const table = document.createElement('table');
        table.className = 'data-table';

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.label;
            if (column.sortable) {
                th.classList.add('sortable');
                th.addEventListener('click', () => {
                    this.sortTable(table, column.key);
                });
            }
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        this.populateTableBody(tbody, data, columns, options);
        table.appendChild(tbody);

        return table;
    }

    populateTableBody(tbody, data, columns, options = {}) {
        tbody.innerHTML = '';
        
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            
            columns.forEach(column => {
                const td = document.createElement('td');
                
                if (column.render) {
                    td.innerHTML = column.render(item, index);
                } else {
                    td.textContent = this.getNestedValue(item, column.key) || '';
                }
                
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        });
        
        if (data.length === 0) {
            const row = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = columns.length;
            td.textContent = options.emptyMessage || 'No data available';
            td.style.textAlign = 'center';
            td.style.padding = '2rem';
            td.style.color = 'var(--text-light)';
            row.appendChild(td);
            tbody.appendChild(row);
        }
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    sortTable(table, key) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        const isAscending = !table.dataset.sortAsc || table.dataset.sortAsc === 'false';
        table.dataset.sortAsc = isAscending.toString();
        
        rows.sort((a, b) => {
            const aValue = a.querySelector('td').textContent.trim();
            const bValue = b.querySelector('td').textContent.trim();
            
            const comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
            return isAscending ? comparison : -comparison;
        });
        
        rows.forEach(row => tbody.appendChild(row));
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }

    formatDateTime(date) {
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Export singleton instance
export const ui = new UIComponents();