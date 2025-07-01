// Tasks page functionality for BINK

// DOM Elements
const tokenCount = document.getElementById('tokenCount');
const tasksContainer = document.getElementById('tasks-container');
const taskModal = document.getElementById('task-modal');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalRewardAmount = document.getElementById('modal-reward-amount');
const taskFormContainer = document.getElementById('task-form-container');
const modalCompleteBtn = document.getElementById('modal-complete-btn');

// Global variables
let currentUser = null;
let userProfile = null;
let tasks = [];
let currentTask = null;

// Initialize tasks page
async function initTasksPage() {
    try {
        // Check authentication
        currentUser = await checkAuth(true);
        if (!currentUser) return;

        // Load user profile
        await loadUserProfile();

        // Load tasks
        await loadTasks();

        // Set up event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing tasks page:', error);
    }
}

// Helper function to check authentication
function checkAuth(redirect = false) {
    return new Promise((resolve, reject) => {
        if (!firebase.auth) {
            console.error("Firebase Auth is not initialized.");
            if (redirect) window.location.href = 'login.html';
            resolve(null);
            return;
        }

        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
            unsubscribe(); // Stop listening immediately
            if (!user && redirect) {
                window.location.href = 'login.html';
            }
            resolve(user);
        }, (error) => {
            console.error("Auth state check error:", error);
            if (redirect) window.location.href = 'login.html';
            reject(error);
        });
    });
}

