// Admin Income Dashboard for BINK platform

// DOM Elements
const dateRangeSelect = document.getElementById('date-range');
const customDateRange = document.getElementById('custom-date-range');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const incomeTypeSelect = document.getElementById('income-type');
const applyFiltersButton = document.getElementById('apply-filters');
const resetFiltersButton = document.getElementById('reset-filters');
const totalIncomeElement = document.getElementById('total-income');
const subscriptionIncomeElement = document.getElementById('subscription-income');
const tokenIncomeElement = document.getElementById('token-income');
const totalTransactionsElement = document.getElementById('total-transactions');
const incomeTableBody = document.getElementById('income-table-body');
const incomePagination = document.getElementById('income-pagination');
const exportCsvButton = document.getElementById('export-csv');
const logoutButton = document.getElementById('logout-button');
const logoutLink = document.getElementById('logoutLink');
const userNameElement = document.getElementById('userName');
const userEmailElement = document.getElementById('userEmail');
const userAvatarElement = document.getElementById('userAvatar');

// Chart elements
const incomeChartCanvas = document.getElementById('income-chart');
const incomeTypeChartCanvas = document.getElementById('income-type-chart');

// Global variables
let currentUser = null;
let isAdmin = false;
let incomeData = [];
let filteredIncomeData = [];
let incomeChartInstance = null;
let incomeTypeChartInstance = null;
let currentPage = 1;
let itemsPerPage = 10;
let startDate = null;
let endDate = null;
let incomeType = 'all';

// Chart colors
const chartColors = {
    blue: 'rgba(59, 130, 246, 0.7)',
    blueLight: 'rgba(59, 130, 246, 0.2)',
    pink: 'rgba(236, 72, 153, 0.7)',
    pinkLight: 'rgba(236, 72, 153, 0.2)',
    green: 'rgba(16, 185, 129, 0.7)',
    greenLight: 'rgba(16, 185, 129, 0.2)',
    purple: 'rgba(139, 92, 246, 0.7)',
    purpleLight: 'rgba(139, 92, 246, 0.2)'
};

// Initialize Firebase
function initFirebase() {
    // Firebase should be initialized in firebase-config.js
    if (firebase) {
        // Check authentication
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                checkAdminStatus(user.uid);
            } else {
                // Redirect to login if not authenticated
                window.location.href = 'login.html';
            }
        });
    } else {
        console.error("Firebase not initialized");
        alert("Error: Firebase not initialized. Please refresh the page.");
    }
}

// Check if user is admin
function checkAdminStatus(userId) {
    firebase.firestore().collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                isAdmin = userData.isAdmin || false;
                
                if (isAdmin) {
                    // Update user info in sidebar
                    updateUserInfo(userData);
                    
                    // Load income data
                    initIncomeDashboard();
                } else {
                    // Redirect to dashboard if not admin
                    alert("You don't have permission to access this page.");
                    window.location.href = 'dashboard.html';
                }
            } else {
                // Redirect to login if user not found
                alert("User not found. Please log in again.");
                window.location.href = 'login.html';
            }
        })
        .catch((error) => {
            console.error("Error checking admin status:", error);
            alert("Error checking admin status. Please try again.");
        });
}

// Update user info in sidebar
function updateUserInfo(userData) {
    if (userNameElement) {
        userNameElement.textContent = userData.username || userData.email.split('@')[0];
    }
    
    if (userEmailElement && currentUser) {
        userEmailElement.textContent = currentUser.email;
    }
    
    if (userAvatarElement && userData.profilePicUrl) {
        userAvatarElement.innerHTML = `<img src="${userData.profilePicUrl}" alt="Profile">`;
    }
}

// Initialize income dashboard
function initIncomeDashboard() {
    // Set default date range (last 30 days)
    setDefaultDateRange();
    
    // Add event listeners
    setupEventListeners();
    
    // Load income data
    loadIncomeData();
}

