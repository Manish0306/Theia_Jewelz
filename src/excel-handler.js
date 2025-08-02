// Excel import/export functionality
export class ExcelHandler {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Ensure XLSX library is loaded
        if (typeof XLSX === 'undefined') {
            console.error('XLSX library not loaded');
            return;
        }
    }

    // Export data to Excel
    exportToExcel(data, filename, sheetName = 'Sheet1') {
        try {
            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);

            // Auto-size columns
            this.autoSizeColumns(ws, data);

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, sheetName);

            // Generate Excel file and download
            XLSX.writeFile(wb, `${filename}.xlsx`);
            return true;
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            return false;
        }
    }

    // Export sales data
    async exportSalesData(salesData) {
        try {
            const exportData = salesData.map(sale => ({
                'Date': new Date(sale.createdAt || sale.saleDate).toLocaleDateString(),
                'Customer Name': sale.customerName || '',
                'Customer Phone': sale.customerPhone || '',
                'Customer Email': sale.customerEmail || '',
                'Customer Address': sale.customerAddress || '',
                'Category': Array.isArray(sale.category) ? sale.category.join(', ') : (sale.category || ''),
                'Cost Price': parseFloat(sale.costPrice || 0),
                'Selling Price': parseFloat(sale.sellingPrice || 0),
                'Shipping Cost': parseFloat(sale.shippingCost || 0),
                'Profit': parseFloat(sale.profit || 0),
                'Payment Mode': sale.paymentMode || '',
                'Sale ID': sale.id || ''
            }));

            return this.exportToExcel(exportData, `sales-data-${new Date().toISOString().split('T')[0]}`, 'Sales Data');
        } catch (error) {
            console.error('Error exporting sales data:', error);
            return false;
        }
    }

    // Export customer data
    async exportCustomerData(customerData, salesData = []) {
        try {
            // Calculate customer statistics
            const customerStats = {};
            salesData.forEach(sale => {
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

            const exportData = customerData.map(customer => {
                const stats = customerStats[customer.id] || customerStats[customer.name] || {
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
                    'Total Spent': stats.totalSpent,
                    'Last Purchase': stats.lastPurchase ? stats.lastPurchase.toLocaleDateString() : 'Never',
                    'Customer Since': new Date(customer.createdAt).toLocaleDateString(),
                    'Customer ID': customer.id || ''
                };
            });

            return this.exportToExcel(exportData, `customer-data-${new Date().toISOString().split('T')[0]}`, 'Customer Data');
        } catch (error) {
            console.error('Error exporting customer data:', error);
            return false;
        }
    }

    // Export dashboard data
    async exportDashboardData(salesData, customerData) {
        try {
            const wb = XLSX.utils.book_new();

            // Summary sheet
            const summary = this.generateSummaryData(salesData, customerData);
            const summaryWs = XLSX.utils.json_to_sheet(summary);
            XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

            // Sales by category
            const categoryData = this.generateCategoryData(salesData);
            const categoryWs = XLSX.utils.json_to_sheet(categoryData);
            XLSX.utils.book_append_sheet(wb, categoryWs, 'Sales by Category');

            // Monthly sales
            const monthlyData = this.generateMonthlyData(salesData);
            const monthlyWs = XLSX.utils.json_to_sheet(monthlyData);
            XLSX.utils.book_append_sheet(wb, monthlyWs, 'Monthly Sales');

            // Top customers
            const topCustomers = this.generateTopCustomersData(salesData, customerData);
            const topCustomersWs = XLSX.utils.json_to_sheet(topCustomers);
            XLSX.utils.book_append_sheet(wb, topCustomersWs, 'Top Customers');

            // Auto-size all worksheets
            wb.SheetNames.forEach(sheetName => {
                this.autoSizeColumns(wb.Sheets[sheetName], []);
            });

            // Generate Excel file and download
            XLSX.writeFile(wb, `dashboard-report-${new Date().toISOString().split('T')[0]}.xlsx`);
            return true;
        } catch (error) {
            console.error('Error exporting dashboard data:', error);
            return false;
        }
    }

    // Import data from Excel
    async importFromExcel(file, type = 'sales') {
        return new Promise((resolve, reject) => {
            try {
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
                        
                        // Process based on type
                        if (type === 'sales') {
                            resolve(this.processSalesImport(jsonData));
                        } else if (type === 'customers') {
                            resolve(this.processCustomerImport(jsonData));
                        } else {
                            resolve(jsonData);
                        }
                    } catch (error) {
                        reject(new Error('Error processing Excel file: ' + error.message));
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('Error reading file'));
                };
                
                reader.readAsArrayBuffer(file);
            } catch (error) {
                reject(new Error('Error importing from Excel: ' + error.message));
            }
        });
    }

    // Process sales import data
    processSalesImport(data) {
        return data.map(row => ({
            customerName: row['Customer Name'] || row['customerName'] || '',
            customerPhone: row['Customer Phone'] || row['customerPhone'] || '',
            customerEmail: row['Customer Email'] || row['customerEmail'] || '',
            customerAddress: row['Customer Address'] || row['customerAddress'] || '',
            category: this.parseCategory(row['Category'] || row['category'] || ''),
            costPrice: parseFloat(row['Cost Price'] || row['costPrice'] || 0),
            sellingPrice: parseFloat(row['Selling Price'] || row['sellingPrice'] || 0),
            shippingCost: parseFloat(row['Shipping Cost'] || row['shippingCost'] || 0),
            profit: parseFloat(row['Profit'] || row['profit'] || 0),
            paymentMode: row['Payment Mode'] || row['paymentMode'] || '',
            saleDate: this.parseDate(row['Date'] || row['saleDate'] || new Date().toISOString()),
            id: this.generateId()
        }));
    }

    // Process customer import data
    processCustomerImport(data) {
        return data.map(row => ({
            name: row['Name'] || row['name'] || '',
            phone: row['Phone'] || row['phone'] || '',
            email: row['Email'] || row['email'] || '',
            address: row['Address'] || row['address'] || '',
            id: this.generateId()
        }));
    }

    // Generate sample Excel template
    generateSalesTemplate() {
        const templateData = [
            {
                'Customer Name': 'John Doe',
                'Customer Phone': '+91-9876543210',
                'Customer Email': 'john@example.com',
                'Customer Address': '123 Main St, City, State',
                'Category': 'Necklaces, Earrings',
                'Cost Price': 1000,
                'Selling Price': 1500,
                'Shipping Cost': 50,
                'Profit': 450,
                'Payment Mode': 'UPI',
                'Date': new Date().toLocaleDateString()
            },
            {
                'Customer Name': 'Jane Smith',
                'Customer Phone': '+91-9876543211',
                'Customer Email': 'jane@example.com',
                'Customer Address': '456 Oak Ave, City, State',
                'Category': 'Set',
                'Cost Price': 2000,
                'Selling Price': 3000,
                'Shipping Cost': 100,
                'Profit': 900,
                'Payment Mode': 'Bank Transfer',
                'Date': new Date().toLocaleDateString()
            }
        ];

        return this.exportToExcel(templateData, 'sales-import-template', 'Sales Template');
    }

    generateCustomerTemplate() {
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

        return this.exportToExcel(templateData, 'customer-import-template', 'Customer Template');
    }

    // Helper methods
    autoSizeColumns(worksheet, data) {
        if (!worksheet['!ref']) return;

        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const cols = [];

        for (let C = range.s.c; C <= range.e.c; ++C) {
            let maxWidth = 10;
            
            for (let R = range.s.r; R <= range.e.r; ++R) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = worksheet[cellAddress];
                
                if (cell && cell.v) {
                    const cellValue = cell.v.toString();
                    maxWidth = Math.max(maxWidth, cellValue.length);
                }
            }
            
            cols[C] = { wch: Math.min(maxWidth + 2, 50) };
        }
        
        worksheet['!cols'] = cols;
    }

    generateSummaryData(salesData, customerData) {
        const totalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.sellingPrice || 0), 0);
        const totalProfit = salesData.reduce((sum, sale) => sum + parseFloat(sale.profit || 0), 0);
        const totalCost = salesData.reduce((sum, sale) => sum + parseFloat(sale.costPrice || 0), 0);

        return [
            { Metric: 'Total Sales', Value: totalSales },
            { Metric: 'Total Profit', Value: totalProfit },
            { Metric: 'Total Cost', Value: totalCost },
            { Metric: 'Total Transactions', Value: salesData.length },
            { Metric: 'Total Customers', Value: customerData.length },
            { Metric: 'Average Transaction', Value: salesData.length > 0 ? totalSales / salesData.length : 0 },
            { Metric: 'Profit Margin', Value: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0 }
        ];
    }

    generateCategoryData(salesData) {
        const categoryStats = {};
        
        salesData.forEach(sale => {
            if (sale.category && Array.isArray(sale.category)) {
                sale.category.forEach(cat => {
                    if (!categoryStats[cat]) {
                        categoryStats[cat] = { count: 0, revenue: 0, profit: 0 };
                    }
                    categoryStats[cat].count++;
                    categoryStats[cat].revenue += parseFloat(sale.sellingPrice || 0) / sale.category.length;
                    categoryStats[cat].profit += parseFloat(sale.profit || 0) / sale.category.length;
                });
            }
        });

        return Object.entries(categoryStats).map(([category, stats]) => ({
            Category: category,
            'Number of Sales': stats.count,
            'Total Revenue': stats.revenue,
            'Total Profit': stats.profit,
            'Average Sale': stats.count > 0 ? stats.revenue / stats.count : 0
        }));
    }

    generateMonthlyData(salesData) {
        const monthlyStats = {};
        
        salesData.forEach(sale => {
            const date = new Date(sale.createdAt || sale.saleDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = { sales: 0, profit: 0, transactions: 0 };
            }
            
            monthlyStats[monthKey].sales += parseFloat(sale.sellingPrice || 0);
            monthlyStats[monthKey].profit += parseFloat(sale.profit || 0);
            monthlyStats[monthKey].transactions++;
        });

        return Object.entries(monthlyStats)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, stats]) => ({
                Month: month,
                'Total Sales': stats.sales,
                'Total Profit': stats.profit,
                'Transactions': stats.transactions,
                'Average Transaction': stats.transactions > 0 ? stats.sales / stats.transactions : 0
            }));
    }

    generateTopCustomersData(salesData, customerData) {
        const customerStats = {};
        
        salesData.forEach(sale => {
            const customerId = sale.customerId || sale.customerName;
            if (customerId) {
                if (!customerStats[customerId]) {
                    customerStats[customerId] = { purchases: 0, spent: 0 };
                }
                customerStats[customerId].purchases++;
                customerStats[customerId].spent += parseFloat(sale.sellingPrice || 0);
            }
        });

        return Object.entries(customerStats)
            .sort(([,a], [,b]) => b.spent - a.spent)
            .slice(0, 20)
            .map(([customerId, stats]) => {
                const customer = customerData.find(c => c.id === customerId || c.name === customerId);
                return {
                    'Customer Name': customer ? customer.name : customerId,
                    'Phone': customer ? customer.phone : '',
                    'Total Purchases': stats.purchases,
                    'Total Spent': stats.spent,
                    'Average Purchase': stats.purchases > 0 ? stats.spent / stats.purchases : 0
                };
            });
    }

    parseCategory(categoryString) {
        if (!categoryString) return [];
        return categoryString.split(',').map(cat => cat.trim()).filter(cat => cat);
    }

    parseDate(dateString) {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Export singleton instance
export const excelHandler = new ExcelHandler();