// Load user profile
async function loadUserProfile() {
    try {
        const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();

        if (userDoc.exists) {
            userProfile = userDoc.data();

            // Ensure completedTaskTypes exists
            if (!userProfile.completedTaskTypes) {
                userProfile.completedTaskTypes = {};
            }

            // Check if anonify_all_completed is in completedTaskTypes
            if (userProfile.completedTaskTypes.anonify_all_completed) {
                console.log("User has completed the Anonify bonus task according to user profile");
            }

            // Update token count
            updateTokenCount();
        } else {
            console.log('User document not found');
            // Create a user document if it doesn't exist
            await firebase.firestore().collection('users').doc(currentUser.uid).set({
                email: currentUser.email,
                username: currentUser.email.split('@')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                tokens: 0,
                completedTaskTypes: {}
            });

            userProfile = {
                email: currentUser.email,
                username: currentUser.email.split('@')[0],
                tokens: 0,
                completedTaskTypes: {}
            };

            updateTokenCount();
        }

        // Check for completed tasks in taskCompletions collection
        const completionsSnapshot = await firebase.firestore().collection('taskCompletions')
            .where('userId', '==', currentUser.uid)
            .where('taskType', '==', 'anonify_all_completed')
            .limit(1)
            .get();

        if (!completionsSnapshot.empty) {
            console.log("Found anonify_all_completed in taskCompletions collection");
            // Ensure the completedTaskTypes field is updated
            userProfile.completedTaskTypes = userProfile.completedTaskTypes || {};
            userProfile.completedTaskTypes.anonify_all_completed = true;
        }

        // Also check user's completedTasks subcollection
        const userCompletedTasksSnapshot = await firebase.firestore().collection('users')
            .doc(currentUser.uid)
            .collection('completedTasks')
            .doc('anonify_all_completed')
            .get();

        if (userCompletedTasksSnapshot.exists) {
            console.log("Found anonify_all_completed in user's completedTasks subcollection");
            // Ensure the completedTaskTypes field is updated
            userProfile.completedTaskTypes = userProfile.completedTaskTypes || {};
            userProfile.completedTaskTypes.anonify_all_completed = true;
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Update token count display
function updateTokenCount() {
    if (tokenCount) {
        const tokens = userProfile.tokens || 0;
        tokenCount.textContent = tokens;
    }
}

// Load tasks from Firestore
async function loadTasks() {
    try {
        console.log("Loading tasks from Firestore...");

        // Show loading spinner
        tasksContainer.innerHTML = '<div class="loading-spinner"></div>';

        // Get tasks from Firestore - temporary solution to avoid index requirement
        // Original query: .where('isActive', '==', true).orderBy('createdAt', 'desc')
        const tasksSnapshot = await firebase.firestore().collection('tasks')
            .get();

        console.log(`Found ${tasksSnapshot.size} tasks in database`);

        // Get user's completed tasks from taskCompletions collection
        const completionsSnapshot = await firebase.firestore().collection('taskCompletions')
            .where('userId', '==', currentUser.uid)
            .get();

        console.log(`Found ${completionsSnapshot.size} task completions for user ${currentUser.uid}`);

        // Create a map of completed tasks and track task types
        const completedTasks = {};
        const completedTaskTypes = new Set(); // Track completed task types

        completionsSnapshot.forEach(doc => {
            const completion = doc.data();
            const taskId = completion.taskId;
            const taskType = completion.taskType;

            // Store completion by task ID
            if (!completedTasks[taskId]) {
                completedTasks[taskId] = [];
            }
            completedTasks[taskId].push(completion);

            // Also track by task type for Anonify tasks
            if (taskType && taskType.startsWith('anonify_')) {
                completedTaskTypes.add(taskType);
                console.log(`User has completed Anonify task type: ${taskType} (from taskCompletions)`);
            }
        });

        // Also check user's completedTasks subcollection
        try {
            const userCompletedTasksSnapshot = await firebase.firestore().collection('users')
                .doc(currentUser.uid)
                .collection('completedTasks')
                .get();

            console.log(`Found ${userCompletedTasksSnapshot.size} tasks in user's completedTasks collection`);

            userCompletedTasksSnapshot.forEach(doc => {
                const taskType = doc.id; // Document ID is the task type
                if (taskType && taskType.startsWith('anonify_')) {
                    completedTaskTypes.add(taskType);
                    console.log(`User has completed Anonify task type: ${taskType} (from completedTasks collection)`);
                }
            });
        } catch (error) {
            console.error("Error getting user's completedTasks collection:", error);
        }

        // Also check completedTaskTypes field in user document
        try {
            const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.completedTaskTypes) {
                    Object.keys(userData.completedTaskTypes).forEach(taskType => {
                        if (taskType && taskType.startsWith('anonify_') && userData.completedTaskTypes[taskType] === true) {
                            completedTaskTypes.add(taskType);
                            console.log(`User has completed Anonify task type: ${taskType} (from user document)`);
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Error checking completedTaskTypes in user document:", error);
        }

        // Process tasks
        tasks = [];
        let anonifyTasks = [];

        tasksSnapshot.forEach(doc => {
            const task = doc.data();
            task.id = doc.id;

            // Filter out inactive tasks (temporary solution until index is created)
            if (task.isActive !== true) {
                return;
            }

            // Check if task is completed
            task.completions = completedTasks[task.id] || [];

            // For Anonify tasks, also check by task type
            if (task.type && task.type.startsWith('anonify_')) {
                // Mark as completed if we have the task type in our completed set
                const isCompletedByType = completedTaskTypes.has(task.type);
                if (isCompletedByType) {
                    console.log(`Task ${task.id} (${task.type}) is completed by task type`);
                    // If we have the task type but no completions for this specific task ID,
                    // create a dummy completion to mark it as completed
                    if (task.completions.length === 0) {
                        task.completions = [{
                            taskId: task.id,
                            taskType: task.type,
                            userId: currentUser.uid,
                            completedAt: firebase.firestore.FieldValue.serverTimestamp()
                        }];
                    }
                }
            }

            // Set the isCompleted flag based on completions
            task.isCompleted = task.completions.length > 0;

            // Check if task can be completed again
            task.canCompleteAgain = task.isRepeatable &&
                (!task.repeatFrequency ||
                 !task.isCompleted ||
                 canCompleteAgain(task));

            // Separate Anonify tasks
            if (task.type && task.type.startsWith('anonify_')) {
                anonifyTasks.push(task);
            } else {
                tasks.push(task);
            }
        });

        // If we have Anonify tasks, create a combined task
        if (anonifyTasks.length > 0) {
            // Sort Anonify tasks in the correct order
            anonifyTasks.sort((a, b) => {
                const anonifyOrder = {
                    'anonify_signup': 1,
                    'anonify_earn_tokens': 2,
                    'anonify_messages': 3,
                    'anonify_all_completed': 4
                };

                const orderA = anonifyOrder[a.type] || 99;
                const orderB = anonifyOrder[b.type] || 99;

                return orderA - orderB;
            });

            // Check if all Anonify tasks are completed
            const allAnonifyTasksCompleted = anonifyTasks.every(task =>
                task.isCompleted && task.type !== 'anonify_all_completed'
            );

            // Create a combined Anonify task
            const combinedAnonifyTask = {
                id: 'combined_anonify_tasks',
                title: 'Complete Anonify Tasks',
                shortDescription: 'Complete tasks on Anonify to earn tokens',
                tokenReward: 200,
                isCompleted: allAnonifyTasksCompleted,
                canCompleteAgain: false,
                type: 'combined_anonify',
                anonifyTasks: anonifyTasks
            };

            // Add the combined task to the beginning of the tasks array
            tasks.unshift(combinedAnonifyTask);
        }

        // Sort non-Anonify tasks by createdAt in descending order
        tasks.sort((a, b) => {
            if (a.id === 'combined_anonify_tasks') return -1;
            if (b.id === 'combined_anonify_tasks') return 1;

            const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
            return dateB - dateA;
        });

        // Render tasks
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        tasksContainer.innerHTML = `
            <div class="no-tasks">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading tasks. Please try again later.</p>
            </div>
        `;
    }
}

// Check if a task can be completed again based on frequency
function canCompleteAgain(task) {
    if (!task.isRepeatable) return false;
    if (!task.repeatFrequency) return true;

    // Special handling for DirectLink ad task - allow up to 10 completions per day
    if (task.type === 'directlink_ad') {
        // Count how many times the task was completed today
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        // Filter completions that happened today
        const todayCompletions = task.completions.filter(completion => {
            const completionDate = completion.completedAt.toDate();
            return completionDate >= today;
        });

        // Allow up to 10 completions per day
        return todayCompletions.length < 10;
    }

    // Get the most recent completion
    const latestCompletion = task.completions.sort((a, b) =>
        b.completedAt.toDate() - a.completedAt.toDate()
    )[0];

    if (!latestCompletion) return true;

    const completionDate = latestCompletion.completedAt.toDate();
    const now = new Date();

    switch (task.repeatFrequency) {
        case 'daily':
            // Can complete again if it's a new day
            return completionDate.getDate() !== now.getDate() ||
                   completionDate.getMonth() !== now.getMonth() ||
                   completionDate.getFullYear() !== now.getFullYear();
        case 'weekly':
            // Can complete again if it's been at least 7 days
            return (now - completionDate) >= 7 * 24 * 60 * 60 * 1000;
        case 'monthly':
            // Can complete again if it's a new month
            return completionDate.getMonth() !== now.getMonth() ||
                   completionDate.getFullYear() !== now.getFullYear();
        default:
            return true;
    }
}

// Render tasks in the container
function renderTasks() {
    if (tasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="no-tasks">
                <i class="fas fa-tasks"></i>
                <p>No tasks available at the moment. Check back later!</p>
            </div>
        `;
        return;
    }

    let html = '';
    tasks.forEach(task => {
        const isCompleted = task.isCompleted && !task.canCompleteAgain;
        const statusClass = isCompleted ? 'status-completed' : 'status-available';
        const statusText = isCompleted ? 'Completed' : 'Available';
        const buttonClass = isCompleted ? 'action-completed' : 'action-complete';
        const buttonText = isCompleted ? 'Completed' : 'Complete';

        html += `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-header">
                    <h3 class="task-title">${task.title}</h3>
                    <div class="task-reward">
                        <i class="fas fa-coins"></i>
                        <span>${task.tokenReward}</span>
                    </div>
                </div>
                <div class="task-description">${task.shortDescription || task.description}</div>
                <div class="task-footer">
                    <div class="task-status ${statusClass}">
                        <i class="fas ${isCompleted ? 'fa-check-circle' : 'fa-circle'}"></i>
                        <span>${statusText}</span>
                    </div>
                    <button class="task-action ${buttonClass}" ${isCompleted ? 'disabled' : ''} data-task-id="${task.id}">
                        ${buttonText}
                    </button>
                </div>
            </div>
        `;
    });

    tasksContainer.innerHTML = html;

    // Add event listeners to task cards and buttons
    document.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Ignore if the click was on the button
            if (e.target.classList.contains('task-action')) return;

            const taskId = card.getAttribute('data-task-id');
            openTaskModal(taskId);
        });
    });

    document.querySelectorAll('.task-action').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click

            if (button.classList.contains('action-completed')) return;

            const taskId = button.getAttribute('data-task-id');
            openTaskModal(taskId);
        });
    });
}

// Create combined Anonify task form
function createCombinedAnonifyTaskForm(task) {
    // Get the Anonify tasks
    const anonifyTasks = task.anonifyTasks || [];

    // Check if all required tasks are completed
    const signupTask = anonifyTasks.find(t => t.type === 'anonify_signup');
    const earnTokensTask = anonifyTasks.find(t => t.type === 'anonify_earn_tokens');
    const messagesTask = anonifyTasks.find(t => t.type === 'anonify_messages');
    const allCompletedTask = anonifyTasks.find(t => t.type === 'anonify_all_completed');

    const signupCompleted = signupTask && signupTask.isCompleted;
    const earnTokensCompleted = earnTokensTask && earnTokensTask.isCompleted;
    const messagesCompleted = messagesTask && messagesTask.isCompleted;
    const allTasksCompleted = signupCompleted && earnTokensCompleted && messagesCompleted;

    // Check if bonus is completed from the task list
    let bonusCompleted = allCompletedTask && allCompletedTask.isCompleted;

    // If not marked as completed in the task list, check user's completedTaskTypes
    if (!bonusCompleted && userProfile && userProfile.completedTaskTypes && userProfile.completedTaskTypes.anonify_all_completed) {
        bonusCompleted = true;
        console.log("Bonus marked as completed from user profile data");
    }

    // Create the form HTML
    let formHtml = `
        <div class="anonify-tasks-container">
            <div style="text-align: center; margin-bottom: 1rem;">
                <img src="https://firebasestorage.googleapis.com/v0/b/trustpay-d9d40.appspot.com/o/Untitled%20design.png?alt=media&token=f6d49565-7060-4208-af2a-2a741bdaf62d" alt="Anonify Logo" style="max-width: 150px; margin: 0 auto;">
            </div>

            <p style="margin-bottom: 1rem;">Complete these tasks on Anonify to earn tokens:</p>

            <!-- Task 1: Sign up on Anonify -->
            <div class="anonify-task-item ${signupCompleted ? 'completed' : ''}" data-task-type="anonify_signup">
                <div class="anonify-task-header" onclick="toggleAnonifyTask(this)">
                    <div class="anonify-task-title">
                        <i class="fas ${signupCompleted ? 'fa-check-circle' : 'fa-circle'}"></i>
                        <span>1. Sign up on Anonify</span>
                    </div>
                    <div class="anonify-task-reward">Step 1 of 3</div>
                    <div class="anonify-task-toggle"><i class="fas fa-chevron-down"></i></div>
                </div>
                <div class="anonify-task-content" style="display: none;">
                    <p>Create an account on Anonify, the anonymous messaging platform:</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0;">
                        <a href="https://anonify-sigma.vercel.app/" target="_blank" class="modal-button modal-complete" style="flex: 1; text-align: center; text-decoration: none; margin-right: 10px;">
                            <i class="fas fa-user-plus"></i> Sign Up on Anonify
                        </a>
                    </div>
                    <div style="display: flex; align-items: center; margin-top: 0.5rem;">
                        <input type="text" id="anonify-username" class="form-input" placeholder="Enter your Anonify username" style="flex: 1; margin-right: 10px;">
                        <button type="button" id="verify-anonify-username" class="modal-button modal-complete" style="white-space: nowrap;" ${signupCompleted ? 'disabled' : ''}>
                            <i class="fas ${signupCompleted ? 'fa-check' : 'fa-check-circle'}"></i> ${signupCompleted ? 'Verified' : 'Verify'}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Task 2: Earn Tokens on Anonify -->
            <div class="anonify-task-item ${earnTokensCompleted ? 'completed' : ''}" data-task-type="anonify_earn_tokens">
                <div class="anonify-task-header" onclick="toggleAnonifyTask(this)">
                    <div class="anonify-task-title">
                        <i class="fas ${earnTokensCompleted ? 'fa-check-circle' : 'fa-circle'}"></i>
                        <span>2. Earn Tokens on Anonify</span>
                    </div>
                    <div class="anonify-task-reward">Step 2 of 3</div>
                    <div class="anonify-task-toggle"><i class="fas fa-chevron-down"></i></div>
                </div>
                <div class="anonify-task-content" style="display: none;">
                    <p>Use the "Earn 10 Tokens" button 15 times on Anonify:</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0;">
                        <a href="https://anonify-sigma.vercel.app/dashboard.html" target="_blank" class="modal-button modal-complete" style="flex: 1; text-align: center; text-decoration: none; margin-right: 10px;">
                            <i class="fas fa-coins"></i> Earn Tokens on Anonify
                        </a>
                        <button type="button" id="verify-anonify-tokens" class="modal-button modal-complete" style="white-space: nowrap;" ${earnTokensCompleted ? 'disabled' : ''}>
                            <i class="fas ${earnTokensCompleted ? 'fa-check' : 'fa-check-circle'}"></i> ${earnTokensCompleted ? 'Verified' : 'Verify'}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Task 3: Receive Messages on Anonify -->
            <div class="anonify-task-item ${messagesCompleted ? 'completed' : ''}" data-task-type="anonify_messages">
                <div class="anonify-task-header" onclick="toggleAnonifyTask(this)">
                    <div class="anonify-task-title">
                        <i class="fas ${messagesCompleted ? 'fa-check-circle' : 'fa-circle'}"></i>
                        <span>3. Receive Messages on Anonify</span>
                    </div>
                    <div class="anonify-task-reward">Step 3 of 3</div>
                    <div class="anonify-task-toggle"><i class="fas fa-chevron-down"></i></div>
                </div>
                <div class="anonify-task-content" style="display: none;">
                    <p>Share your Anonify link with friends to receive at least 5 messages:</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0;">
                        <a href="https://anonify-sigma.vercel.app/dashboard.html" target="_blank" class="modal-button modal-complete" style="flex: 1; text-align: center; text-decoration: none; margin-right: 10px;">
                            <i class="fas fa-envelope"></i> Go to Anonify
                        </a>
                        <button type="button" id="verify-anonify-messages" class="modal-button modal-complete" style="white-space: nowrap;" ${messagesCompleted ? 'disabled' : ''}>
                            <i class="fas ${messagesCompleted ? 'fa-check' : 'fa-check-circle'}"></i> ${messagesCompleted ? 'Verified' : 'Verify'}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Claim Bonus -->
            <div class="anonify-bonus-section ${!allTasksCompleted ? 'disabled' : (bonusCompleted ? 'completed' : '')}">
                <div class="anonify-bonus-header">
                    <i class="fas fa-gift"></i>
                    <span>Bonus Reward</span>
                </div>
                <div class="anonify-bonus-content">
                    <p>Complete all three tasks above to claim your bonus reward!</p>
                    <button type="button" id="claim-bonus-tokens" class="modal-button modal-complete"
                            style="width: 100%; margin-top: 1rem; ${bonusCompleted ? 'background-color: #10B981;' : ''}"
                            ${bonusCompleted ? 'disabled' : ''}>
                        <i class="fas ${bonusCompleted ? 'fa-check' : 'fa-gift'}"></i> ${bonusCompleted ? 'Claimed' : 'Claim 200 Bonus Tokens'}
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add the form to the container
    taskFormContainer.innerHTML = formHtml;

    // Add CSS for the Anonify tasks
    const style = document.createElement('style');
    style.textContent = `
        .anonify-tasks-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .anonify-task-item {
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            overflow: hidden;
        }

        .anonify-task-item.completed {
            border-color: #10B981;
        }

        .anonify-task-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background-color: var(--secondary-color);
            cursor: pointer;
        }

        .anonify-task-item.completed .anonify-task-header {
            background-color: rgba(16, 185, 129, 0.1);
        }

        .anonify-task-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
        }

        .anonify-task-item.completed .anonify-task-title i {
            color: #10B981;
        }

        .anonify-task-reward {
            background-color: rgba(16, 185, 129, 0.1);
            color: #10B981;
            padding: 0.25rem 0.5rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
        }

        .anonify-task-toggle {
            margin-left: 1rem;
        }

        .anonify-task-content {
            padding: 1rem;
            border-top: 1px solid var(--border-color);
        }

        .anonify-bonus-section {
            margin-top: 1rem;
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            overflow: hidden;
        }

        .anonify-bonus-section.disabled {
            opacity: 0.6;
        }

        .anonify-bonus-section.completed {
            border-color: #10B981;
        }

        .anonify-bonus-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 1rem;
            background-color: var(--primary-color);
            color: white;
            font-weight: 600;
        }

        .anonify-bonus-section.completed .anonify-bonus-header {
            background-color: #10B981;
        }

        .anonify-bonus-content {
            padding: 1rem;
        }
    `;
    document.head.appendChild(style);

    // Add global function to toggle task content
    window.toggleAnonifyTask = function(header) {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.anonify-task-toggle i');

        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    };

    // Add event listeners for the verification buttons
    if (!signupCompleted) {
        document.getElementById('verify-anonify-username')?.addEventListener('click', async (event) => {
            // Prevent default form submission
            event.preventDefault();
            event.stopPropagation();

            console.log("Verify button clicked, starting verification process...");

            try {
                const usernameInput = document.getElementById('anonify-username');
                if (!usernameInput || !usernameInput.value.trim()) {
                    alert('Please enter your Anonify username');
                    return;
                }

                const anonifyUsername = usernameInput.value.trim();
                const verifyButton = document.getElementById('verify-anonify-username');

                console.log(`Verifying username: ${anonifyUsername}`);

                // Show loading state
                verifyButton.disabled = true;
                verifyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

                // Verify the username exists on Anonify
                console.log("Calling verifyAnonifyUser...");
                const isVerified = await window.BINK.anonifyVerification.verifyAnonifyUser(anonifyUsername);
                console.log(`Verification result: ${isVerified}`);

                if (isVerified) {
                    console.log("Username verified successfully, saving to profile...");
                    // Save the username to the user's profile
                    await window.BINK.anonifyVerification.saveAnonifyUsername(currentUser.uid, anonifyUsername);

                    // Update button to show success
                    verifyButton.innerHTML = '<i class="fas fa-check"></i> Verified!';
                    verifyButton.style.backgroundColor = '#10B981';

                    console.log("Completing Anonify signup task...");
                    // Complete the task automatically
                    await completeAnonifyTask('anonify_signup');

                    console.log("Task completed, reloading tasks without page refresh");
                    // Reload tasks without refreshing the page
                    setTimeout(async () => {
                        await loadTasks();
                    }, 1500);
                } else {
                    console.log("Username not found");
                    alert('Username not found on Anonify. Please make sure you entered the correct username.');
                    verifyButton.disabled = false;
                    verifyButton.innerHTML = '<i class="fas fa-check-circle"></i> Verify';
                }
            } catch (error) {
                console.error('Error verifying Anonify username:', error);
                alert('Error verifying username. Please try again.');
                document.getElementById('verify-anonify-username').disabled = false;
                document.getElementById('verify-anonify-username').innerHTML = '<i class="fas fa-check-circle"></i> Verify';
            }
        });
    }

    if (!earnTokensCompleted) {
        document.getElementById('verify-anonify-tokens')?.addEventListener('click', async (event) => {
            // Prevent default form submission
            event.preventDefault();
            event.stopPropagation();

            console.log("Verify tokens button clicked, starting verification process...");

            try {
                // Get the user's Anonify username from their profile
                if (!userProfile.anonifyUsername) {
                    alert('You need to complete the Anonify signup task first');
                    return;
                }

                const verifyButton = document.getElementById('verify-anonify-tokens');

                console.log(`Verifying tokens for username: ${userProfile.anonifyUsername}`);

                // Show loading state
                verifyButton.disabled = true;
                verifyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

                // Verify the user has earned tokens on Anonify
                console.log("Calling verifyAnonifyTokens...");
                const isVerified = await window.BINK.anonifyVerification.verifyAnonifyTokens(userProfile.anonifyUsername);
                console.log(`Token verification result: ${isVerified}`);

                if (isVerified) {
                    console.log("Tokens verified successfully");
                    // Update button to show success
                    verifyButton.innerHTML = '<i class="fas fa-check"></i> Verified!';
                    verifyButton.style.backgroundColor = '#10B981';

                    console.log("Completing Anonify earn tokens task...");
                    // Complete the task automatically
                    await completeAnonifyTask('anonify_earn_tokens');

                    console.log("Task completed, reloading tasks without page refresh");
                    // Reload tasks without refreshing the page
                    setTimeout(async () => {
                        await loadTasks();
                    }, 1500);
                } else {
                    console.log("Not enough tokens earned");
                    alert('You need to earn at least 150 tokens on Anonify to complete this task.');
                    verifyButton.disabled = false;
                    verifyButton.innerHTML = '<i class="fas fa-check-circle"></i> Verify';
                }
            } catch (error) {
                console.error('Error verifying Anonify tokens:', error);
                alert('Error verifying tokens. Please try again.');
                document.getElementById('verify-anonify-tokens').disabled = false;
                document.getElementById('verify-anonify-tokens').innerHTML = '<i class="fas fa-check-circle"></i> Verify';
            }
        });
    }

    if (!messagesCompleted) {
        document.getElementById('verify-anonify-messages')?.addEventListener('click', async (event) => {
            // Prevent default form submission
            event.preventDefault();
            event.stopPropagation();

            console.log("Verify messages button clicked, starting verification process...");

            try {
                // Get the user's Anonify username from their profile
                if (!userProfile.anonifyUsername) {
                    alert('You need to complete the Anonify signup task first');
                    return;
                }

                const verifyButton = document.getElementById('verify-anonify-messages');

                console.log(`Verifying messages for username: ${userProfile.anonifyUsername}`);

                // Show loading state
                verifyButton.disabled = true;
                verifyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

                // Verify the user has received messages on Anonify
                console.log("Calling verifyAnonifyMessages...");
                const isVerified = await window.BINK.anonifyVerification.verifyAnonifyMessages(userProfile.anonifyUsername);
                console.log(`Messages verification result: ${isVerified}`);

                if (isVerified) {
                    console.log("Messages verified successfully");
                    // Update button to show success
                    verifyButton.innerHTML = '<i class="fas fa-check"></i> Verified!';
                    verifyButton.style.backgroundColor = '#10B981';

                    console.log("Completing Anonify messages task...");
                    // Complete the task automatically
                    await completeAnonifyTask('anonify_messages');

                    console.log("Task completed, reloading tasks without page refresh");
                    // Reload tasks without refreshing the page
                    setTimeout(async () => {
                        await loadTasks();
                    }, 1500);
                } else {
                    console.log("Not enough messages received");
                    alert('You need to receive at least 5 messages on Anonify to complete this task.');
                    verifyButton.disabled = false;
                    verifyButton.innerHTML = '<i class="fas fa-check-circle"></i> Verify';
                }
            } catch (error) {
                console.error('Error verifying Anonify messages:', error);
                alert('Error verifying messages. Please try again.');
                document.getElementById('verify-anonify-messages').disabled = false;
                document.getElementById('verify-anonify-messages').innerHTML = '<i class="fas fa-check-circle"></i> Verify';
            }
        });
    }

    // Only add the event listener to the claim button if the bonus hasn't been claimed yet
    const claimButton = document.getElementById('claim-bonus-tokens');
    if (claimButton && !bonusCompleted) {
        claimButton.addEventListener('click', async (event) => {
            // Prevent default form submission
            event.preventDefault();
            event.stopPropagation();

            console.log("Claim bonus button clicked, starting verification process...");

            try {
                // First check if the bonus has already been claimed
                const bonusClaimedCheck = await checkBonusAlreadyClaimed();
                if (bonusClaimedCheck) {
                    console.log("Bonus already claimed, updating UI");
                    claimButton.disabled = true;
                    claimButton.innerHTML = '<i class="fas fa-check"></i> Claimed!';
                    claimButton.style.backgroundColor = '#10B981';
                    return;
                }

                // Show loading state
                claimButton.disabled = true;
                claimButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Claiming...';

                // Force refresh the task completion status first
                console.log("Force refreshing task completion status...");
                await forceRefreshTaskStatus();

                console.log("Checking if all Anonify tasks are completed...");
                // Verify all Anonify tasks are completed
                const allCompleted = await window.BINK.anonifyVerification.checkAllAnonifyTasksCompleted(currentUser.uid);
                console.log(`All tasks completed check result: ${allCompleted}`);

                if (allCompleted) {
                    console.log("All tasks verified successfully");
                    // Update button to show success
                    claimButton.innerHTML = '<i class="fas fa-check"></i> Claimed!';
                    claimButton.style.backgroundColor = '#10B981';

                    console.log("Completing Anonify all completed task...");
                    // Complete the task automatically
                    await completeAnonifyTask('anonify_all_completed');

                    // Permanently disable the button
                    claimButton.disabled = true;

                    console.log("Bonus claimed, reloading tasks without page refresh");
                    // Reload tasks without refreshing the page
                    setTimeout(async () => {
                        await loadTasks();
                    }, 1500);
                } else {
                    console.log("Not all tasks are completed");
                    alert('You need to complete all three Anonify tasks first.');
                    claimButton.disabled = false;
                    claimButton.innerHTML = '<i class="fas fa-gift"></i> Claim 200 Bonus Tokens';
                }
            } catch (error) {
                console.error('Error claiming bonus tokens:', error);
                alert('Error claiming bonus tokens. Please try again.');
                claimButton.disabled = false;
                claimButton.innerHTML = '<i class="fas fa-gift"></i> Claim 200 Bonus Tokens';
            }
        });
    }

    // Hide the complete button in the modal footer since we have individual buttons for each task
    modalCompleteBtn.style.display = 'none';
}

// Check if bonus has already been claimed
async function checkBonusAlreadyClaimed() {
    try {
        console.log("Checking if bonus has already been claimed...");

        // Check taskCompletions collection
        const completionsSnapshot = await firebase.firestore().collection('taskCompletions')
            .where('userId', '==', currentUser.uid)
            .where('taskType', '==', 'anonify_all_completed')
            .limit(1)
            .get();

        if (!completionsSnapshot.empty) {
            console.log("Found bonus claim in taskCompletions collection");
            return true;
        }

        // Check user document
        const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData.completedTaskTypes && userData.completedTaskTypes.anonify_all_completed) {
                console.log("Found bonus claim in user document");
                return true;
            }
        }

        // Check user's completedTasks subcollection
        const userCompletedTasksSnapshot = await firebase.firestore().collection('users')
            .doc(currentUser.uid)
            .collection('completedTasks')
            .doc('anonify_all_completed')
            .get();

        if (userCompletedTasksSnapshot.exists) {
            console.log("Found bonus claim in user's completedTasks subcollection");
            return true;
        }

        // Check token transactions
        const tokenTransactionsSnapshot = await firebase.firestore().collection('tokenTransactions')
            .where('userId', '==', currentUser.uid)
            .where('taskType', '==', 'anonify_all_completed')
            .limit(1)
            .get();

        if (!tokenTransactionsSnapshot.empty) {
            console.log("Found bonus claim in tokenTransactions collection");
            return true;
        }

        console.log("No bonus claim found");
        return false;
    } catch (error) {
        console.error("Error checking if bonus has been claimed:", error);
        return false;
    }
}

// Force refresh task status by directly verifying all tasks
async function forceRefreshTaskStatus() {
    try {
        console.log("Force refreshing task status...");

        // Check if user has an Anonify username
        if (!userProfile.anonifyUsername) {
            console.log("No Anonify username found in user profile");
            return false;
        }

        const anonifyUsername = userProfile.anonifyUsername;
        console.log(`Using Anonify username: ${anonifyUsername}`);

        // Get user document
        const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists) {
            console.log("User document not found");
            return false;
        }

        const userData = userDoc.data();

        // Create completedTaskTypes object if it doesn't exist
        const completedTaskTypes = userData.completedTaskTypes || {};

        // Mark signup task as completed since we have a username
        completedTaskTypes['anonify_signup'] = true;

        // Verify tokens task
        console.log("Verifying tokens task...");
        const tokensVerified = await window.BINK.anonifyVerification.verifyAnonifyTokens(anonifyUsername);
        if (tokensVerified) {
            console.log("Tokens task verified successfully");
            completedTaskTypes['anonify_earn_tokens'] = true;
        }

        // Verify messages task
        console.log("Verifying messages task...");
        const messagesVerified = await window.BINK.anonifyVerification.verifyAnonifyMessages(anonifyUsername);
        if (messagesVerified) {
            console.log("Messages task verified successfully");
            completedTaskTypes['anonify_messages'] = true;
        }

        // Update user document with verified task status
        await firebase.firestore().collection('users').doc(currentUser.uid).update({
            completedTaskTypes: completedTaskTypes,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log("User document updated with verified task status");
        return true;
    } catch (error) {
        console.error("Error force refreshing task status:", error);
        return false;
    }
}

// Helper function to complete an Anonify task
async function completeAnonifyTask(taskType) {
    try {
        // Find the task
        const task = tasks.find(t => t.type === taskType);
        if (!task) {
            console.error(`Task with type ${taskType} not found`);
            return false;
        }

        console.log(`Completing Anonify task: ${taskType}`);

        // For individual Anonify tasks, we don't award tokens immediately
        // Only the 'anonify_all_completed' task will award tokens
        const tokenReward = taskType === 'anonify_all_completed' ? 200 : 0;

        // Check if this task is already completed
        const completionsSnapshot = await firebase.firestore().collection('taskCompletions')
            .where('userId', '==', currentUser.uid)
            .where('taskType', '==', taskType)
            .limit(1)
            .get();

        if (!completionsSnapshot.empty) {
            console.log(`Task ${taskType} is already completed, skipping completion`);
            return true; // Task is already completed, return success
        }

        // Record task completion
        const completionData = {
            taskId: task.id,
            userId: currentUser.uid,
            tokenReward: tokenReward,
            taskType: taskType,
            taskCategory: 'anonify',
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log(`Saving task completion to database with token reward: ${tokenReward}`);
        const completionRef = await firebase.firestore().collection('taskCompletions').add(completionData);
        console.log(`Task completion saved with ID: ${completionRef.id}`);

        // Also save to a user-specific collection for faster retrieval
        await firebase.firestore().collection('users').doc(currentUser.uid)
            .collection('completedTasks').doc(taskType).set({
                taskId: task.id,
                taskType: taskType,
                taskCategory: 'anonify',
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        console.log(`Task completion also saved to user's completedTasks collection`);

        // For all tasks, update the user document with completedTaskTypes
        // This is important for task progress tracking
        const userDocRef = firebase.firestore().collection('users').doc(currentUser.uid);

        // Get current user data
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            console.error("User document not found");
            return false;
        }

        const userData = userDoc.data();

        // Create completedTaskTypes object if it doesn't exist
        const completedTaskTypes = userData.completedTaskTypes || {};
        completedTaskTypes[taskType] = true;

        // Update user document
        const updateData = {
            completedTaskTypes: completedTaskTypes,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Only update user tokens for the bonus task
        if (taskType === 'anonify_all_completed') {
            console.log(`Awarding 200 tokens for completing all Anonify tasks`);
            const currentTokens = userData.tokens || 0;
            const newTokens = currentTokens + tokenReward;

            // Add tokens to update data
            updateData.tokens = newTokens;

            // Record token transaction
            await firebase.firestore().collection('tokenTransactions').add({
                userId: currentUser.uid,
                type: 'task_reward',
                taskId: task.id,
                taskType: taskType,
                amount: tokenReward,
                balanceAfter: newTokens,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log(`User tokens will be updated to ${newTokens}`);
        }

        // Update user document with all changes
        await userDocRef.update(updateData);
        console.log(`User document updated with completed task type: ${taskType}`);

        // If this is the first task, also update the anonifyUsername in userProfile
        // so it's available for subsequent tasks without page refresh
        if (taskType === 'anonify_signup' && userProfile) {
            const usernameInput = document.getElementById('anonify-username');
            if (usernameInput && usernameInput.value.trim()) {
                userProfile.anonifyUsername = usernameInput.value.trim();
                console.log(`Updated userProfile with anonifyUsername: ${userProfile.anonifyUsername}`);
            }
        }

        // Update local user profile if tokens were awarded
        if (taskType === 'anonify_all_completed' && userProfile) {
            const currentTokens = userProfile.tokens || 0;
            userProfile.tokens = currentTokens + tokenReward;
            updateTokenCount();
            console.log(`Updated local token count to ${userProfile.tokens}`);

            // Make sure the claim button is permanently disabled
            const claimButton = document.getElementById('claim-bonus-tokens');
            if (claimButton) {
                claimButton.disabled = true;
                claimButton.innerHTML = '<i class="fas fa-check"></i> Claimed!';
                claimButton.style.backgroundColor = '#10B981';
                console.log("Permanently disabled claim button");
            }
        }

        return true;
    } catch (error) {
        console.error(`Error completing Anonify task ${taskType}:`, error);
        return false;
    }
}

// Open task modal
function openTaskModal(taskId) {
    // Find the task
    currentTask = tasks.find(task => task.id === taskId);
    if (!currentTask) return;

    // Update modal content
    modalTitle.textContent = currentTask.title;
    modalDescription.innerHTML = currentTask.description || '';
    modalRewardAmount.textContent = currentTask.tokenReward;

    // Create task form based on task type
    createTaskForm(currentTask);

    // Update complete button (hide for combined Anonify task)
    if (currentTask.type !== 'combined_anonify') {
        // DirectLink ads will handle the button visibility in their own event listener
        if (currentTask.type === 'directlink_ad') {
            modalCompleteBtn.textContent = 'Claim Reward';
            modalCompleteBtn.disabled = true;
            modalCompleteBtn.classList.add('modal-complete');
            modalCompleteBtn.classList.remove('modal-cancel');
            modalCompleteBtn.style.display = 'none'; // Initially hidden, will be shown after countdown
        } else if (currentTask.isCompleted && !currentTask.canCompleteAgain) {
            modalCompleteBtn.style.display = 'block';
            modalCompleteBtn.textContent = 'Already Completed';
            modalCompleteBtn.disabled = true;
            modalCompleteBtn.classList.add('modal-cancel');
            modalCompleteBtn.classList.remove('modal-complete');
        } else if (currentTask.taskLink && currentTask.taskLink.trim() !== '') {
            // For tasks with links, change the button to "Claim Reward" and disable it initially
            modalCompleteBtn.style.display = 'block';
            modalCompleteBtn.textContent = 'Claim Reward';
            modalCompleteBtn.disabled = true;
            modalCompleteBtn.classList.add('modal-complete');
            modalCompleteBtn.classList.remove('modal-cancel');
            // Add a countdown element below the button
            const countdownEl = document.createElement('div');
            countdownEl.id = 'reward-countdown';
            countdownEl.style.textAlign = 'center';
            countdownEl.style.marginTop = '10px';
            countdownEl.style.fontSize = '0.9rem';
            countdownEl.style.color = 'var(--text-muted)';
            countdownEl.textContent = 'Complete the task to claim your reward';
            modalCompleteBtn.parentNode.insertBefore(countdownEl, modalCompleteBtn.nextSibling);
        } else {
            modalCompleteBtn.style.display = 'block';
            modalCompleteBtn.textContent = 'Complete Task';
            modalCompleteBtn.disabled = false;
            modalCompleteBtn.classList.add('modal-complete');
            modalCompleteBtn.classList.remove('modal-cancel');
        }
    }

    // Show modal
    taskModal.style.display = 'flex';
}

// Create task form based on task type
function createTaskForm(task) {
    let formHtml = '';

    // Special handling for combined Anonify tasks
    if (task.type === 'combined_anonify') {
        return createCombinedAnonifyTaskForm(task);
    }

    switch (task.type) {
        case 'directlink_ad':
            // Count how many times the task was completed today
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today

            // Filter completions that happened today
            const todayCompletions = task.completions.filter(completion => {
                const completionDate = completion.completedAt.toDate();
                return completionDate >= today;
            });

            // Calculate remaining clicks for today
            const clicksUsed = todayCompletions.length;
            const clicksRemaining = 10 - clicksUsed;

            formHtml = `
                <div class="form-group">
                    <div style="background-color: #1F2937; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); margin-bottom: 1.5rem;">
                        <!-- Ad header -->
                        <div style="background-color: #111827; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-link" style="color: #FF6B6B;"></i>
                                <span style="font-weight: 600; color: #fff;">DirectLink</span>
                            </div>
                            <div style="background-color: rgba(16, 185, 129, 0.2); padding: 4px 8px; border-radius: 20px;">
                                <span style="font-size: 0.8rem; font-weight: 600; color: #10B981;">+20 Tokens</span>
                            </div>
                        </div>

                        <!-- Ad content -->
                        <div style="padding: 20px; background-color: #111827; text-align: center;">
                            <div style="background-color: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                                <i class="fas fa-external-link-alt" style="font-size: 2rem; color: #FF6B6B; margin-bottom: 15px;"></i>
                                <div style="font-weight: 600; color: #fff; font-size: 1.2rem; margin-bottom: 10px;">Visit Third-Party Site</div>
                                <div style="color: rgba(255, 255, 255, 0.7); margin-bottom: 15px;">Click the button below to visit a third-party site and earn tokens</div>
                                <div id="ad-status-text" style="font-weight: 600; color: #10B981; margin-top: 10px;">Ready to Earn Tokens</div>
                                <div id="ad-countdown" style="display: none; margin-top: 10px; font-size: 0.9rem; color: rgba(255, 255, 255, 0.7);"></div>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; background-color: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 15px;">
                                <div style="text-align: left;">
                                    <div style="font-weight: 600; color: #fff; margin-bottom: 4px;">DirectLink</div>
                                    <div style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.7);">
                                        <span>${clicksRemaining}</span> clicks remaining today
                                    </div>
                                </div>
                                <button id="directlink-ad-button" class="modal-button modal-complete" style="padding: 10px 20px; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-external-link-alt"></i> Visit Link
                                </button>
                            </div>
                        </div>
                    </div>

                    <div id="ad-instructions" style="font-size: 0.9rem; color: var(--text-muted); text-align: center; margin-top: 1rem;">
                        Visit the third-party link to earn 20 tokens. You'll be able to claim your reward after visiting.
                    </div>
                </div>
            `;
            break;
        case 'social_share':
            formHtml = `
                <div class="form-group">
                    <label class="form-label">Share your BINK bio link on:</label>
                    <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                        <a href="https://twitter.com/intent/tweet?text=Check%20out%20my%20bio%20link%20created%20with%20BINK!&url=https://bink-tau.vercel.app/${userProfile.username}" target="_blank" class="modal-button modal-complete" style="flex: 1; text-align: center; text-decoration: none;">
                            <i class="fab fa-twitter"></i> Twitter
                        </a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u=https://bink-tau.vercel.app/${userProfile.username}" target="_blank" class="modal-button modal-complete" style="flex: 1; text-align: center; text-decoration: none;">
                            <i class="fab fa-facebook"></i> Facebook
                        </a>
                    </div>
                    <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted);">
                        After sharing, click "Complete Task" to earn your tokens.
                    </p>
                </div>
            `;
            break;
        case 'profile_completion':
            formHtml = `
                <div class="form-group">
                    <p>Complete your profile by adding:</p>
                    <ul style="margin: 0.5rem 0 1rem 1.5rem;">
                        <li>Profile picture</li>
                        <li>Bio description</li>
                        <li>At least 3 links</li>
                    </ul>
                    <a href="bio-editor.html" class="modal-button modal-complete" style="display: block; text-align: center; text-decoration: none; margin-bottom: 1rem;">
                        Go to Bio Editor
                    </a>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">
                        After completing your profile, come back and click "Complete Task" to earn your tokens.
                    </p>
                </div>
            `;
            break;
        case 'referral':
            formHtml = `
                <div class="form-group">
                    <label class="form-label">Your Referral Link:</label>
                    <div style="display: flex; margin-top: 0.5rem;">
                        <input type="text" class="form-input" value="https://bink-tau.vercel.app/signup.html?ref=${currentUser.uid}" readonly style="flex-grow: 1;">
                        <button id="copy-referral-link" class="modal-button modal-complete" style="margin-left: 0.5rem;">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted);">
                        Share this link with friends. You'll earn tokens when they sign up and create their bio page.
                    </p>
                </div>
            `;
            break;
        case 'daily_login':
            formHtml = `
                <div class="form-group">
                    <p>You've logged in today! Click "Complete Task" to claim your daily tokens.</p>
                </div>
            `;
            break;
        case 'custom':
        default:
            // Check if the task has a link
            if (task.taskLink && task.taskLink.trim() !== '') {
                formHtml = `
                    <div class="form-group">
                        <p>${task.instructions || 'Complete the task by clicking the button below:'}</p>
                        <div style="text-align: center; margin-top: 1rem;">
                            <button id="go-to-task-button" class="modal-button modal-complete" style="padding: 1rem 2rem; font-size: 1.1rem; display: inline-flex; align-items: center; gap: 0.5rem; margin: 0 auto;">
                                <i class="fas fa-external-link-alt"></i> Go to Task
                            </button>
                        </div>
                        <p style="font-size: 0.9rem; color: var(--text-muted); text-align: center; margin-top: 0.5rem;">
                            After completing the task, come back and wait for the countdown to finish to claim your reward.
                        </p>
                    </div>
                `;
            } else {
                formHtml = `
                    <div class="form-group">
                        <p>${task.instructions || 'Follow the instructions and click "Complete Task" when done.'}</p>
                    </div>
                `;
            }
            break;
    }

    taskFormContainer.innerHTML = formHtml;

    // Add event listeners for form elements
    if (task.taskLink && task.taskLink.trim() !== '') {
        document.getElementById('go-to-task-button')?.addEventListener('click', () => {
            // Disable the button to prevent multiple clicks
            const button = document.getElementById('go-to-task-button');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Opening...';

            // Open the task link in a new tab
            window.open(task.taskLink, '_blank');

            // Start the 15-second countdown
            let secondsLeft = 15;
            const countdownEl = document.getElementById('reward-countdown');
            if (countdownEl) {
                countdownEl.textContent = `Please wait ${secondsLeft} seconds to claim your reward...`;
            }

            // Update the button to show it's been clicked
            button.innerHTML = '<i class="fas fa-check-circle"></i> Task Opened';
            button.style.backgroundColor = '#10B981';

            // Start the countdown interval
            const countdownInterval = setInterval(() => {
                secondsLeft--;
                if (countdownEl) {
                    countdownEl.textContent = `Please wait ${secondsLeft} seconds to claim your reward...`;
                }

                // When countdown reaches 0, enable the claim reward button
                if (secondsLeft <= 0) {
                    clearInterval(countdownInterval);
                    if (countdownEl) {
                        countdownEl.textContent = 'You can now claim your reward!';
                        countdownEl.style.color = '#10B981';
                        countdownEl.style.fontWeight = 'bold';
                    }

                    // Enable the claim reward button
                    if (modalCompleteBtn) {
                        modalCompleteBtn.disabled = false;
                    }
                }
            }, 1000);
        });
    }

    if (task.type === 'directlink_ad') {
        // Hide the Complete Task button initially for DirectLink ads
        if (modalCompleteBtn) {
            modalCompleteBtn.style.display = 'none';
            modalCompleteBtn.textContent = 'Claim Reward';
        }

        document.getElementById('directlink-ad-button')?.addEventListener('click', async () => {
            try {
                // Disable the button to prevent multiple clicks
                const button = document.getElementById('directlink-ad-button');
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Opening...';

                // Update the ad status text
                const adStatusText = document.getElementById('ad-status-text');
                const adCountdown = document.getElementById('ad-countdown');
                const adInstructions = document.getElementById('ad-instructions');

                if (adStatusText) {
                    adStatusText.textContent = 'Opening Link...';
                }

                // Store the task ID in localStorage to verify when user returns
                localStorage.setItem('pendingDirectLinkTask', task.id);
                localStorage.setItem('directLinkClickTime', Date.now().toString());

                // Open the DirectLink URL
                window.open('https://otieu.com/4/7728924', '_blank');

                // Update UI to show link was visited
                button.style.backgroundColor = '#6B7280';
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-check-circle"></i> Link Visited';

                if (adStatusText) {
                    adStatusText.textContent = 'Link Visited';
                }

                if (adCountdown) {
                    adCountdown.style.display = 'block';
                }

                if (adInstructions) {
                    adInstructions.textContent = 'Please wait while we process your visit. Your reward will be available shortly.';
                }

                // Start the 15-second countdown
                let secondsLeft = 15;

                if (adCountdown) {
                    adCountdown.textContent = `Verifying: ${secondsLeft} seconds remaining`;
                }

                const countdownInterval = setInterval(() => {
                    secondsLeft--;

                    if (adCountdown) {
                        adCountdown.textContent = `Verifying: ${secondsLeft} seconds remaining`;
                    }

                    // When countdown reaches 0, enable the claim reward button
                    if (secondsLeft <= 0) {
                        clearInterval(countdownInterval);

                        if (adStatusText) {
                            adStatusText.textContent = 'Visit Verified!';
                            adStatusText.style.color = '#10B981';
                        }

                        if (adCountdown) {
                            adCountdown.textContent = 'You can now claim your reward';
                            adCountdown.style.color = '#10B981';
                        }

                        if (adInstructions) {
                            adInstructions.textContent = 'Click the "Claim Reward" button below to receive your tokens.';
                            adInstructions.style.color = '#10B981';
                            adInstructions.style.fontWeight = 'bold';
                        }

                        // Show and enable the claim reward button
                        if (modalCompleteBtn) {
                            modalCompleteBtn.style.display = 'block';
                            modalCompleteBtn.disabled = false;
                        }
                    }
                }, 1000);
            } catch (error) {
                console.error('Error processing DirectLink click:', error);
                alert('Error processing your click. Please try again.');

                // Re-enable the button
                const button = document.getElementById('directlink-ad-button');
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-external-link-alt"></i> Visit Link';
            }
        });
    } else if (task.type === 'referral') {
        document.getElementById('copy-referral-link')?.addEventListener('click', () => {
            const referralLink = document.querySelector('.form-input').value;
            navigator.clipboard.writeText(referralLink)
                .then(() => {
                    alert('Referral link copied to clipboard!');
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                });
        });
    } else if (task.type === 'anonify_signup') {
        document.getElementById('verify-anonify-username')?.addEventListener('click', async (event) => {
            // Prevent default form submission
            event.preventDefault();
            event.stopPropagation();

            console.log("Individual task verify button clicked, starting verification process...");

            try {
                const usernameInput = document.getElementById('anonify-username');
                if (!usernameInput || !usernameInput.value.trim()) {
                    alert('Please enter your Anonify username');
                    return;
                }

                const anonifyUsername = usernameInput.value.trim();
                const verifyButton = document.getElementById('verify-anonify-username');

                console.log(`Verifying username: ${anonifyUsername}`);

                // Show loading state
                verifyButton.disabled = true;
                verifyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

                // Verify the username exists on Anonify
                console.log("Calling verifyAnonifyUser from individual task...");
                const isVerified = await window.BINK.anonifyVerification.verifyAnonifyUser(anonifyUsername);
                console.log(`Verification result: ${isVerified}`);

                if (isVerified) {
                    console.log("Username verified successfully, saving to profile...");
                    // Save the username to the user's profile
                    await window.BINK.anonifyVerification.saveAnonifyUsername(currentUser.uid, anonifyUsername);

                    // Update button to show success
                    verifyButton.innerHTML = '<i class="fas fa-check"></i> Verified!';
                    verifyButton.style.backgroundColor = '#10B981';

                    console.log("Setting up task completion...");
                    // Complete the task automatically
                    currentTask.taskType = 'anonify_signup';
                    currentTask.taskCategory = 'anonify';

                    console.log("Calling completeTask()...");
                    completeTask();
                } else {
                    console.log("Username not found");
                    alert('Username not found on Anonify. Please make sure you entered the correct username.');
                    verifyButton.disabled = false;
                    verifyButton.innerHTML = '<i class="fas fa-check-circle"></i> Verify';
                }
            } catch (error) {
                console.error('Error verifying Anonify username:', error);
                alert('Error verifying username. Please try again.');
                document.getElementById('verify-anonify-username').disabled = false;
                document.getElementById('verify-anonify-username').innerHTML = '<i class="fas fa-check-circle"></i> Verify';
            }
        });
    } else if (task.type === 'anonify_earn_tokens') {
        document.getElementById('verify-anonify-tokens')?.addEventListener('click', async (event) => {
            // Prevent default form submission
            event.preventDefault();
            event.stopPropagation();

            console.log("Individual task verify tokens button clicked, starting verification process...");

            try {
                // Get the user's Anonify username from their profile
                if (!userProfile.anonifyUsername) {
                    alert('You need to complete the Anonify signup task first');
                    return;
                }

                const verifyButton = document.getElementById('verify-anonify-tokens');

                console.log(`Verifying tokens for username: ${userProfile.anonifyUsername}`);

                // Show loading state
                verifyButton.disabled = true;
                verifyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

                // Verify the user has earned tokens on Anonify
                console.log("Calling verifyAnonifyTokens from individual task...");
                const isVerified = await window.BINK.anonifyVerification.verifyAnonifyTokens(userProfile.anonifyUsername);
                console.log(`Token verification result: ${isVerified}`);

                if (isVerified) {
                    console.log("Tokens verified successfully");
                    // Update button to show success
                    verifyButton.innerHTML = '<i class="fas fa-check"></i> Verified!';
                    verifyButton.style.backgroundColor = '#10B981';

                    console.log("Setting up task completion...");
                    // Complete the task automatically
                    currentTask.taskType = 'anonify_earn_tokens';
                    currentTask.taskCategory = 'anonify';

                    console.log("Calling completeTask()...");
                    completeTask();
                } else {
                    console.log("Not enough tokens earned");
                    alert('You need to earn at least 150 tokens on Anonify to complete this task.');
                    verifyButton.disabled = false;
                    verifyButton.innerHTML = '<i class="fas fa-check-circle"></i> Verify';
                }
            } catch (error) {
                console.error('Error verifying Anonify tokens:', error);
                alert('Error verifying tokens. Please try again.');
                document.getElementById('verify-anonify-tokens').disabled = false;
                document.getElementById('verify-anonify-tokens').innerHTML = '<i class="fas fa-check-circle"></i> Verify';
            }
        });
    } else if (task.type === 'anonify_messages') {
        document.getElementById('verify-anonify-messages')?.addEventListener('click', async (event) => {
            // Prevent default form submission
            event.preventDefault();
            event.stopPropagation();

            console.log("Individual task verify messages button clicked, starting verification process...");

            try {
                // Get the user's Anonify username from their profile
                if (!userProfile.anonifyUsername) {
                    alert('You need to complete the Anonify signup task first');
                    return;
                }

                const verifyButton = document.getElementById('verify-anonify-messages');

                console.log(`Verifying messages for username: ${userProfile.anonifyUsername}`);

                // Show loading state
                verifyButton.disabled = true;
                verifyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

                // Verify the user has received messages on Anonify
                console.log("Calling verifyAnonifyMessages from individual task...");
                const isVerified = await window.BINK.anonifyVerification.verifyAnonifyMessages(userProfile.anonifyUsername);
                console.log(`Messages verification result: ${isVerified}`);

                if (isVerified) {
                    console.log("Messages verified successfully");
                    // Update button to show success
                    verifyButton.innerHTML = '<i class="fas fa-check"></i> Verified!';
                    verifyButton.style.backgroundColor = '#10B981';

                    console.log("Setting up task completion...");
                    // Complete the task automatically
                    currentTask.taskType = 'anonify_messages';
                    currentTask.taskCategory = 'anonify';

                    console.log("Calling completeTask()...");
                    completeTask();
                } else {
                    console.log("Not enough messages received");
                    alert('You need to receive at least 5 messages on Anonify to complete this task.');
                    verifyButton.disabled = false;
                    verifyButton.innerHTML = '<i class="fas fa-check-circle"></i> Verify';
                }
            } catch (error) {
                console.error('Error verifying Anonify messages:', error);
                alert('Error verifying messages. Please try again.');
                document.getElementById('verify-anonify-messages').disabled = false;
                document.getElementById('verify-anonify-messages').innerHTML = '<i class="fas fa-check-circle"></i> Verify';
            }
        });
    } else if (task.type === 'anonify_all_completed') {
        const claimButton = document.getElementById('claim-bonus-tokens');
        if (claimButton && !task.isCompleted) {
            claimButton.addEventListener('click', async (event) => {
                // Prevent default form submission
                event.preventDefault();
                event.stopPropagation();

                console.log("Individual task claim bonus button clicked, starting verification process...");

                try {
                    // First check if the bonus has already been claimed
                    const bonusClaimedCheck = await checkBonusAlreadyClaimed();
                    if (bonusClaimedCheck) {
                        console.log("Bonus already claimed, updating UI");
                        claimButton.disabled = true;
                        claimButton.innerHTML = '<i class="fas fa-check"></i> Claimed!';
                        claimButton.style.backgroundColor = '#10B981';
                        return;
                    }

                    // Show loading state
                    claimButton.disabled = true;
                    claimButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Claiming...';

                    console.log("Checking if all Anonify tasks are completed...");
                    // Verify all Anonify tasks are completed
                    const allCompleted = await window.BINK.anonifyVerification.checkAllAnonifyTasksCompleted(currentUser.uid);
                    console.log(`All tasks completed check result: ${allCompleted}`);

                    if (allCompleted) {
                        console.log("All tasks verified successfully");
                        // Update button to show success
                        claimButton.innerHTML = '<i class="fas fa-check"></i> Claimed!';
                        claimButton.style.backgroundColor = '#10B981';

                        console.log("Setting up task completion...");
                        // Complete the task automatically
                        currentTask.taskType = 'anonify_all_completed';
                        currentTask.taskCategory = 'anonify';

                        // Permanently disable the button
                        claimButton.disabled = true;

                        console.log("Calling completeTask()...");
                        completeTask();
                    } else {
                        console.log("Not all tasks are completed");
                        alert('You need to complete all three Anonify tasks first.');
                        claimButton.disabled = false;
                        claimButton.innerHTML = '<i class="fas fa-gift"></i> Claim 200 Bonus Tokens';
                    }
                } catch (error) {
                    console.error('Error claiming bonus tokens:', error);
                    alert('Error claiming bonus tokens. Please try again.');
                    document.getElementById('claim-bonus-tokens').disabled = false;
                    document.getElementById('claim-bonus-tokens').innerHTML = '<i class="fas fa-gift"></i> Claim 200 Bonus Tokens';
                }
            });
        }
    }
}

// Complete task
async function completeTask() {
    if (!currentTask) return;

    try {
        console.log("Starting task completion process...");

        // Disable complete button
        if (modalCompleteBtn) {
            modalCompleteBtn.disabled = true;
            modalCompleteBtn.textContent = 'Processing...';
        }

        // We no longer need to check for taskLink here since we handle it with the "Go to Task" button

        // Verify task completion based on task type
        let isVerified = await verifyTaskCompletion(currentTask);

        if (!isVerified) {
            alert('Task verification failed. Please make sure you have completed all requirements.');
            if (modalCompleteBtn) {
                modalCompleteBtn.disabled = false;
                modalCompleteBtn.textContent = 'Complete Task';
            }
            return;
        }

        // Special handling for Anonify tasks
        if (currentTask.taskType && currentTask.taskType.startsWith('anonify_')) {
            console.log(`Handling Anonify task: ${currentTask.taskType}`);

            // For Anonify tasks, use the completeAnonifyTask function
            const success = await completeAnonifyTask(currentTask.taskType);

            if (success) {
                console.log(`Anonify task ${currentTask.taskType} completed successfully`);

                // Close modal
                closeTaskModal();

                // Show success message
                if (currentTask.taskType === 'anonify_all_completed') {
                    alert(`Congratulations! You earned 200 tokens for completing all Anonify tasks.`);
                } else {
                    alert(`Task completed successfully! Complete all three Anonify tasks to earn 200 tokens.`);
                }

                // Reload tasks without refreshing the page
                await loadTasks();
            } else {
                console.error(`Failed to complete Anonify task: ${currentTask.taskType}`);
                alert('Error completing task. Please try again.');
                if (modalCompleteBtn) {
                    modalCompleteBtn.disabled = false;
                    modalCompleteBtn.textContent = 'Complete Task';
                }
            }

            return;
        }

        // For non-Anonify tasks, continue with the normal flow
        console.log("Processing regular (non-Anonify) task");

        // Record task completion
        const completionData = {
            taskId: currentTask.id,
            userId: currentUser.uid,
            tokenReward: currentTask.tokenReward || 0, // Ensure tokenReward is always a number
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Add taskType and taskCategory if available
        if (currentTask.taskType) {
            completionData.taskType = currentTask.taskType;
        }

        if (currentTask.taskCategory) {
            completionData.taskCategory = currentTask.taskCategory;
        }

        console.log("Saving task completion to database:", completionData);
        const completionRef = await firebase.firestore().collection('taskCompletions').add(completionData);
        console.log("Task completion saved with ID:", completionRef.id);

        // Update user tokens
        const currentTokens = userProfile.tokens || 0;
        const tokenReward = currentTask.tokenReward || 0; // Ensure tokenReward is always a number
        const newTokens = currentTokens + tokenReward;

        console.log(`Updating user tokens: ${currentTokens} + ${tokenReward} = ${newTokens}`);
        await firebase.firestore().collection('users').doc(currentUser.uid).update({
            tokens: newTokens,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Record token transaction
        await firebase.firestore().collection('tokenTransactions').add({
            userId: currentUser.uid,
            type: 'task_reward',
            taskId: currentTask.id,
            amount: tokenReward, // Use the safe tokenReward value
            balanceAfter: newTokens,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update local user profile
        userProfile.tokens = newTokens;
        updateTokenCount();

        // Close modal
        closeTaskModal();

        // Show success message
        alert(`Congratulations! You earned ${tokenReward} tokens for completing the task.`);

        // Reload tasks
        await loadTasks();

    } catch (error) {
        console.error('Error completing task:', error);
        alert('Error completing task. Please try again.');
        modalCompleteBtn.disabled = false;
        modalCompleteBtn.textContent = 'Complete Task';
    }
}

// Verify task completion based on task type
async function verifyTaskCompletion(task) {
    switch (task.type) {
        case 'profile_completion':
            // Verify profile is complete
            return await verifyProfileCompletion();
        case 'daily_login':
            // Daily login is automatically verified
            return true;
        case 'directlink_ad':
            // DirectLink ad click is verified by the click handler
            return true;
        case 'anonify_signup':
            // Verify Anonify signup
            return await verifyAnonifySignup();
        case 'anonify_earn_tokens':
            // Verify Anonify tokens earned
            return await verifyAnonifyTokensEarned();
        case 'anonify_messages':
            // Verify Anonify messages received
            return await verifyAnonifyMessagesReceived();
        case 'anonify_all_completed':
            // Verify all Anonify tasks completed
            return await verifyAllAnonifyTasksCompleted();
        case 'social_share':
        case 'referral':
        case 'custom':
        default:
            // For now, trust the user for these task types
            // In a production environment, you would implement proper verification
            return true;
    }
}

// Verify Anonify signup
async function verifyAnonifySignup() {
    try {
        // Get the username from the input field
        const usernameInput = document.getElementById('anonify-username');
        if (!usernameInput || !usernameInput.value.trim()) {
            alert('Please enter your Anonify username');
            return false;
        }

        const anonifyUsername = usernameInput.value.trim();

        // Verify the username exists on Anonify
        const isVerified = await window.BINK.anonifyVerification.verifyAnonifyUser(anonifyUsername);

        if (!isVerified) {
            alert('Username not found on Anonify. Please make sure you entered the correct username.');
            return false;
        }

        // Save the Anonify username to the user's profile for future tasks
        await window.BINK.anonifyVerification.saveAnonifyUsername(currentUser.uid, anonifyUsername);

        // Add taskType and taskCategory to the completion data
        currentTask.taskType = 'anonify_signup';
        currentTask.taskCategory = 'anonify';

        return true;
    } catch (error) {
        console.error('Error verifying Anonify signup:', error);
        alert('Error verifying Anonify signup. Please try again.');
        return false;
    }
}

// Verify Anonify tokens earned
async function verifyAnonifyTokensEarned() {
    try {
        // Get the user's Anonify username from their profile
        if (!userProfile.anonifyUsername) {
            alert('You need to complete the Anonify signup task first');
            return false;
        }

        // Verify the user has earned tokens on Anonify
        const isVerified = await window.BINK.anonifyVerification.verifyAnonifyTokens(userProfile.anonifyUsername);

        if (!isVerified) {
            alert('You need to earn at least 150 tokens on Anonify to complete this task.');
            return false;
        }

        // Add taskType and taskCategory to the completion data
        currentTask.taskType = 'anonify_earn_tokens';
        currentTask.taskCategory = 'anonify';

        return true;
    } catch (error) {
        console.error('Error verifying Anonify tokens:', error);
        alert('Error verifying Anonify tokens. Please try again.');
        return false;
    }
}

// Verify Anonify messages received
async function verifyAnonifyMessagesReceived() {
    try {
        // Get the user's Anonify username from their profile
        if (!userProfile.anonifyUsername) {
            alert('You need to complete the Anonify signup task first');
            return false;
        }

        // Verify the user has received messages on Anonify
        const isVerified = await window.BINK.anonifyVerification.verifyAnonifyMessages(userProfile.anonifyUsername);

        if (!isVerified) {
            alert('You need to receive at least 5 messages on Anonify to complete this task.');
            return false;
        }

        // Add taskType and taskCategory to the completion data
        currentTask.taskType = 'anonify_messages';
        currentTask.taskCategory = 'anonify';

        return true;
    } catch (error) {
        console.error('Error verifying Anonify messages:', error);
        alert('Error verifying Anonify messages. Please try again.');
        return false;
    }
}

// Verify all Anonify tasks completed
async function verifyAllAnonifyTasksCompleted() {
    try {
        // Check if all Anonify tasks are completed
        const allCompleted = await window.BINK.anonifyVerification.checkAllAnonifyTasksCompleted(currentUser.uid);

        if (!allCompleted) {
            alert('You need to complete all three Anonify tasks first.');
            return false;
        }

        // Add taskType and taskCategory to the completion data
        currentTask.taskType = 'anonify_all_completed';
        currentTask.taskCategory = 'anonify';

        return true;
    } catch (error) {
        console.error('Error verifying all Anonify tasks:', error);
        alert('Error verifying Anonify tasks. Please try again.');
        return false;
    }
}

// Verify profile completion
async function verifyProfileCompletion() {
    try {
        // Get user's bio data
        const bioDoc = await firebase.firestore().collection('bios').doc(currentUser.uid).get();

        if (!bioDoc.exists) return false;

        const bioData = bioDoc.data();

        // Check if profile has picture, bio, and at least 3 links
        const hasProfilePicture = bioData.profilePicture && bioData.profilePicture.trim() !== '';
        const hasBio = bioData.bio && bioData.bio.trim() !== '';
        const hasLinks = bioData.links && bioData.links.length >= 3;

        return hasProfilePicture && hasBio && hasLinks;
    } catch (error) {
        console.error('Error verifying profile completion:', error);
        return false;
    }
}

// Close task modal
function closeTaskModal() {
    taskModal.style.display = 'none';
    currentTask = null;
}

// Set up event listeners
function setupEventListeners() {
    // Close modal when clicking the close button or cancel button
    document.querySelector('.close-modal').addEventListener('click', closeTaskModal);
    document.querySelector('.modal-cancel').addEventListener('click', closeTaskModal);

    // Close modal when clicking outside the modal content
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeTaskModal();
        }
    });

    // Complete task button
    modalCompleteBtn.addEventListener('click', completeTask);
}

// Handle DirectLink ad click
async function handleDirectLinkClick(task) {
    try {
        // Record task completion
        const completionData = {
            taskId: task.id,
            userId: currentUser.uid,
            tokenReward: task.tokenReward || 0, // Ensure tokenReward is always a number
            taskType: 'directlink_ad',
            taskCategory: 'ad',
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await firebase.firestore().collection('taskCompletions').add(completionData);

        // Update user tokens
        const currentTokens = userProfile.tokens || 0;
        const tokenReward = task.tokenReward || 0; // Ensure tokenReward is always a number
        const newTokens = currentTokens + tokenReward;

        await firebase.firestore().collection('users').doc(currentUser.uid).update({
            tokens: newTokens,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Record token transaction
        await firebase.firestore().collection('tokenTransactions').add({
            userId: currentUser.uid,
            type: 'task_reward',
            taskId: task.id,
            taskType: 'directlink_ad',
            amount: tokenReward, // Use the safe tokenReward value
            balanceAfter: newTokens,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update local user profile
        userProfile.tokens = newTokens;
        updateTokenCount();

        // Record DirectLink click for analytics
        await firebase.firestore().collection('directLinkClicks').add({
            userId: currentUser.uid,
            taskId: task.id,
            url: 'https://otieu.com/4/7728924',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Show success message
        alert(`Congratulations! You earned ${tokenReward} tokens for visiting DirectLink.`);

        return true;
    } catch (error) {
        console.error('Error processing DirectLink click:', error);
        throw error;
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', initTasksPage);