// Set default date range
function setDefaultDateRange() {
    // Set end date to today
    endDate = new Date();
    
    // Set start date to 30 days ago
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Update date inputs
    if (startDateInput) {
        startDateInput.valueAsDate = startDate;
    }
    
    if (endDateInput) {
        endDateInput.valueAsDate = endDate;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Date range select
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', () => {
            const value = dateRangeSelect.value;
            
            if (value === 'custom') {
                // Show custom date range inputs
                customDateRange.style.display = 'flex';
            } else {
                // Hide custom date range inputs
                customDateRange.style.display = 'none';
                
                // Update date range based on selection
                updateDateRange(value);
            }
        });
    }
    
    // Apply filters button
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', () => {
            // Get selected date range
            const dateRange = dateRangeSelect.value;
            
            if (dateRange === 'custom') {
                // Get custom date range
                startDate = startDateInput.valueAsDate;
                endDate = endDateInput.valueAsDate;
                
                // Validate date range
                if (!startDate || !endDate) {
                    alert("Please select both start and end dates.");
                    return;
                }
                
                if (startDate > endDate) {
                    alert("Start date cannot be after end date.");
                    return;
                }
            } else {
                // Update date range based on selection
                updateDateRange(dateRange);
            }
            
            // Get selected income type
            incomeType = incomeTypeSelect.value;
            
            // Reset to first page
            currentPage = 1;
            
            // Apply filters
            applyFilters();
        });
    }
    
    // Reset filters button
    if (resetFiltersButton) {
        resetFiltersButton.addEventListener('click', () => {
            // Reset date range
            dateRangeSelect.value = '30';
            customDateRange.style.display = 'none';
            
            // Reset income type
            incomeTypeSelect.value = 'all';
            
            // Reset to default date range
            setDefaultDateRange();
            
            // Reset to first page
            currentPage = 1;
            
            // Apply filters
            incomeType = 'all';
            applyFilters();
        });
    }
    
    // Export CSV button
    if (exportCsvButton) {
        exportCsvButton.addEventListener('click', exportToCsv);
    }
    
    // Logout buttons
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

// Update date range based on selection
function updateDateRange(days) {
    // Set end date to today
    endDate = new Date();
    
    // Set start date to X days ago
    startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
}

// Load income data
function loadIncomeData() {
    // Show loading message
    incomeTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="loading-message">Loading income data...</td>
        </tr>
    `;
    
    // Get income data from Firestore
    firebase.firestore().collection('income')
        .orderBy('date', 'desc')
        .get()
        .then((snapshot) => {
            incomeData = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                
                // Add document ID
                data.id = doc.id;
                
                // Convert timestamp to date
                if (data.date) {
                    data.dateObj = data.date.toDate();
                    data.dateFormatted = formatDate(data.dateObj);
                }
                
                // Add to income data array
                incomeData.push(data);
            });
            
            // Apply filters
            applyFilters();
        })
        .catch((error) => {
            console.error("Error loading income data:", error);
            incomeTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="error-message">Error loading income data. Please try again.</td>
                </tr>
            `;
        });
}

// Apply filters to income data
function applyFilters() {
    // Filter by date range
    filteredIncomeData = incomeData.filter((item) => {
        if (!item.dateObj) return false;
        
        return item.dateObj >= startDate && item.dateObj <= endDate;
    });
    
    // Filter by income type
    if (incomeType !== 'all') {
        filteredIncomeData = filteredIncomeData.filter((item) => item.type === incomeType);
    }
    
    // Update summary
    updateSummary();
    
    // Update charts
    updateCharts();
    
    // Update table
    updateTable();
}

// Update summary
function updateSummary() {
    // Calculate total income
    const totalIncome = filteredIncomeData.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Calculate subscription income
    const subscriptionIncome = filteredIncomeData
        .filter((item) => item.type === 'subscription')
        .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Calculate token income
    const tokenIncome = filteredIncomeData
        .filter((item) => item.type === 'token')
        .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Update summary elements
    totalIncomeElement.textContent = `₦${formatNumber(totalIncome)}`;
    subscriptionIncomeElement.textContent = `₦${formatNumber(subscriptionIncome)}`;
    tokenIncomeElement.textContent = `₦${formatNumber(tokenIncome)}`;
    totalTransactionsElement.textContent = filteredIncomeData.length;
}

// Update charts
function updateCharts() {
    // Update income over time chart
    updateIncomeChart();
    
    // Update income by type chart
    updateIncomeTypeChart();
}

