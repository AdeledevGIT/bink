// Token Requests Management for Admin Panel

// DOM Elements
const tokenRequestsTableBody = document.getElementById('token-requests-table-body');
const tokenRequestFilter = document.getElementById('token-request-filter');
const tokenRequestPrevPage = document.getElementById('token-request-prev-page');
const tokenRequestNextPage = document.getElementById('token-request-next-page');
const tokenRequestPageInfo = document.getElementById('token-request-page-info');
const tokenRequestModal = document.getElementById('token-request-modal');
const tokenRequestDetailsContainer = document.getElementById('token-request-details-container');
const approveTokenRequestButton = document.getElementById('approve-token-request-button');
const rejectTokenRequestButton = document.getElementById('reject-token-request-button');

// Variables
let currentTokenRequestPage = 1;
let totalTokenRequestPages = 1;
let tokenRequestsPerPage = 10;
let currentTokenRequestFilter = 'all';
let currentTokenRequest = null;

// Initialize token requests
function initTokenRequests() {
    // Set up event listeners
    if (tokenRequestFilter) {
        tokenRequestFilter.addEventListener('change', () => {
            currentTokenRequestFilter = tokenRequestFilter.value;
            currentTokenRequestPage = 1;
            loadTokenRequests();
        });
    }

    if (tokenRequestPrevPage) {
        tokenRequestPrevPage.addEventListener('click', () => {
            if (currentTokenRequestPage > 1) {
                currentTokenRequestPage--;
                loadTokenRequests();
            }
        });
    }

    if (tokenRequestNextPage) {
        tokenRequestNextPage.addEventListener('click', () => {
            if (currentTokenRequestPage < totalTokenRequestPages) {
                currentTokenRequestPage++;
                loadTokenRequests();
            }
        });
    }

    // Set up modal event listeners
    if (approveTokenRequestButton) {
        approveTokenRequestButton.addEventListener('click', approveTokenRequest);
    }

    if (rejectTokenRequestButton) {
        rejectTokenRequestButton.addEventListener('click', rejectTokenRequest);
    }

    // Load token requests
    loadTokenRequests();
}

