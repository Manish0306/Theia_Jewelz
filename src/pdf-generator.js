// PDF generation for receipts and reports
export class PDFGenerator {
    constructor() {
        this.isInitialized = false;
    }

    init() {
        // Ensure jsPDF is loaded
        if (typeof window.jsPDF === 'undefined') {
            console.error('jsPDF library not loaded');
            return false;
        }
        this.isInitialized = true;
        return true;
    }

    generateReceipt(saleData, customerData, appName = 'Theia Jewelz') {
        try {
            console.log('PDF Generator: Starting receipt generation');
            console.log('Sale data:', saleData);
            console.log('Customer data:', customerData);
            
            if (!this.isInitialized && !this.init()) {
                console.error('jsPDF library not available');
                return false;
            }

            const { jsPDF } = window;
            const doc = new jsPDF();

            // Company Header
            this.addCompanyHeader(doc, appName);

            // Receipt Details
            this.addReceiptDetails(doc, saleData, customerData);

            // Product Details
            this.addProductDetails(doc, saleData);

            // Payment Summary
            this.addPaymentSummary(doc, saleData);

            // Footer
            this.addReceiptFooter(doc);

            // Generate and download
            const fileName = `receipt-${saleData.id || Date.now()}.pdf`;
            doc.save(fileName);

            console.log('PDF Generator: Receipt generated successfully');
            return true;
        } catch (error) {
            console.error('Error generating receipt:', error);
            return false;
        }
    }

    addCompanyHeader(doc, appName) {
        const pageWidth = doc.internal.pageSize.width;
        
        // Company name
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(appName, pageWidth / 2, 25, { align: 'center' });

        // Subtitle
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Jewelry Sales Receipt', pageWidth / 2, 35, { align: 'center' });

        // Line separator
        doc.setLineWidth(0.5);
        doc.line(20, 45, pageWidth - 20, 45);
    }