// Update income over time chart
function updateIncomeChart() {
    // Group income by day
    const incomeByDay = {};
    
    // Get date range
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Create empty data for each day
    for (let i = 0; i <= days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateString = formatDateYMD(date);
        incomeByDay[dateString] = 0;
    }
    
    // Fill in data from filtered income
    filteredIncomeData.forEach((item) => {
        if (!item.dateObj) return;
        
        const dateString = formatDateYMD(item.dateObj);
        incomeByDay[dateString] = (incomeByDay[dateString] || 0) + (item.amount || 0);
    });
    
    // Convert to arrays for Chart.js
    const labels = Object.keys(incomeByDay).sort();
    const data = labels.map((date) => incomeByDay[date]);
    
    // Create or update chart
    if (incomeChartInstance) {
        incomeChartInstance.data.labels = labels;
        incomeChartInstance.data.datasets[0].data = data;
        incomeChartInstance.update();
    } else if (incomeChartCanvas) {
        incomeChartInstance = new Chart(incomeChartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Income (₦)',
                    data: data,
                    backgroundColor: chartColors.blueLight,
                    borderColor: chartColors.blue,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#e5e7eb'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '₦' + formatNumber(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(55, 65, 81, 0.3)'
                        },
                        ticks: {
                            color: '#9ca3af'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(55, 65, 81, 0.3)'
                        },
                        ticks: {
                            color: '#9ca3af',
                            callback: function(value) {
                                return '₦' + formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
    }
}

// Update income by type chart
function updateIncomeTypeChart() {
    // Group income by type
    const subscriptionIncome = filteredIncomeData
        .filter((item) => item.type === 'subscription')
        .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const tokenIncome = filteredIncomeData
        .filter((item) => item.type === 'token')
        .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Create or update chart
    if (incomeTypeChartInstance) {
        incomeTypeChartInstance.data.datasets[0].data = [subscriptionIncome, tokenIncome];
        incomeTypeChartInstance.update();
    } else if (incomeTypeChartCanvas) {
        incomeTypeChartInstance = new Chart(incomeTypeChartCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Subscriptions', 'Token Purchases'],
                datasets: [{
                    data: [subscriptionIncome, tokenIncome],
                    backgroundColor: [chartColors.blue, chartColors.purple],
                    borderColor: [chartColors.blue, chartColors.purple],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#e5e7eb'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ₦${formatNumber(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Update table
function updateTable() {
    // Calculate pagination
    const totalPages = Math.ceil(filteredIncomeData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredIncomeData.length);
    const pageData = filteredIncomeData.slice(startIndex, endIndex);
    
    // Clear table
    incomeTableBody.innerHTML = '';
    
    // Check if there's data
    if (pageData.length === 0) {
        incomeTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">No income data found for the selected filters.</td>
            </tr>
        `;
        
        // Hide pagination
        incomePagination.innerHTML = '';
        return;
    }
    
    // Add rows to table
    pageData.forEach((item) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${item.dateFormatted || 'N/A'}</td>
            <td>${item.email || 'N/A'}</td>
            <td>${item.type === 'subscription' ? 'Subscription' : 'Token Purchase'}</td>
            <td>${item.details || 'N/A'}</td>
            <td>${formatPaymentMethod(item.paymentMethod)}</td>
            <td>₦${formatNumber(item.amount || 0)}</td>
        `;
        
        incomeTableBody.appendChild(row);
    });
    
    // Update pagination
    updatePagination(totalPages);
}

// Update pagination
function updatePagination(totalPages) {
    // Clear pagination
    incomePagination.innerHTML = '';
    
    // Don't show pagination if there's only one page
    if (totalPages <= 1) return;
    
    // Add previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });
    incomePagination.appendChild(prevButton);
    
    // Add page buttons
    const maxButtons = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === currentPage);
        pageButton.addEventListener('click', () => {
            currentPage = i;
            updateTable();
        });
        incomePagination.appendChild(pageButton);
    }
    
    // Add next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateTable();
        }
    });
    incomePagination.appendChild(nextButton);
}

// Export to CSV
function exportToCsv() {
    // Check if there's data to export
    if (filteredIncomeData.length === 0) {
        alert("No data to export.");
        return;
    }
    
    // Create CSV header
    let csv = 'Date,User,Type,Details,Payment Method,Amount\n';
    
    // Add rows
    filteredIncomeData.forEach((item) => {
        const date = item.dateFormatted || '';
        const email = item.email || '';
        const type = item.type === 'subscription' ? 'Subscription' : 'Token Purchase';
        const details = item.details || '';
        const paymentMethod = formatPaymentMethod(item.paymentMethod);
        const amount = item.amount || 0;
        
        // Escape fields that might contain commas
        const escapedEmail = `"${email.replace(/"/g, '""')}"`;
        const escapedDetails = `"${details.replace(/"/g, '""')}"`;
        
        csv += `${date},${escapedEmail},${type},${escapedDetails},${paymentMethod},₦${amount}\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bink-income-${formatDateYMD(startDate)}-to-${formatDateYMD(endDate)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Format date
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format date as YYYY-MM-DD
function formatDateYMD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format number with commas
function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format payment method
function formatPaymentMethod(method) {
    if (!method) return 'N/A';
    
    switch (method) {
        case 'card':
            return 'Credit/Debit Card';
        case 'bank_transfer':
            return 'Bank Transfer';
        case 'mobile_money':
            return 'Mobile Money';
        case 'paystack':
            return 'Paystack';
        default:
            return method.charAt(0).toUpperCase() + method.slice(1).replace(/_/g, ' ');
    }
}

// Logout
function logout() {
    firebase.auth().signOut()
        .then(() => {
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error("Error signing out:", error);
            alert("Error signing out. Please try again.");
        });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initFirebase);
