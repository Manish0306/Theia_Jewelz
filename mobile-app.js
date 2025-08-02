// Mobile App JavaScript for Theia Jewelz
class MobileApp {
    constructor() {
        this.currentScreen = 'recent-sales-screen';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.updateTime();
        
        // Initialize with first screen
        this.showScreen('recent-sales-screen');
        
        console.log('Mobile app initialized');
    }

    setupEventListeners() {
        // Touch event handling for better mobile experience
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // Prevent default touch behaviors that might interfere
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.main-content')) {
                // Allow scrolling in main content
                return;
            }
            e.preventDefault();
        }, { passive: false });

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Handle resize events
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
    }

    handleTouchStart(e) {
        // Add touch feedback
        const target = e.target.closest('.nav-item, .primary-button, .detail-item, .customer-item, .back-button');
        if (target) {
            target.style.transform = 'scale(0.95)';
            target.style.transition = 'transform 0.1s ease';
        }
    }

    handleTouchEnd(e) {
        // Remove touch feedback
        const target = e.target.closest('.nav-item, .primary-button, .detail-item, .customer-item, .back-button');
        if (target) {
            setTimeout(() => {
                target.style.transform = '';
                target.style.transition = '';
            }, 100);
        }
    }

    showScreen(screenId) {
        // Hide current screen
        const currentScreen = document.querySelector('.screen.active');
        if (currentScreen) {
            currentScreen.classList.remove('active');
        }

        // Show new screen with animation
        setTimeout(() => {
            const newScreen = document.getElementById(screenId);
            if (newScreen) {
                newScreen.classList.add('active');
                this.currentScreen = screenId;
                
                // Update navigation states
                this.updateNavigationState(screenId);
                
                // Refresh charts if needed
                if (screenId === 'dashboard-screen' || screenId === 'forecast-screen') {
                    setTimeout(() => this.refreshCharts(), 300);
                }
            }
        }, 150);
    }

    updateNavigationState(screenId) {
        // Remove active state from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active state based on current screen
        const activeNavMap = {
            'recent-sales-screen': 0,
            'dashboard-screen': 1,
            'customers-screen': 2,
            'forecast-screen': 2
        };

        const activeIndex = activeNavMap[screenId];
        if (activeIndex !== undefined) {
            const navItems = document.querySelectorAll('.nav-item');
            if (navItems[activeIndex]) {
                navItems[activeIndex].classList.add('active');
            }
        }
    }

    initializeCharts() {
        this.createSalesChart();
        this.createPieChart();
    }

    createSalesChart() {
        const canvas = document.getElementById('salesChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Sample data for bar chart
        const data = [40, 60, 80, 45, 70, 90, 100, 65];
        const maxValue = Math.max(...data);
        const barWidth = width / data.length;
        const barMaxHeight = height - 40;

        // Draw bars
        data.forEach((value, index) => {
            const barHeight = (value / maxValue) * barMaxHeight;
            const x = index * barWidth + barWidth * 0.2;
            const y = height - barHeight - 20;
            const barActualWidth = barWidth * 0.6;

            // Create gradient for bars
            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, '#2ECC71');
            gradient.addColorStop(1, '#1ABC9C');

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barActualWidth, barHeight);

            // Add rounded corners effect
            ctx.beginPath();
            ctx.arc(x + barActualWidth/2, y, barActualWidth/2, 0, Math.PI, true);
            ctx.fill();
        });
    }

    createPieChart() {
        const canvas = document.getElementById('pieChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Sample data for pie chart
        const data = [
            { label: 'Earrings', value: 30, color: '#8B5A96' },
            { label: 'Necklaces', value: 25, color: '#1ABC9C' },
            { label: 'Rings', value: 25, color: '#4A90E2' },
            { label: 'Bracelets', value: 20, color: '#B19CD9' }
        ];

        let currentAngle = -Math.PI / 2; // Start from top
        const total = data.reduce((sum, item) => sum + item.value, 0);

        data.forEach(item => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;

            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();

            // Add subtle border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();

            currentAngle += sliceAngle;
        });

        // Draw center circle for donut effect
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
    }

    refreshCharts() {
        this.createSalesChart();
        this.createPieChart();
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: false 
        });
        
        document.querySelectorAll('.time').forEach(element => {
            element.textContent = timeString;
        });

        // Update every minute
        setTimeout(() => this.updateTime(), 60000);
    }

    handleOrientationChange() {
        // Refresh charts after orientation change
        setTimeout(() => {
            this.refreshCharts();
        }, 500);
    }

    handleResize() {
        // Refresh charts on resize
        this.refreshCharts();
    }

    // Utility function for debouncing
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

    // Simulate loading states
    showLoading(element) {
        if (element) {
            element.classList.add('loading');
        }
    }

    hideLoading(element) {
        if (element) {
            element.classList.remove('loading');
        }
    }

    // Handle network status
    handleNetworkChange() {
        const isOnline = navigator.onLine;
        const statusIndicator = document.querySelector('.status-icons .fa-wifi');
        
        if (statusIndicator) {
            if (isOnline) {
                statusIndicator.style.opacity = '0.9';
            } else {
                statusIndicator.style.opacity = '0.3';
            }
        }
    }
}

// Global function for screen navigation (called from HTML)
function showScreen(screenId) {
    if (window.mobileApp) {
        window.mobileApp.showScreen(screenId);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileApp = new MobileApp();
    
    // Handle network status changes
    window.addEventListener('online', () => window.mobileApp.handleNetworkChange());
    window.addEventListener('offline', () => window.mobileApp.handleNetworkChange());
    
    // Initial network status
    window.mobileApp.handleNetworkChange();
});

// Handle visibility changes (app going to background/foreground)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.mobileApp) {
        // App came to foreground, refresh data
        window.mobileApp.refreshCharts();
        window.mobileApp.updateTime();
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileApp;
}