    addReceiptDetails(doc, saleData, customerData) {
        let yPos = 60;

        // Receipt info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('RECEIPT DETAILS', 20, yPos);

        yPos += 10;
        doc.setFont('helvetica', 'normal');
        doc.text(`Receipt ID: ${saleData.id || 'N/A'}`, 20, yPos);
        
        yPos += 8;
        doc.text(`Date: ${new Date(saleData.createdAt || saleData.saleDate).toLocaleDateString()}`, 20, yPos);

        yPos += 8;
        doc.text(`Time: ${new Date(saleData.createdAt || saleData.saleDate).toLocaleTimeString()}`, 20, yPos);

        // Customer info
        yPos += 20;
        doc.setFont('helvetica', 'bold');
        doc.text('CUSTOMER INFORMATION', 20, yPos);

        yPos += 10;
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${customerData.name || saleData.customerName || 'N/A'}`, 20, yPos);

        yPos += 8;
        doc.text(`Phone: ${customerData.phone || saleData.customerPhone || 'N/A'}`, 20, yPos);

        if (customerData.address || saleData.customerAddress) {
            yPos += 8;
            const address = customerData.address || saleData.customerAddress;
            const addressLines = doc.splitTextToSize(address, 160);
            doc.text(`Address: ${addressLines[0]}`, 20, yPos);
            
            for (let i = 1; i < addressLines.length; i++) {
                yPos += 8;
                doc.text(addressLines[i], 45, yPos);
            }
        }

        return yPos + 15;
    }

    addProductDetails(doc, saleData) {
        let yPos = 140;

        doc.setFont('helvetica', 'bold');
        doc.text('PRODUCT DETAILS', 20, yPos);

        yPos += 15;

        // Table headers
        doc.setFontSize(9);
        doc.text('Category', 20, yPos);
        doc.text('Cost Price', 80, yPos);
        doc.text('Selling Price', 120, yPos);
        doc.text('Profit', 160, yPos);

        // Line under headers
        yPos += 5;
        doc.setLineWidth(0.3);
        doc.line(20, yPos, 190, yPos);

        yPos += 10;

        // Product data
        doc.setFont('helvetica', 'normal');
        const categories = Array.isArray(saleData.category) ? saleData.category.join(', ') : (saleData.category || 'N/A');
        const categoryLines = doc.splitTextToSize(categories, 55);
        
        doc.text(categoryLines[0], 20, yPos);
        doc.text(`₹${parseFloat(saleData.costPrice || 0).toFixed(2)}`, 80, yPos);
        doc.text(`₹${parseFloat(saleData.sellingPrice || 0).toFixed(2)}`, 120, yPos);
        doc.text(`₹${parseFloat(saleData.profit || 0).toFixed(2)}`, 160, yPos);

        // Additional category lines if any
        for (let i = 1; i < categoryLines.length; i++) {
            yPos += 8;
            doc.text(categoryLines[i], 20, yPos);
        }

        return yPos + 15;
    }

    addPaymentSummary(doc, saleData) {
        let yPos = 200;
        const pageWidth = doc.internal.pageSize.width;

        // Summary box
        doc.setDrawColor(0);
        doc.setFillColor(245, 245, 245);
        doc.rect(120, yPos - 5, 60, 40, 'F');
        doc.rect(120, yPos - 5, 60, 40, 'S');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT SUMMARY', 150, yPos, { align: 'center' });

        yPos += 12;
        doc.setFont('helvetica', 'normal');
        doc.text(`Subtotal: ₹${parseFloat(saleData.sellingPrice || 0).toFixed(2)}`, 125, yPos);

        yPos += 8;
        doc.text(`Shipping: ₹${parseFloat(saleData.shippingCost || 0).toFixed(2)}`, 125, yPos);

        yPos += 8;
        doc.setFont('helvetica', 'bold');
        const total = parseFloat(saleData.sellingPrice || 0) + parseFloat(saleData.shippingCost || 0);
        doc.text(`Total: ₹${total.toFixed(2)}`, 125, yPos);

        yPos += 12;
        doc.setFont('helvetica', 'normal');
        doc.text(`Payment Mode: ${saleData.paymentMode || 'N/A'}`, 125, yPos);

        return yPos + 20;
    }

    addReceiptFooter(doc) {
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        
        let yPos = pageHeight - 40;

        // Thank you message
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });

        yPos += 15;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('This is a computer-generated receipt.', pageWidth / 2, yPos, { align: 'center' });

        yPos += 8;
        doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
    }

    generateSalesReport(salesData, filters = {}, appName = 'Theia Jewelz') {
        try {
            const { jsPDF } = window;
            const doc = new jsPDF();

            // Report Header
            this.addReportHeader(doc, 'Sales Report', appName, filters);

            // Summary Statistics
            let yPos = this.addReportSummary(doc, salesData);

            // Sales Table
            yPos = this.addSalesTable(doc, salesData, yPos);

            // Footer
            this.addReportFooter(doc);

            // Generate and download
            const fileName = `sales-report-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            return true;
        } catch (error) {
            console.error('Error generating sales report:', error);
            return false;
        }
    }

    addReportHeader(doc, reportTitle, appName, filters) {
        const pageWidth = doc.internal.pageSize.width;
        
        // Company name
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(appName, pageWidth / 2, 20, { align: 'center' });

        // Report title
        doc.setFontSize(16);
        doc.text(reportTitle, pageWidth / 2, 35, { align: 'center' });

        // Date range if provided
        if (filters.startDate || filters.endDate) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            let dateRange = 'Period: ';
            if (filters.startDate) dateRange += `From ${new Date(filters.startDate).toLocaleDateString()}`;
            if (filters.endDate) dateRange += ` To ${new Date(filters.endDate).toLocaleDateString()}`;
            doc.text(dateRange, pageWidth / 2, 45, { align: 'center' });
        }

        // Line separator
        doc.setLineWidth(0.5);
        doc.line(20, 55, pageWidth - 20, 55);
    }

    addReportSummary(doc, salesData) {
        let yPos = 70;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('SUMMARY', 20, yPos);

        yPos += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const totalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.sellingPrice || 0), 0);
        const totalProfit = salesData.reduce((sum, sale) => sum + parseFloat(sale.profit || 0), 0);
        const totalTransactions = salesData.length;

        doc.text(`Total Transactions: ${totalTransactions}`, 20, yPos);
        yPos += 8;
        doc.text(`Total Sales Amount: ₹${totalSales.toFixed(2)}`, 20, yPos);
        yPos += 8;
        doc.text(`Total Profit: ₹${totalProfit.toFixed(2)}`, 20, yPos);
        yPos += 8;
        doc.text(`Average Transaction: ₹${totalTransactions > 0 ? (totalSales / totalTransactions).toFixed(2) : '0.00'}`, 20, yPos);

        return yPos + 20;
    }

    addSalesTable(doc, salesData, startY) {
        let yPos = startY;
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('DETAILED TRANSACTIONS', 20, yPos);

        yPos += 15;

        // Table headers
        doc.setFontSize(8);
        doc.text('Date', 20, yPos);
        doc.text('Customer', 45, yPos);
        doc.text('Category', 85, yPos);
        doc.text('Cost', 115, yPos);
        doc.text('Sale', 135, yPos);
        doc.text('Profit', 155, yPos);
        doc.text('Payment', 175, yPos);

        // Line under headers
        yPos += 5;
        doc.setLineWidth(0.3);
        doc.line(20, yPos, pageWidth - 20, yPos);

        yPos += 8;

        // Table data
        doc.setFont('helvetica', 'normal');
        
        salesData.slice(0, 30).forEach((sale, index) => { // Limit to first 30 records
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 30;
            }

            const date = new Date(sale.createdAt || sale.saleDate).toLocaleDateString();
            const customer = (sale.customerName || 'N/A').substring(0, 15);
            const category = Array.isArray(sale.category) 
                ? sale.category.join(', ').substring(0, 12)
                : (sale.category || 'N/A').substring(0, 12);
            const cost = `₹${parseFloat(sale.costPrice || 0).toFixed(0)}`;
            const selling = `₹${parseFloat(sale.sellingPrice || 0).toFixed(0)}`;
            const profit = `₹${parseFloat(sale.profit || 0).toFixed(0)}`;
            const payment = (sale.paymentMode || 'N/A').substring(0, 8);

            doc.text(date, 20, yPos);
            doc.text(customer, 45, yPos);
            doc.text(category, 85, yPos);
            doc.text(cost, 115, yPos);
            doc.text(selling, 135, yPos);
            doc.text(profit, 155, yPos);
            doc.text(payment, 175, yPos);

            yPos += 8;
        });

        if (salesData.length > 30) {
            yPos += 10;
            doc.setFont('helvetica', 'italic');
            doc.text(`... and ${salesData.length - 30} more transactions`, 20, yPos);
        }

        return yPos;
    }

    addReportFooter(doc) {
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        
        let yPos = pageHeight - 20;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
    }

    generateAnalyticsReport(salesData, customersData, appName = 'Theia Jewelz') {
        try {
            console.log('PDF Generator: Starting analytics report generation');
            
            if (!this.isInitialized && !this.init()) {
                console.error('jsPDF library not available');
                return false;
            }

            const { jsPDF } = window;
            const doc = new jsPDF();

            // Report Header
            this.addReportHeader(doc, 'Analytics Report', appName, {});

            // Summary Statistics
            let yPos = this.addAnalyticsSummary(doc, salesData, customersData);

            // Category Analysis
            yPos = this.addCategoryAnalysis(doc, salesData, yPos);

            // Customer Analysis
            if (yPos > 200) {
                doc.addPage();
                yPos = 30;
            }
            yPos = this.addCustomerAnalysis(doc, customersData, salesData, yPos);

            // Monthly Trends
            if (yPos > 200) {
                doc.addPage();
                yPos = 30;
            }
            yPos = this.addMonthlyTrends(doc, salesData, yPos);

            // Footer
            this.addReportFooter(doc);

            // Generate and download
            const fileName = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            console.log('PDF Generator: Analytics report generated successfully');
            return true;
        } catch (error) {
            console.error('Error generating analytics report:', error);
            return false;
        }
    }

    addAnalyticsSummary(doc, salesData, customersData) {
        let yPos = 70;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('BUSINESS OVERVIEW', 20, yPos);

        yPos += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const totalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.sellingPrice || 0), 0);
        const totalProfit = salesData.reduce((sum, sale) => sum + parseFloat(sale.profit || 0), 0);
        const totalCost = salesData.reduce((sum, sale) => sum + parseFloat(sale.costPrice || 0), 0);
        const avgTransaction = salesData.length > 0 ? totalSales / salesData.length : 0;
        const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

        doc.text(`Total Revenue: ₹${totalSales.toFixed(2)}`, 20, yPos);
        yPos += 8;
        doc.text(`Total Profit: ₹${totalProfit.toFixed(2)}`, 20, yPos);
        yPos += 8;
        doc.text(`Total Cost: ₹${totalCost.toFixed(2)}`, 20, yPos);
        yPos += 8;
        doc.text(`Total Transactions: ${salesData.length}`, 20, yPos);
        yPos += 8;
        doc.text(`Total Customers: ${customersData.length}`, 20, yPos);
        yPos += 8;
        doc.text(`Average Transaction: ₹${avgTransaction.toFixed(2)}`, 20, yPos);
        yPos += 8;
        doc.text(`Profit Margin: ${profitMargin.toFixed(1)}%`, 20, yPos);

        return yPos + 20;
    }

    addCategoryAnalysis(doc, salesData, startY) {
        let yPos = startY;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('CATEGORY PERFORMANCE', 20, yPos);

        yPos += 15;

        // Calculate category statistics
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

        // Table headers
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Category', 20, yPos);
        doc.text('Sales', 80, yPos);
        doc.text('Revenue', 120, yPos);
        doc.text('Profit', 160, yPos);

        yPos += 5;
        doc.setLineWidth(0.3);
        doc.line(20, yPos, 190, yPos);

        yPos += 8;
        doc.setFont('helvetica', 'normal');

        Object.entries(categoryStats)
            .sort(([,a], [,b]) => b.revenue - a.revenue)
            .slice(0, 10)
            .forEach(([category, stats]) => {
                doc.text(category.substring(0, 15), 20, yPos);
                doc.text(stats.count.toString(), 80, yPos);
                doc.text(`₹${stats.revenue.toFixed(0)}`, 120, yPos);
                doc.text(`₹${stats.profit.toFixed(0)}`, 160, yPos);
                yPos += 8;
            });

        return yPos + 15;
    }

    addMonthlyTrends(doc, salesData, startY) {
        let yPos = startY;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('MONTHLY TRENDS', 20, yPos);

        yPos += 15;

        // Calculate monthly data
        const monthlyData = {};
        salesData.forEach(sale => {
            const date = new Date(sale.createdAt || sale.saleDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { sales: 0, profit: 0, transactions: 0 };
            }
            
            monthlyData[monthKey].sales += parseFloat(sale.sellingPrice || 0);
            monthlyData[monthKey].profit += parseFloat(sale.profit || 0);
            monthlyData[monthKey].transactions++;
        });

        // Table headers
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Month', 20, yPos);
        doc.text('Transactions', 80, yPos);
        doc.text('Revenue', 130, yPos);
        doc.text('Profit', 170, yPos);

        yPos += 5;
        doc.setLineWidth(0.3);
        doc.line(20, yPos, 190, yPos);

        yPos += 8;
        doc.setFont('helvetica', 'normal');

        Object.entries(monthlyData)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 12)
            .forEach(([month, data]) => {
                const [year, monthNum] = month.split('-');
                const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                
                doc.text(monthName, 20, yPos);
                doc.text(data.transactions.toString(), 80, yPos);
                doc.text(`₹${data.sales.toFixed(0)}`, 130, yPos);
                doc.text(`₹${data.profit.toFixed(0)}`, 170, yPos);
                yPos += 8;
            });

        return yPos + 15;
    }

    generateCustomerReport(customerData, salesData, appName = 'Theia Jewelz') {
        try {
            if (!this.isInitialized && !this.init()) {
                console.error('jsPDF library not available');
                return false;
            }

            const { jsPDF } = window;
            const doc = new jsPDF();

            // Report Header
            this.addReportHeader(doc, 'Customer Report', appName, {});

            // Customer summary
            let yPos = this.addCustomerSummary(doc, customerData, salesData);

            // Customer table
            yPos = this.addCustomerTable(doc, customerData, salesData, yPos);

            // Footer
            this.addReportFooter(doc);

            // Generate and download
            const fileName = `customer-report-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            return true;
        } catch (error) {
            console.error('Error generating customer report:', error);
            return false;
        }
    }

    addCustomerSummary(doc, customerData, salesData) {
        let yPos = 70;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('CUSTOMER SUMMARY', 20, yPos);

        yPos += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const totalCustomers = customerData.length;
        const activeCustomers = new Set(salesData.map(sale => sale.customerId || sale.customerName)).size;

        doc.text(`Total Customers: ${totalCustomers}`, 20, yPos);
        yPos += 8;
        doc.text(`Active Customers: ${activeCustomers}`, 20, yPos);
        yPos += 8;
        doc.text(`Customer Retention: ${totalCustomers > 0 ? ((activeCustomers / totalCustomers) * 100).toFixed(1) : 0}%`, 20, yPos);

        return yPos + 20;
    }

    addCustomerTable(doc, customerData, salesData, startY) {
        let yPos = startY;
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('CUSTOMER DETAILS', 20, yPos);

        yPos += 15;

        // Table headers
        doc.setFontSize(8);
        doc.text('Name', 20, yPos);
        doc.text('Phone', 65, yPos);
        doc.text('Email', 105, yPos);
        doc.text('Purchases', 145, yPos);
        doc.text('Total Spent', 170, yPos);

        // Line under headers
        yPos += 5;
        doc.setLineWidth(0.3);
        doc.line(20, yPos, pageWidth - 20, yPos);

        yPos += 8;

        // Calculate customer purchase data
        const customerPurchases = {};
        salesData.forEach(sale => {
            const customerId = sale.customerId || sale.customerName;
            if (customerId) {
                if (!customerPurchases[customerId]) {
                    customerPurchases[customerId] = { count: 0, total: 0 };
                }
                customerPurchases[customerId].count++;
                customerPurchases[customerId].total += parseFloat(sale.sellingPrice || 0);
            }
        });

        // Table data
        doc.setFont('helvetica', 'normal');
        
        customerData.slice(0, 25).forEach((customer, index) => { // Limit to first 25 records
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 30;
            }

            const name = (customer.name || 'N/A').substring(0, 20);
            const phone = (customer.phone || 'N/A').substring(0, 15);
            const email = (customer.email || 'N/A').substring(0, 15);
            const purchases = customerPurchases[customer.id] || customerPurchases[customer.name] || { count: 0, total: 0 };

            doc.text(name, 20, yPos);
            doc.text(phone, 65, yPos);
            doc.text(email, 105, yPos);
            doc.text(purchases.count.toString(), 145, yPos);
            doc.text(`₹${purchases.total.toFixed(0)}`, 170, yPos);

            yPos += 8;
        });

        if (customerData.length > 25) {
            yPos += 10;
            doc.setFont('helvetica', 'italic');
            doc.text(`... and ${customerData.length - 25} more customers`, 20, yPos);
        }

        return yPos;
    }

    addCustomerAnalysis(doc, customersData, salesData, startY) {
        let yPos = startY;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('TOP CUSTOMERS', 20, yPos);

        yPos += 15;

        // Calculate customer purchase data
        const customerPurchases = {};
        salesData.forEach(sale => {
            const customerId = sale.customerId || sale.customerName;
            if (customerId) {
                if (!customerPurchases[customerId]) {
                    customerPurchases[customerId] = { count: 0, total: 0, name: sale.customerName || customerId };
                }
                customerPurchases[customerId].count++;
                customerPurchases[customerId].total += parseFloat(sale.sellingPrice || 0);
            }
        });

        // Table headers
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Customer', 20, yPos);
        doc.text('Purchases', 100, yPos);
        doc.text('Total Spent', 150, yPos);

        yPos += 5;
        doc.setLineWidth(0.3);
        doc.line(20, yPos, 190, yPos);

        yPos += 8;
        doc.setFont('helvetica', 'normal');

        Object.entries(customerPurchases)
            .sort(([,a], [,b]) => b.total - a.total)
            .slice(0, 10)
            .forEach(([customerId, data]) => {
                doc.text(data.name.substring(0, 25), 20, yPos);
                doc.text(data.count.toString(), 100, yPos);
                doc.text(`₹${data.total.toFixed(0)}`, 150, yPos);
                yPos += 8;
            });

        return yPos + 15;
    }
}

// Export singleton instance
export const pdfGenerator = new PDFGenerator();