// Load token requests
async function loadTokenRequests() {
    if (!tokenRequestsTableBody) return;

    try {
        // Show loading state
        tokenRequestsTableBody.innerHTML = '<tr class="placeholder-row"><td colspan="7">Loading token requests...</td></tr>';

        // Create query
        let query = db.collection('tokenPurchaseRequests').orderBy('createdAt', 'desc');

        // Apply filter
        if (currentTokenRequestFilter !== 'all') {
            query = query.where('status', '==', currentTokenRequestFilter);
        }

        // Get total count for pagination
        const snapshot = await query.get();
        const totalRequests = snapshot.docs.length;
        totalTokenRequestPages = Math.ceil(totalRequests / tokenRequestsPerPage);

        // Update pagination info
        if (tokenRequestPageInfo) {
            tokenRequestPageInfo.textContent = `Page ${currentTokenRequestPage} of ${totalTokenRequestPages || 1}`;
        }

        // Apply pagination using startAfter instead of offset
        let paginatedQuery = query.limit(tokenRequestsPerPage);

        // If not on first page, use startAfter with the last document from previous page
        if (currentTokenRequestPage > 1) {
            const startIndex = (currentTokenRequestPage - 1) * tokenRequestsPerPage - 1;
            // Make sure we don't exceed the array bounds
            const lastVisibleIndex = Math.min(startIndex, snapshot.docs.length - 1);
            if (lastVisibleIndex >= 0) {
                const lastVisibleDoc = snapshot.docs[lastVisibleIndex];
                paginatedQuery = query.startAfter(lastVisibleDoc).limit(tokenRequestsPerPage);
            }
        }

        // Get requests
        const tokenRequests = await paginatedQuery.get();

        // Check if there are any requests
        if (tokenRequests.empty) {
            tokenRequestsTableBody.innerHTML = '<tr class="placeholder-row"><td colspan="7">No token requests found.</td></tr>';
            return;
        }

        // Clear table
        tokenRequestsTableBody.innerHTML = '';

        // Add requests to table
        tokenRequests.forEach(doc => {
            const request = doc.data();
            const row = document.createElement('tr');

            // Format date
            const date = request.createdAt ? new Date(request.createdAt.toDate()) : new Date();
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

            // Create status badge
            let statusBadge = '';
            if (request.status === 'pending') {
                statusBadge = '<span class="status-badge pending">Pending</span>';
            } else if (request.status === 'approved') {
                statusBadge = '<span class="status-badge approved">Approved</span>';
            } else if (request.status === 'rejected') {
                statusBadge = '<span class="status-badge rejected">Rejected</span>';
            }

            // Create first purchase badge
            const firstPurchaseBadge = request.isFirstPurchase ?
                '<span class="status-badge first-purchase">Yes (+200)</span>' :
                '<span>No</span>';

            row.innerHTML = `
                <td>${request.username || request.email || 'Unknown'}</td>
                <td>${request.tokenAmount}</td>
                <td>₦${request.price}</td>
                <td>${formattedDate}</td>
                <td>${statusBadge}</td>
                <td>${firstPurchaseBadge}</td>
                <td>
                    <button class="action-button view-button" data-id="${doc.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;

            // Add row to table
            tokenRequestsTableBody.appendChild(row);

            // Add event listener to view button
            const viewButton = row.querySelector('.view-button');
            if (viewButton) {
                viewButton.addEventListener('click', () => openTokenRequestModal(doc.id));
            }
        });

    } catch (error) {
        console.error('Error loading token requests:', error);
        tokenRequestsTableBody.innerHTML = '<tr class="placeholder-row"><td colspan="7">Error loading token requests.</td></tr>';
    }
}

// Open token request modal
async function openTokenRequestModal(requestId) {
    try {
        // Show loading state
        tokenRequestDetailsContainer.innerHTML = '<p>Loading request details...</p>';
        tokenRequestModal.style.display = 'block';

        // Get request details
        const doc = await db.collection('tokenPurchaseRequests').doc(requestId).get();

        if (!doc.exists) {
            tokenRequestDetailsContainer.innerHTML = '<p>Request not found.</p>';
            return;
        }

        // Store current request
        currentTokenRequest = {
            id: doc.id,
            ...doc.data()
        };

        // Format date
        const date = currentTokenRequest.createdAt ?
            new Date(currentTokenRequest.createdAt.toDate()) :
            new Date();
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        // Update modal content
        tokenRequestDetailsContainer.innerHTML = `
            <div class="details-grid">
                <div class="detail-item">
                    <span class="detail-label">User:</span>
                    <span class="detail-value">${currentTokenRequest.username || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${currentTokenRequest.email || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Full Name:</span>
                    <span class="detail-value">${currentTokenRequest.fullName || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${currentTokenRequest.phoneNumber || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Token Amount:</span>
                    <span class="detail-value">${currentTokenRequest.tokenAmount}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Price:</span>
                    <span class="detail-value">₦${currentTokenRequest.price}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value status-badge ${currentTokenRequest.status || 'pending'}">${
                        currentTokenRequest.status
                            ? currentTokenRequest.status.charAt(0).toUpperCase() + currentTokenRequest.status.slice(1)
                            : 'Pending'
                    }</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">First Purchase:</span>
                    <span class="detail-value">${currentTokenRequest.isFirstPurchase ? 'Yes (+200 bonus tokens)' : 'No'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">User ID:</span>
                    <span class="detail-value">${currentTokenRequest.userId || 'N/A'}</span>
                </div>
            </div>
        `;

        // Update button visibility based on status
        if (currentTokenRequest.status === 'pending') {
            approveTokenRequestButton.style.display = 'block';
            rejectTokenRequestButton.style.display = 'block';
        } else {
            approveTokenRequestButton.style.display = 'none';
            rejectTokenRequestButton.style.display = 'none';
        }

    } catch (error) {
        console.error('Error opening token request modal:', error);
        tokenRequestDetailsContainer.innerHTML = '<p>Error loading request details.</p>';
    }
}

// Approve token request
async function approveTokenRequest() {
    if (!currentTokenRequest) return;

    try {
        // Show loading state
        approveTokenRequestButton.disabled = true;
        approveTokenRequestButton.textContent = 'Processing...';

        // Start a batch
        const batch = db.batch();

        // Update request status
        const requestRef = db.collection('tokenPurchaseRequests').doc(currentTokenRequest.id);
        batch.update(requestRef, {
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: auth.currentUser.uid
        });

        // Get user document
        const userDoc = await db.collection('users').doc(currentTokenRequest.userId).get();

        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        const currentTokens = userData.tokens || 0;
        const isFirstPurchase = currentTokenRequest.isFirstPurchase && !(userData.hasPurchasedTokens || false);
        const bonusTokens = isFirstPurchase ? 200 : 0;
        const totalTokens = currentTokens + currentTokenRequest.tokenAmount + bonusTokens;

        // Update user document
        const userRef = db.collection('users').doc(currentTokenRequest.userId);
        batch.update(userRef, {
            tokens: totalTokens,
            hasPurchasedTokens: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Record transaction
        const transactionRef = db.collection('tokenTransactions').doc();
        batch.set(transactionRef, {
            userId: currentTokenRequest.userId,
            requestId: currentTokenRequest.id,
            amount: currentTokenRequest.tokenAmount,
            bonusAmount: bonusTokens,
            price: currentTokenRequest.price,
            currency: currentTokenRequest.currency || 'NGN',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Commit batch
        await batch.commit();

        // Close modal and reload requests
        tokenRequestModal.style.display = 'none';
        loadTokenRequests();

        // Show success message
        alert('Token request approved successfully!');

    } catch (error) {
        console.error('Error approving token request:', error);
        alert(`Error approving token request: ${error.message}`);
    } finally {
        // Reset button
        approveTokenRequestButton.disabled = false;
        approveTokenRequestButton.textContent = 'Approve & Add Tokens';
    }
}

// Reject token request
async function rejectTokenRequest() {
    if (!currentTokenRequest) return;

    // Confirm rejection
    if (!confirm('Are you sure you want to reject this token request?')) {
        return;
    }

    try {
        // Show loading state
        rejectTokenRequestButton.disabled = true;
        rejectTokenRequestButton.textContent = 'Processing...';

        // Update request status
        await db.collection('tokenPurchaseRequests').doc(currentTokenRequest.id).update({
            status: 'rejected',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
            rejectedBy: auth.currentUser.uid
        });

        // Close modal and reload requests
        tokenRequestModal.style.display = 'none';
        loadTokenRequests();

        // Show success message
        alert('Token request rejected successfully!');

    } catch (error) {
        console.error('Error rejecting token request:', error);
        alert(`Error rejecting token request: ${error.message}`);
    } finally {
        // Reset button
        rejectTokenRequestButton.disabled = false;
        rejectTokenRequestButton.textContent = 'Reject Request';
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the admin page
    if (document.querySelector('.admin-container')) {
        initTokenRequests();
    }
});
