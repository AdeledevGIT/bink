// Admin Tasks JavaScript
// This file handles the admin tasks page functionality

// Global variables
let currentUser = null;
// Using db and auth from firebase-config.js
let tasks = [];
let currentFilter = 'all';
let isEditing = false;

// DOM Elements
const tasksTableBody = document.getElementById('tasks-table-body');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const modalTitle = document.getElementById('modal-title');
const taskIdInput = document.getElementById('task-id');
const taskTitleInput = document.getElementById('task-title');
const taskShortDescriptionInput = document.getElementById('task-short-description');
const taskDescriptionInput = document.getElementById('task-description');
const taskLinkInput = document.getElementById('task-link');
const taskInstructionsInput = document.getElementById('task-instructions');
const taskRewardInput = document.getElementById('task-reward');
const taskRepeatableInput = document.getElementById('task-repeatable');
const repeatFrequencyField = document.getElementById('repeat-frequency-field');
const repeatFrequencyInput = document.getElementById('repeat-frequency');
const taskActiveInput = document.getElementById('task-active');

// Stats elements
const totalTasksElement = document.getElementById('total-tasks');
const activeTasksElement = document.getElementById('active-tasks');
const totalCompletionsElement = document.getElementById('total-completions');
const tokensAwardedElement = document.getElementById('tokens-awarded');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAdmin);

// Initialize admin page
function initializeAdmin() {
    // Check if Firebase is initialized
    if (firebase && db && auth) {
        // Check authentication
        auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                checkAdminAccess();
            } else {
                // Redirect to login if not authenticated
                window.location.href = 'login.html';
            }
        });
    } else {
        console.error('Firebase not initialized');
        alert('Firebase not initialized. Please refresh the page and try again.');
    }

    // Add event listeners
    document.getElementById('add-task-button').addEventListener('click', openAddTaskModal);
    document.getElementById('refresh-button').addEventListener('click', loadTasks);

    // Add filter button event listeners
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active filter
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            renderTasks();
        });
    });

    // Add modal close event listeners
    document.querySelector('.close-modal').addEventListener('click', closeTaskModal);
    document.querySelector('.form-cancel').addEventListener('click', closeTaskModal);

    // Add form submit event listener
    taskForm.addEventListener('submit', handleTaskFormSubmit);

    // Add conditional field event listeners
    taskRepeatableInput.addEventListener('change', toggleConditionalFields);
}

// Check if user has admin access
function checkAdminAccess() {
    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            if (doc.exists && doc.data().isAdmin) {
                // User is admin, load tasks
                loadTasks();
                loadStats();
            } else {
                // User is not admin, redirect to dashboard
                alert('You do not have admin access.');
                window.location.href = 'dashboard.html';
            }
        })
        .catch((error) => {
            console.error('Error checking admin access:', error);
            alert('Error checking admin access. Please try again.');
        });
}

// Load tasks from Firestore
function loadTasks() {
    // Show loading state
    tasksTableBody.innerHTML = '<tr><td colspan="6" class="loading-text">Loading tasks...</td></tr>';

    // Get tasks from Firestore
    db.collection('tasks')
        .orderBy('createdAt', 'desc')
        .get()
        .then((snapshot) => {
            tasks = [];
            snapshot.forEach((doc) => {
                const task = doc.data();
                task.id = doc.id;
                tasks.push(task);
            });

            // Render tasks
            renderTasks();
        })
        .catch((error) => {
            console.error('Error loading tasks:', error);
            tasksTableBody.innerHTML = '<tr><td colspan="6" class="error-text">Error loading tasks. Please try again.</td></tr>';
        });
}

// Load task statistics
function loadStats() {
    // Get total tasks
    db.collection('tasks').get()
        .then((snapshot) => {
            totalTasksElement.textContent = snapshot.size;
        });

    // Get active tasks
    db.collection('tasks').where('isActive', '==', true).get()
        .then((snapshot) => {
            activeTasksElement.textContent = snapshot.size;
        });

    // Get total completions
    db.collection('taskCompletions').get()
        .then((snapshot) => {
            totalCompletionsElement.textContent = snapshot.size;
        });

    // Get total tokens awarded
    db.collection('taskCompletions').get()
        .then((snapshot) => {
            let totalTokens = 0;
            snapshot.forEach((doc) => {
                totalTokens += doc.data().tokenReward || 0;
            });
            tokensAwardedElement.textContent = totalTokens;
        });
}

