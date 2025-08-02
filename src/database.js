// Database operations using Firebase Firestore and localStorage fallback
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    where, 
    onSnapshot,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import { db } from './firebase-config.js';

class DatabaseManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.collections = {
            sales: 'sales',
            customers: 'customers',
            settings: 'settings'
        };
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncOfflineData();
            this.updateConnectionStatus();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus();
        });
        
        this.updateConnectionStatus();
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('sync-status');
        if (statusElement) {
            if (this.isOnline) {
                statusElement.innerHTML = '<i class="fas fa-wifi status-online"></i>';
                statusElement.title = 'Online - Data synced';
            } else {
                statusElement.innerHTML = '<i class="fas fa-wifi-slash status-offline"></i>';
                statusElement.title = 'Offline - Data saved locally';
            }
        }
    }

    // Generate unique ID for offline storage
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Sales Operations
    async addSale(saleData) {
        try {
            const sale = {
                ...saleData,
                createdAt: saleData.createdAt || new Date().toISOString(),
                id: this.generateId()
            };

            console.log('Adding sale to database:', sale);

            if (this.isOnline) {
                try {
                    const docRef = await addDoc(collection(db, this.collections.sales), {
                        ...sale,
                        createdAt: serverTimestamp()
                    });
                    sale.firestoreId = docRef.id;
                    console.log('Sale added to Firestore with ID:', docRef.id);
                } catch (firestoreError) {
                    console.error('Firestore error, falling back to localStorage:', firestoreError);
                }
            }

            // Always save to localStorage as backup
            this.saveToLocalStorage('sales', sale);
            return sale;
        } catch (error) {
            console.error('Error adding sale:', error);
            // Fallback to localStorage only
            const sale = {
                ...saleData,
                createdAt: new Date().toISOString(),
                id: this.generateId()
            };
            this.saveToLocalStorage('sales', sale);
            return sale;
        }
    }

    async getSales(filters = {}) {
        try {
            let sales = [];
            
            console.log('Getting sales from database...');
            
            if (this.isOnline) {
                try {
                    let q = collection(db, this.collections.sales);
                    
                    if (filters.startDate || filters.endDate) {
                        if (filters.startDate && filters.endDate) {
                            q = query(q, 
                                where('createdAt', '>=', new Date(filters.startDate)),
                                where('createdAt', '<=', new Date(filters.endDate))
                            );
                        }
                    }
                    
                    q = query(q, orderBy('createdAt', 'desc'));
                    
                    const querySnapshot = await getDocs(q);
                    sales = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        firestoreId: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
                    }));
                    console.log('Retrieved', sales.length, 'sales from Firestore');
                } catch (firestoreError) {
                    console.error('Firestore error, using localStorage only:', firestoreError);
                }
            }
            
            // Merge with localStorage data
            const localSales = this.getFromLocalStorage('sales') || [];
            
            // Filter out duplicates and merge
            const allSales = [...sales];
            localSales.forEach(localSale => {
                if (!allSales.find(sale => sale.id === localSale.id)) {
                    allSales.push(localSale);
                }
            });
            
            // Apply filters
            const filteredSales = this.applyFilters(allSales, filters);
            console.log('Returning', filteredSales.length, 'filtered sales');
            return filteredSales;
        } catch (error) {
            console.error('Error getting sales:', error);
            // Fallback to localStorage
            const localSales = this.getFromLocalStorage('sales') || [];
            return this.applyFilters(localSales, filters);
        }
    }

    // Customer Operations
    async addCustomer(customerData) {
        try {
            const customer = {
                ...customerData,
                createdAt: new Date().toISOString(),
                id: this.generateId()
            };

            if (this.isOnline) {
                const docRef = await addDoc(collection(db, this.collections.customers), {
                    ...customer,
                    createdAt: serverTimestamp()
                });
                customer.firestoreId = docRef.id;
            }

            this.saveToLocalStorage('customers', customer);
            return customer;
        } catch (error) {
            console.error('Error adding customer:', error);
            const customer = {
                ...customerData,
                createdAt: new Date().toISOString(),
                id: this.generateId()
            };
            this.saveToLocalStorage('customers', customer);
            return customer;
        }
    }

    async getCustomers() {
        try {
            let customers = [];
            
            if (this.isOnline) {
                const q = query(collection(db, this.collections.customers), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                customers = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    firestoreId: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
                }));
            }
            
            const localCustomers = this.getFromLocalStorage('customers') || [];
            
            // Merge and deduplicate
            const allCustomers = [...customers];
            localCustomers.forEach(localCustomer => {
                if (!allCustomers.find(customer => customer.id === localCustomer.id)) {
                    allCustomers.push(localCustomer);
                }
            });
            
            return allCustomers;
        } catch (error) {
            console.error('Error getting customers:', error);
            return this.getFromLocalStorage('customers') || [];
        }
    }

    async searchCustomers(searchTerm) {
        const customers = await this.getCustomers();
        return customers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Settings Operations
    async getSetting(key) {
        try {
            if (this.isOnline) {
                const q = query(collection(db, this.collections.settings), where('key', '==', key));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    return querySnapshot.docs[0].data().value;
                }
            }
            
            const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
            return settings[key];
        } catch (error) {
            console.error('Error getting setting:', error);
            const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
            return settings[key];
        }
    }

    async setSetting(key, value) {
        try {
            if (this.isOnline) {
                const q = query(collection(db, this.collections.settings), where('key', '==', key));
                const querySnapshot = await getDocs(q);
                
                if (querySnapshot.empty) {
                    await addDoc(collection(db, this.collections.settings), {
                        key,
                        value,
                        updatedAt: serverTimestamp()
                    });
                } else {
                    const docRef = doc(db, this.collections.settings, querySnapshot.docs[0].id);
                    await updateDoc(docRef, {
                        value,
                        updatedAt: serverTimestamp()
                    });
                }
            }
            
            // Always save to localStorage
            const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
            settings[key] = value;
            localStorage.setItem('app_settings', JSON.stringify(settings));
            
            return true;
        } catch (error) {
            console.error('Error setting value:', error);
            // Fallback to localStorage
            const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
            settings[key] = value;
            localStorage.setItem('app_settings', JSON.stringify(settings));
            return true;
        }
    }

    // Local Storage Operations
    saveToLocalStorage(type, data) {
        try {
            const stored = JSON.parse(localStorage.getItem(type) || '[]');
            const existingIndex = stored.findIndex(item => item.id === data.id);
            
            if (existingIndex >= 0) {
                stored[existingIndex] = data;
            } else {
                stored.push(data);
            }
            
            localStorage.setItem(type, JSON.stringify(stored));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    getFromLocalStorage(type) {
        try {
            return JSON.parse(localStorage.getItem(type) || '[]');
        } catch (error) {
            console.error('Error getting from localStorage:', error);
            return [];
        }
    }

    // Sync offline data when back online
    async syncOfflineData() {
        if (!this.isOnline) return;
        
        try {
            const statusElement = document.getElementById('sync-status');
            if (statusElement) {
                statusElement.innerHTML = '<i class="fas fa-sync fa-spin status-syncing"></i>';
                statusElement.title = 'Syncing data...';
            }

            // Sync sales
            const localSales = this.getFromLocalStorage('sales') || [];
            for (const sale of localSales) {
                if (!sale.firestoreId) {
                    try {
                        const docRef = await addDoc(collection(db, this.collections.sales), {
                            ...sale,
                            createdAt: serverTimestamp()
                        });
                        sale.firestoreId = docRef.id;
                        this.saveToLocalStorage('sales', sale);
                    } catch (error) {
                        console.error('Error syncing sale:', error);
                    }
                }
            }

            // Sync customers
            const localCustomers = this.getFromLocalStorage('customers') || [];
            for (const customer of localCustomers) {
                if (!customer.firestoreId) {
                    try {
                        const docRef = await addDoc(collection(db, this.collections.customers), {
                            ...customer,
                            createdAt: serverTimestamp()
                        });
                        customer.firestoreId = docRef.id;
                        this.saveToLocalStorage('customers', customer);
                    } catch (error) {
                        console.error('Error syncing customer:', error);
                    }
                }
            }

            // Update last sync time
            await this.setSetting('lastSync', new Date().toISOString());
            
            this.updateConnectionStatus();
        } catch (error) {
            console.error('Error syncing offline data:', error);
            this.updateConnectionStatus();
        }
    }

    // Update sale record
    async updateSale(saleId, updateData) {
        try {
            // Update in Firestore if online
            if (this.isOnline) {
                const sales = await this.getSales();
                const sale = sales.find(s => s.id === saleId);
                
                if (sale && sale.firestoreId) {
                    const saleRef = doc(db, this.collections.sales, sale.firestoreId);
                    await updateDoc(saleRef, {
                        ...updateData,
                        updatedAt: serverTimestamp()
                    });
                }
            }

            // Update in localStorage
            const localSales = this.getFromLocalStorage('sales') || [];
            const saleIndex = localSales.findIndex(s => s.id === saleId);
            
            if (saleIndex >= 0) {
                localSales[saleIndex] = { ...localSales[saleIndex], ...updateData };
                localStorage.setItem('sales', JSON.stringify(localSales));
            }

            return true;
        } catch (error) {
            console.error('Error updating sale:', error);
            return false;
        }
    }

    // Update customer record
    async updateCustomer(customerId, updateData) {
        try {
            // Update in Firestore if online
            if (this.isOnline) {
                const customers = await this.getCustomers();
                const customer = customers.find(c => c.id === customerId);
                
                if (customer && customer.firestoreId) {
                    const customerRef = doc(db, this.collections.customers, customer.firestoreId);
                    await updateDoc(customerRef, {
                        ...updateData,
                        updatedAt: serverTimestamp()
                    });
                }
            }

            // Update in localStorage
            const localCustomers = this.getFromLocalStorage('customers') || [];
            const customerIndex = localCustomers.findIndex(c => c.id === customerId);
            
            if (customerIndex >= 0) {
                localCustomers[customerIndex] = { ...localCustomers[customerIndex], ...updateData };
                localStorage.setItem('customers', JSON.stringify(localCustomers));
            }

            return true;
        } catch (error) {
            console.error('Error updating customer:', error);
            return false;
        }
    }

    // Utility methods
    applyFilters(data, filters) {
        let filtered = [...data];

        if (filters.startDate) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.createdAt || item.saleDate);
                return itemDate >= new Date(filters.startDate);
            });
        }

        if (filters.endDate) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.createdAt || item.saleDate);
                return itemDate <= new Date(filters.endDate);
            });
        }

        if (filters.category) {
            filtered = filtered.filter(item => 
                item.category && item.category.includes(filters.category)
            );
        }

        if (filters.paymentMode) {
            filtered = filtered.filter(item => 
                item.paymentMode === filters.paymentMode
            );
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(item => 
                item.customerName?.toLowerCase().includes(searchTerm) ||
                item.customerPhone?.includes(searchTerm) ||
                item.category?.some(cat => cat.toLowerCase().includes(searchTerm))
            );
        }

        return filtered.sort((a, b) => new Date(b.createdAt || b.saleDate) - new Date(a.createdAt || a.saleDate));
    }

    // Backup and restore
    async exportData() {
        const data = {
            sales: await this.getSales(),
            customers: await this.getCustomers(),
            settings: JSON.parse(localStorage.getItem('app_settings') || '{}'),
            exportDate: new Date().toISOString()
        };
        return data;
    }

    async importData(data) {
        try {
            if (data.sales) {
                for (const sale of data.sales) {
                    await this.addSale(sale);
                }
            }
            
            if (data.customers) {
                for (const customer of data.customers) {
                    await this.addCustomer(customer);
                }
            }
            
            if (data.settings) {
                for (const [key, value] of Object.entries(data.settings)) {
                    await this.setSetting(key, value);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    async clearAllData() {
        try {
            // Clear localStorage
            localStorage.removeItem('sales');
            localStorage.removeItem('customers');
            localStorage.removeItem('app_settings');
            
            // Clear Firestore (if online)
            if (this.isOnline) {
                // Note: In a real app, you'd want to implement batch deletion
                // For demo purposes, we'll just clear localStorage
                console.log('Firestore data would be cleared in production');
            }
            
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }
}

// Export singleton instance
export const database = new DatabaseManager();