// Firebase configuration for Theia Jewelz
const firebaseConfig = {
    apiKey: "AIzaSyBEbRfCjqEOfoLTdrCPCuGHVRIOBPIUEIg",
    authDomain: "theiajewelz.firebaseapp.com",
    projectId: "theiajewelz",
    storageBucket: "theiajewelz.firebasestorage.app",
    messagingSenderId: "328369793227",
    appId: "1:328369793227:web:03c7cbf22b3c2f05cdd34e",
    measurementId: "G-1BKG612HJG"
};

// Initialize Firebase
let db = null;
let auth = null;

try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        
        // Enable offline persistence
        db.enablePersistence().catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
            } else if (err.code == 'unimplemented') {
                console.warn('The current browser does not support all of the features required to enable persistence');
            }
        });
        
        console.log('Firebase initialized successfully');
    } else {
        console.warn('Firebase SDK not loaded');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Enhanced Firebase utility functions
const FirebaseUtils = {
    // Authentication functions
    async createUser(username, password) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            // Hash password (in production, use proper hashing)
            const hashedPassword = this.hashPassword(password);
            
            await db.collection('users').doc(username).set({
                username: username,
                password: hashedPassword,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'user'
            });
            
            console.log('User created:', username);
            return true;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    async validateUser(username, password) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            const userDoc = await db.collection('users').doc(username).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                return userData.password === this.hashPassword(password);
            }
            return false;
        } catch (error) {
            console.error('Error validating user:', error);
            return false;
        }
    },

    async updateUserPassword(username, newPassword) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            await db.collection('users').doc(username).update({
                password: this.hashPassword(newPassword),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Password updated for user:', username);
            return true;
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    },

    hashPassword(password) {
        // Simple hash for demo - use proper hashing in production (bcrypt, etc.)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    },

    // Sales functions
    async addSale(saleData) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            const docRef = await db.collection('sales').add({
                ...saleData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Sale added with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error adding sale:', error);
            throw error;
        }
    },

    async getSales() {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            const snapshot = await db.collection('sales')
                .orderBy('createdAt', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore timestamps to ISO strings
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
            }));
        } catch (error) {
            console.error('Error getting sales:', error);
            throw error;
        }
    },

    async updateSale(saleId, updateData) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            await db.collection('sales').doc(saleId).update({
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Sale updated:', saleId);
            return true;
        } catch (error) {
            console.error('Error updating sale:', error);
            throw error;
        }
    },

    async deleteSale(saleId) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            await db.collection('sales').doc(saleId).delete();
            console.log('Sale deleted:', saleId);
            return true;
        } catch (error) {
            console.error('Error deleting sale:', error);
            throw error;
        }
    },

    // Customer functions
    async addCustomer(customerData) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            const docRef = await db.collection('customers').add({
                ...customerData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Customer added with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error adding customer:', error);
            throw error;
        }
    },

    async getCustomers() {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            const snapshot = await db.collection('customers')
                .orderBy('createdAt', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
            }));
        } catch (error) {
            console.error('Error getting customers:', error);
            throw error;
        }
    },

    async updateCustomer(customerId, updateData) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            await db.collection('customers').doc(customerId).update({
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Customer updated:', customerId);
            return true;
        } catch (error) {
            console.error('Error updating customer:', error);
            throw error;
        }
    },

    async deleteCustomer(customerId) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            await db.collection('customers').doc(customerId).delete();
            console.log('Customer deleted:', customerId);
            return true;
        } catch (error) {
            console.error('Error deleting customer:', error);
            throw error;
        }
    },

    async getCustomerByPhone(phoneNumber) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            const snapshot = await db.collection('customers')
                .where('phone', '==', phoneNumber)
                .get();
            
            if (snapshot.empty) {
                return null;
            }
            
            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
            };
        } catch (error) {
            console.error('Error getting customer by phone:', error);
            throw error;
        }
    },

    // Settings functions
    async saveSettings(settings) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            await db.collection('settings').doc('app').set({
                ...settings,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log('Settings saved');
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    },

    async getSettings() {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            const doc = await db.collection('settings').doc('app').get();
            if (doc.exists) {
                return doc.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting settings:', error);
            throw error;
        }
    },

    // Query functions
    async getSalesByDateRange(startDate, endDate) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            const snapshot = await db.collection('sales')
                .where('saleDate', '>=', startDate)
                .where('saleDate', '<=', endDate)
                .orderBy('saleDate', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
            }));
        } catch (error) {
            console.error('Error getting sales by date range:', error);
            throw error;
        }
    },

    async getSalesByCategory(category) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            const snapshot = await db.collection('sales')
                .where('categories', 'array-contains-any', [{ category: category }])
                .orderBy('createdAt', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
            }));
        } catch (error) {
            console.error('Error getting sales by category:', error);
            throw error;
        }
    },

    // Batch operations
    async batchDeleteSales(saleIds) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            const batch = db.batch();
            saleIds.forEach(id => {
                const saleRef = db.collection('sales').doc(id);
                batch.delete(saleRef);
            });
            
            await batch.commit();
            console.log('Batch delete completed for', saleIds.length, 'sales');
            return true;
        } catch (error) {
            console.error('Error in batch delete:', error);
            throw error;
        }
    },

    async batchDeleteCustomers(customerIds) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            const batch = db.batch();
            customerIds.forEach(id => {
                const customerRef = db.collection('customers').doc(id);
                batch.delete(customerRef);
            });
            
            await batch.commit();
            console.log('Batch delete completed for', customerIds.length, 'customers');
            return true;
        } catch (error) {
            console.error('Error in batch delete:', error);
            throw error;
        }
    },

    // Backup and restore functions
    async createBackup() {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            const [salesSnapshot, customersSnapshot, settingsSnapshot] = await Promise.all([
                db.collection('sales').get(),
                db.collection('customers').get(),
                db.collection('settings').get()
            ]);
            
            const backup = {
                sales: salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                customers: customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                settings: settingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                timestamp: new Date().toISOString(),
                version: '2.0.0'
            };
            
            return backup;
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    },

    async restoreFromBackup(backupData) {
        try {
            if (!db) throw new Error('Firebase not initialized');
            
            const batch = db.batch();
            
            // Restore sales
            if (backupData.sales) {
                backupData.sales.forEach(sale => {
                    const saleRef = db.collection('sales').doc(sale.id);
                    batch.set(saleRef, sale);
                });
            }
            
            // Restore customers
            if (backupData.customers) {
                backupData.customers.forEach(customer => {
                    const customerRef = db.collection('customers').doc(customer.id);
                    batch.set(customerRef, customer);
                });
            }
            
            // Restore settings
            if (backupData.settings) {
                backupData.settings.forEach(setting => {
                    const settingRef = db.collection('settings').doc(setting.id);
                    batch.set(settingRef, setting);
                });
            }
            
            await batch.commit();
            console.log('Backup restored successfully');
            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            throw error;
        }
    }
};

// Initialize default admin user if it doesn't exist
if (db) {
    db.collection('users').doc('admin').get().then(doc => {
        if (!doc.exists) {
            FirebaseUtils.createUser('admin', 'admin123').then(() => {
                console.log('Default admin user created');
            }).catch(error => {
                console.error('Error creating default admin user:', error);
            });
        }
    }).catch(error => {
        console.error('Error checking for admin user:', error);
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig, FirebaseUtils, db, auth };
}

// Make available globally
window.FirebaseUtils = FirebaseUtils;
window.firebaseDB = db;
window.firebaseAuth = auth;