// Render tasks in the table
function renderTasks() {
    if (tasks.length === 0) {
        tasksTableBody.innerHTML = '<tr><td colspan="6" class="no-data">No tasks found</td></tr>';
        return;
    }

    // Filter tasks based on current filter
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(task => task.isActive);
    } else if (currentFilter === 'inactive') {
        filteredTasks = tasks.filter(task => !task.isActive);
    }

    if (filteredTasks.length === 0) {
        tasksTableBody.innerHTML = '<tr><td colspan="6" class="no-data">No tasks match the current filter</td></tr>';
        return;
    }

    // Create table rows
    let html = '';
    filteredTasks.forEach((task) => {
        html += `
            <tr>
                <td>${task.title}</td>
                <td>${task.tokenReward}</td>
                <td>${task.isRepeatable ? 'Yes' : 'No'}</td>
                <td>
                    <span class="task-status ${task.isActive ? 'status-active' : 'status-inactive'}">
                        ${task.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-button edit-button" data-task-id="${task.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-button toggle-button" data-task-id="${task.id}" data-active="${task.isActive}">
                            <i class="fas ${task.isActive ? 'fa-toggle-off' : 'fa-toggle-on'}"></i> ${task.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="action-button delete-button" data-task-id="${task.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tasksTableBody.innerHTML = html;

    // Add event listeners to action buttons
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', () => {
            const taskId = button.getAttribute('data-task-id');
            openEditTaskModal(taskId);
        });
    });

    document.querySelectorAll('.toggle-button').forEach(button => {
        button.addEventListener('click', () => {
            const taskId = button.getAttribute('data-task-id');
            const isActive = button.getAttribute('data-active') === 'true';
            toggleTaskStatus(taskId, isActive);
        });
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', () => {
            const taskId = button.getAttribute('data-task-id');
            deleteTask(taskId);
        });
    });
}



// Open add task modal
function openAddTaskModal() {
    isEditing = false;
    modalTitle.textContent = 'Add New Task';
    taskForm.reset();
    taskIdInput.value = '';
    taskActiveInput.checked = true;
    toggleConditionalFields();
    taskModal.style.display = 'flex';
}

// Open edit task modal
function openEditTaskModal(taskId) {
    isEditing = true;
    modalTitle.textContent = 'Edit Task';

    // Find task
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Fill form with task data
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskShortDescriptionInput.value = task.shortDescription || '';
    taskDescriptionInput.value = task.description;
    taskLinkInput.value = task.taskLink || '';
    taskInstructionsInput.value = task.instructions || '';
    taskRewardInput.value = task.tokenReward;
    taskRepeatableInput.checked = task.isRepeatable;
    repeatFrequencyInput.value = task.repeatFrequency || '';
    taskActiveInput.checked = task.isActive;

    // Show/hide conditional fields
    toggleConditionalFields();

    // Show modal
    taskModal.style.display = 'flex';
}

// Toggle conditional form fields
function toggleConditionalFields() {
    // Show/hide repeat frequency field
    if (taskRepeatableInput.checked) {
        repeatFrequencyField.classList.add('show');
    } else {
        repeatFrequencyField.classList.remove('show');
    }
}

// Handle task form submit
function handleTaskFormSubmit(e) {
    e.preventDefault();

    // Get form data
    const taskData = {
        title: taskTitleInput.value,
        shortDescription: taskShortDescriptionInput.value,
        description: taskDescriptionInput.value,
        taskLink: taskLinkInput.value,
        instructions: taskInstructionsInput.value,
        tokenReward: parseInt(taskRewardInput.value) || 0, // Ensure tokenReward is always a number
        isRepeatable: taskRepeatableInput.checked,
        isActive: taskActiveInput.checked,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Add conditional fields
    if (taskData.isRepeatable && repeatFrequencyInput.value) {
        taskData.repeatFrequency = repeatFrequencyInput.value;
    }

    // Add or update task
    if (isEditing) {
        // Update existing task
        const taskId = taskIdInput.value;
        db.collection('tasks').doc(taskId).update(taskData)
            .then(() => {
                alert('Task updated successfully!');
                closeTaskModal();
                loadTasks();
                loadStats();
            })
            .catch((error) => {
                console.error('Error updating task:', error);
                alert('Error updating task. Please try again.');
            });
    } else {
        // Add new task
        taskData.createdAt = firebase.firestore.FieldValue.serverTimestamp();

        db.collection('tasks').add(taskData)
            .then(() => {
                alert('Task added successfully!');
                closeTaskModal();
                loadTasks();
                loadStats();
            })
            .catch((error) => {
                console.error('Error adding task:', error);
                alert('Error adding task. Please try again.');
            });
    }
}

// Toggle task active status
function toggleTaskStatus(taskId, currentStatus) {
    // Confirm action
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this task?`)) {
        return;
    }

    // Update task status
    db.collection('tasks').doc(taskId).update({
        isActive: !currentStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert(`Task ${action}d successfully!`);
        loadTasks();
        loadStats();
    })
    .catch((error) => {
        console.error(`Error ${action}ing task:`, error);
        alert(`Error ${action}ing task. Please try again.`);
    });
}

// Delete task
function deleteTask(taskId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
        return;
    }

    // Delete task
    db.collection('tasks').doc(taskId).delete()
        .then(() => {
            alert('Task deleted successfully!');
            loadTasks();
            loadStats();
        })
        .catch((error) => {
            console.error('Error deleting task:', error);
            alert('Error deleting task. Please try again.');
        });
}

// Close task modal
function closeTaskModal() {
    taskModal.style.display = 'none';
}
