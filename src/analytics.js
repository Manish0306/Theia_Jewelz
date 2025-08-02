// Analytics and chart management
import { database } from './database.js';
import { ui } from './ui-components.js';

export class Analytics {
    constructor() {
        this.charts = {};
        this.isInitialized = false;
        this.initialize();
    }

    async initialize() {
        // Wait for Chart.js to be available
        if (typeof Chart === 'undefined') {
            console.log('Waiting for Chart.js to load...');
            setTimeout(() => this.initialize(), 100);
            return;
        }
        
        console.log('Chart.js loaded, initializing analytics...');
        this.isInitialized = true;
        
        // Initialize charts when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeCharts());
        } else {
            setTimeout(() => this.initializeCharts(), 200);
        }
    }

    initializeCharts() {
        // Dashboard charts
        this.initializeDashboardCharts();
        
        // Analytics charts
        this.initializeAnalyticsCharts();
    }

    async initializeDashboardCharts() {
        if (!this.isInitialized) {
            console.log('Analytics not initialized yet, retrying...');
            setTimeout(() => this.initializeDashboardCharts(), 500);
            return;
        }
        
        const salesData = await database.getSales();
        const customersData = await database.getCustomers();

        console.log('Dashboard data loaded:', { salesCount: salesData.length, customerCount: customersData.length });

        // Update KPIs
        this.updateKPIs(salesData, customersData);

        // Sales trend chart
        this.createSalesTrendChart(salesData);
        
        // Category distribution chart
        this.createCategoryChart(salesData);
        
        // Payment methods chart
        this.createPaymentChart(salesData);
        
        // Profit margins chart
        this.createProfitChart(salesData);
    }

    async initializeAnalyticsCharts() {
        if (!this.isInitialized) {
            console.log('Analytics not initialized yet, retrying...');
            setTimeout(() => this.initializeAnalyticsCharts(), 500);
            return;
        }
        
        const salesData = await database.getSales();
        const customersData = await database.getCustomers();

        console.log('Analytics data loaded:', { salesCount: salesData.length, customerCount: customersData.length });

        // Monthly revenue chart
        this.createMonthlyRevenueChart(salesData);
        
        // Purchase patterns chart
        this.createPurchasePatternsChart(salesData);
        
        // Top customers list
        this.createTopCustomersList(salesData, customersData);
    }

    updateKPIs(salesData, customersData) {
        const totalSales = salesData.reduce((sum, sale) => sum + (parseFloat(sale.sellingPrice) || 0), 0);
        const totalProfit = salesData.reduce((sum, sale) => sum + (parseFloat(sale.profit) || 0), 0);
        const totalTransactions = salesData.length;
        const totalCustomers = customersData.length;

        // Update KPI displays
        const totalSalesEl = document.getElementById('total-sales');
        const totalProfitEl = document.getElementById('total-profit');
        const totalTransactionsEl = document.getElementById('total-transactions');
        const totalCustomersEl = document.getElementById('total-customers');

        if (totalSalesEl) totalSalesEl.textContent = ui.formatCurrency(totalSales);
        if (totalProfitEl) totalProfitEl.textContent = ui.formatCurrency(totalProfit);
        if (totalTransactionsEl) totalTransactionsEl.textContent = totalTransactions.toLocaleString();
        if (totalCustomersEl) totalCustomersEl.textContent = totalCustomers.toLocaleString();
    }

    createSalesTrendChart(salesData) {
        const ctx = document.getElementById('sales-trend-chart');
        if (!ctx) {
            console.log('Sales trend chart canvas not found');
            return;
        }

        // Group sales by date
        const salesByDate = {};
        salesData.forEach(sale => {
            const saleDate = sale.createdAt || sale.saleDate || new Date().toISOString();
            const date = new Date(saleDate).toDateString();
            salesByDate[date] = (salesByDate[date] || 0) + parseFloat(sale.sellingPrice || 0);
        });

        // Get last 30 days
        const last30Days = this.getLast30Days();
        const chartData = last30Days.map(date => ({
            date: date.toDateString(),
            sales: salesByDate[date.toDateString()] || 0
        }));

        if (this.charts.salesTrend) {
            this.charts.salesTrend.destroy();
        }

        console.log('Creating sales trend chart with data:', chartData.length, 'points');

        this.charts.salesTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.date.split(' ').slice(1, 3).join(' ')),
                datasets: [{
                    label: 'Sales Amount',
                    data: chartData.map(d => d.sales),
                    borderColor: '#D4AF37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => ui.formatCurrency(value)
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => `Sales: ${ui.formatCurrency(context.parsed.y)}`
                        }
                    }
                }
            }
        });
    }

    createCategoryChart(salesData) {
        const ctx = document.getElementById('category-chart');
        if (!ctx) {
            console.log('Category chart canvas not found');
            return;
        }

        // Count sales by category
        const categoryCount = {};
        salesData.forEach(sale => {
            if (sale.category && Array.isArray(sale.category)) {
                sale.category.forEach(cat => {
                    if (cat && cat.trim()) {
                        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
                    }
                });
            } else if (sale.category && typeof sale.category === 'string') {
                categoryCount[sale.category] = (categoryCount[sale.category] || 0) + 1;
            }
        });

        const labels = Object.keys(categoryCount);
        const data = Object.values(categoryCount);
        const colors = this.generateColors(labels.length);

        if (this.charts.category) {
            this.charts.category.destroy();
        }

        console.log('Creating category chart with data:', labels);

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
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

    createPaymentChart(salesData) {
        const ctx = document.getElementById('payment-chart');
        if (!ctx) {
            console.log('Payment chart canvas not found');
            return;
        }

        // Count sales by payment method
        const paymentCount = {};
        salesData.forEach(sale => {
            const method = sale.paymentMode || 'Not Specified';
            paymentCount[method] = (paymentCount[method] || 0) + 1;
        });

        const labels = Object.keys(paymentCount);
        const data = Object.values(paymentCount);
        const colors = ['#D4AF37', '#8B4513', '#FFD700', '#B8941F'];

        if (this.charts.payment) {
            this.charts.payment.destroy();
        }

        console.log('Creating payment chart with data:', labels);

        this.charts.payment = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
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

    createProfitChart(salesData) {
        const ctx = document.getElementById('profit-chart');
        if (!ctx) {
            console.log('Profit chart canvas not found');
            return;
        }

        // Group profit by date
        const profitByDate = {};
        salesData.forEach(sale => {
            const saleDate = sale.createdAt || sale.saleDate || new Date().toISOString();
            const date = new Date(saleDate).toDateString();
            profitByDate[date] = (profitByDate[date] || 0) + parseFloat(sale.profit || 0);
        });

        // Get last 30 days
        const last30Days = this.getLast30Days();
        const chartData = last30Days.map(date => ({
            date: date.toDateString(),
            profit: profitByDate[date.toDateString()] || 0
        }));

        if (this.charts.profit) {
            this.charts.profit.destroy();
        }

        console.log('Creating profit chart with data:', chartData.length, 'points');

        this.charts.profit = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.map(d => d.date.split(' ').slice(1, 3).join(' ')),
                datasets: [{
                    label: 'Profit',
                    data: chartData.map(d => d.profit),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10B981',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => ui.formatCurrency(value)
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => `Profit: ${ui.formatCurrency(context.parsed.y)}`
                        }
                    }
                }
            }
        });
    }

    createMonthlyRevenueChart(salesData) {
        const ctx = document.getElementById('monthly-revenue-chart');
        if (!ctx) {
            console.log('Monthly revenue chart canvas not found');
            return;
        }

        // Group revenue by month
        const monthlyRevenue = {};
        salesData.forEach(sale => {
            const saleDate = sale.createdAt || sale.saleDate || new Date().toISOString();
            const date = new Date(saleDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + parseFloat(sale.sellingPrice || 0);
        });

        // Get last 6 months for better display
        const last6Months = this.getLast6Months();
        const chartData = last6Months.map(month => ({
            month: month,
            revenue: monthlyRevenue[month] || 0
        }));

        if (this.charts.monthlyRevenue) {
            this.charts.monthlyRevenue.destroy();
        }

        console.log('Creating monthly revenue chart with data:', chartData.length, 'months', chartData);

        this.charts.monthlyRevenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => {
                    const [year, month] = d.month.split('-');
                    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                }),
                datasets: [{
                    label: 'Monthly Revenue',
                    data: chartData.map(d => d.revenue),
                    borderColor: '#D4AF37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#D4AF37',
                    pointBorderColor: '#B8941F',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: (value) => ui.formatCurrency(value)
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Revenue: ${ui.formatCurrency(context.parsed.y)}`
                        }
                    }
                }
            }
        });
    }

    createPurchasePatternsChart(salesData) {
        const ctx = document.getElementById('purchase-patterns-chart');
        if (!ctx) {
            console.log('Purchase patterns chart canvas not found');
            return;
        }

        // Group sales by day of week for better patterns
        const weeklyPatterns = {};
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        for (let i = 0; i < 7; i++) {
            weeklyPatterns[i] = 0;
        }

        salesData.forEach(sale => {
            const saleDate = sale.createdAt || sale.saleDate || new Date().toISOString();
            const date = new Date(saleDate);
            const dayOfWeek = date.getDay();
            weeklyPatterns[dayOfWeek]++;
        });

        const labels = dayNames;
        const data = Object.values(weeklyPatterns);

        if (this.charts.purchasePatterns) {
            this.charts.purchasePatterns.destroy();
        }

        console.log('Creating purchase patterns chart with weekly data', data);

        this.charts.purchasePatterns = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Sales',
                    data: data,
                    backgroundColor: 'rgba(139, 69, 19, 0.8)',
                    borderColor: '#8B4513',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }

    async createTopCustomersList(salesData, customersData) {
        const container = document.getElementById('top-customers-list');
        if (!container) return;

        // Calculate customer purchase totals
        const customerTotals = {};
        salesData.forEach(sale => {
            const customerId = sale.customerId || sale.customerName;
            if (customerId) {
                customerTotals[customerId] = (customerTotals[customerId] || 0) + parseFloat(sale.sellingPrice || 0);
            }
        });

        // Sort and get top 10
        const sortedCustomers = Object.entries(customerTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        container.innerHTML = '';

        if (sortedCustomers.length === 0) {
            container.innerHTML = '<p class="text-center" style="color: var(--text-light);">No customer data available</p>';
            return;
        }

        sortedCustomers.forEach(([customerId, total]) => {
            const customer = customersData.find(c => c.id === customerId || c.name === customerId);
            const customerName = customer ? customer.name : customerId;

            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            listItem.innerHTML = `
                <span class="list-item-name">${customerName}</span>
                <span class="list-item-value">${ui.formatCurrency(total)}</span>
            `;
            container.appendChild(listItem);
        });
    }

    // Utility methods
    getLast30Days() {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date);
        }
        return days;
    }

    getLast6Months() {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.push(monthKey);
        }
        return months;
    }

    getLast12Months() {
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.push(monthKey);
        }
        return months;
    }
    generateColors(count) {
        const baseColors = [
            'rgba(212, 175, 55, 0.8)',   // Gold
            'rgba(139, 69, 19, 0.8)',    // Brown
            'rgba(255, 215, 0, 0.8)',    // Yellow
            'rgba(184, 148, 31, 0.8)',   // Dark Gold
            'rgba(218, 165, 32, 0.8)',   // Goldenrod
            'rgba(255, 140, 0, 0.8)',    // Dark Orange
            'rgba(205, 133, 63, 0.8)',   // Peru
            'rgba(160, 82, 45, 0.8)',    // Saddle Brown
        ];

        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    }

    async refreshDashboard() {
        if (typeof ui !== 'undefined' && ui.showLoading) {
            ui.showLoading('Refreshing dashboard...');
        }
        try {
            console.log('Refreshing dashboard charts...');
            await this.initializeDashboardCharts();
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            if (typeof ui !== 'undefined' && ui.showToast) {
                ui.showToast('Error refreshing dashboard', 'error');
            }
        } finally {
            if (typeof ui !== 'undefined' && ui.hideLoading) {
                ui.hideLoading();
            }
        }
    }

    async refreshAnalytics() {
        if (typeof ui !== 'undefined' && ui.showLoading) {
            ui.showLoading('Refreshing analytics...');
        }
        try {
            console.log('Refreshing analytics charts...');
            await this.initializeAnalyticsCharts();
        } catch (error) {
            console.error('Error refreshing analytics:', error);
            if (typeof ui !== 'undefined' && ui.showToast) {
                ui.showToast('Error refreshing analytics', 'error');
            }
        } finally {
            if (typeof ui !== 'undefined' && ui.hideLoading) {
                ui.hideLoading();
            }
        }
    }

    async exportAnalyticsData() {
        try {
            const salesData = await database.getSales();
            const customersData = await database.getCustomers();

            // Show export options modal
            ui.showModal(
                'Export Analytics Report',
                `
                    <p>Choose what to include in your PDF report:</p>
                    <div style="margin: 1rem 0;">
                        <label style="display: block; margin-bottom: 0.5rem;">
                            <input type="checkbox" id="include-customer-data" checked> Customer Data
                        </label>
                        <label style="display: block; margin-bottom: 0.5rem;">
                            <input type="checkbox" id="include-performance" checked> Performance Metrics
                        </label>
                        <label style="display: block; margin-bottom: 0.5rem;">
                            <input type="checkbox" id="include-sales-analysis" checked> Sales Analysis
                        </label>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button id="export-pdf-report" class="btn btn-primary">
                            <i class="fas fa-file-pdf"></i> Export PDF
                        </button>
                    </div>
                `,
                { hideFooter: true }
            );

            // Add event listener for PDF export
            setTimeout(() => {
                document.getElementById('export-pdf-report')?.addEventListener('click', () => {
                    const includeCustomers = document.getElementById('include-customer-data').checked;
                    const includePerformance = document.getElementById('include-performance').checked;
                    const includeSales = document.getElementById('include-sales-analysis').checked;
                    
                    this.generateAnalyticsPDF(salesData, customersData, {
                        includeCustomers,
                        includePerformance,
                        includeSales
                    });
                    
                    ui.hideModal();
                });
            }, 100);
        } catch (error) {
            console.error('Error exporting analytics data:', error);
            ui.showToast('Error exporting analytics data', 'error');
        }
    }

    generateAnalyticsPDF(salesData, customersData, options) {
        try {
            if (typeof window.jsPDF === 'undefined') {
                ui.showToast('PDF library not available', 'error');
                return;
            }

            const { jsPDF } = window;
            const doc = new jsPDF();
            let yPos = 20;

            // Header
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('Analytics Report', 105, yPos, { align: 'center' });
            
            yPos += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' });
            
            yPos += 20;

            if (options.includePerformance) {
                yPos = this.addPerformanceMetrics(doc, salesData, customersData, yPos);
            }

            if (options.includeSales) {
                yPos = this.addSalesAnalysis(doc, salesData, yPos);
            }

            if (options.includeCustomers) {
                yPos = this.addCustomerAnalysis(doc, customersData, salesData, yPos);
            }

            doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
            ui.showToast('Analytics PDF exported successfully', 'success');
        } catch (error) {
            console.error('Error generating analytics PDF:', error);
            ui.showToast('Error generating PDF report', 'error');
        }
    }

    addPerformanceMetrics(doc, salesData, customersData, startY) {
        let yPos = startY;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Performance Metrics', 20, yPos);
        yPos += 15;

        const totalSales = salesData.reduce((sum, sale) => sum + (parseFloat(sale.sellingPrice) || 0), 0);
        const totalProfit = salesData.reduce((sum, sale) => sum + (parseFloat(sale.profit) || 0), 0);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Sales: ₹${totalSales.toFixed(2)}`, 20, yPos);
        yPos += 8;
        doc.text(`Total Profit: ₹${totalProfit.toFixed(2)}`, 20, yPos);
        yPos += 8;
        doc.text(`Total Transactions: ${salesData.length}`, 20, yPos);
        yPos += 8;
        doc.text(`Total Customers: ${customersData.length}`, 20, yPos);
        yPos += 8;
        doc.text(`Average Transaction: ₹${salesData.length > 0 ? (totalSales / salesData.length).toFixed(2) : '0.00'}`, 20, yPos);
        
        return yPos + 20;
    }

    addSalesAnalysis(doc, salesData, startY) {
        let yPos = startY;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Sales Analysis', 20, yPos);
        yPos += 15;

        // Category breakdown
        const categoryStats = {};
        salesData.forEach(sale => {
            if (sale.category && Array.isArray(sale.category)) {
                sale.category.forEach(cat => {
                    if (!categoryStats[cat]) {
                        categoryStats[cat] = { count: 0, revenue: 0 };
                    }
                    categoryStats[cat].count++;
                    categoryStats[cat].revenue += parseFloat(sale.sellingPrice || 0) / sale.category.length;
                });
            }
        });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Category Performance:', 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        Object.entries(categoryStats).forEach(([category, stats]) => {
            doc.text(`${category}: ${stats.count} sales, ₹${stats.revenue.toFixed(2)} revenue`, 25, yPos);
            yPos += 8;
        });

        return yPos + 20;
    }

    addCustomerAnalysis(doc, customersData, salesData, startY) {
        let yPos = startY;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Customer Analysis', 20, yPos);
        yPos += 15;

        // Top customers
        const customerTotals = {};
        salesData.forEach(sale => {
            const customerId = sale.customerId || sale.customerName;
            if (customerId) {
                customerTotals[customerId] = (customerTotals[customerId] || 0) + parseFloat(sale.sellingPrice || 0);
            }
        });

        const topCustomers = Object.entries(customerTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Top 10 Customers:', 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        topCustomers.forEach(([customerId, total], index) => {
            const customer = customersData.find(c => c.id === customerId || c.name === customerId);
            const customerName = customer ? customer.name : customerId;
            doc.text(`${index + 1}. ${customerName}: ₹${total.toFixed(2)}`, 25, yPos);
            yPos += 8;
        });

        return yPos + 20;
    }

    destroy() {
        // Clean up all charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Export singleton instance
export const analytics = new Analytics();

// Make it globally available for debugging
window.analytics = analytics;