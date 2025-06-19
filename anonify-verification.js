// Anonify Verification Utility
// This file handles verification of Anonify-related tasks

// Initialize Anonify Firebase
const initializeAnonifyFirebase = () => {
    // Check if already initialized
    if (window.anonifyFirebase) {
        return window.anonifyFirebase;
    }

    // Anonify Firebase config
    const anonifyConfig = {
        apiKey: "AIzaSyBWwnKbrvvEGTxdRmk2xalAKuZLEGF98uk",
        authDomain: "mydaily2k-pj.firebaseapp.com",
        projectId: "mydaily2k-pj",
        storageBucket: "mydaily2k-pj.firebasestorage.app",
        messagingSenderId: "1091928974052",
        appId: "1:1091928974052:web:f325fa0ce13111c8a102f1",
        measurementId: "G-T5Z7B4LSFB"
    };

    // Initialize a separate Firebase instance for Anonify
    try {
        // Use a different name to avoid conflicts with the main Firebase instance
        const anonifyApp = firebase.initializeApp(anonifyConfig, "anonify");
        window.anonifyFirebase = {
            app: anonifyApp,
            db: anonifyApp.firestore()
        };
        console.log("Anonify Firebase initialized successfully");
        return window.anonifyFirebase;
    } catch (error) {
        console.error("Error initializing Anonify Firebase:", error);
        // Fallback to main Firebase if secondary initialization fails
        return null;
    }
};

// Verify Anonify user exists
const verifyAnonifyUser = async (username) => {
    try {
        const anonifyFirebase = initializeAnonifyFirebase();
        if (!anonifyFirebase) {
            console.error("Anonify Firebase not initialized");
            return false;
        }

        console.log("Verifying Anonify username:", username);

        // Try multiple possible field names for username
        const possibleFields = ['username', 'userName', 'user_name', 'name', 'displayName'];

        // Try with and without lowercase
        const usernamesToTry = [username, username.toLowerCase()];

        // Try each combination of field name and username format
        for (const field of possibleFields) {
            for (const usernameVariant of usernamesToTry) {
                console.log(`Checking field '${field}' with value '${usernameVariant}'`);

                const userSnapshot = await anonifyFirebase.db.collection('users')
                    .where(field, '==', usernameVariant)
                    .limit(1)
                    .get();

                if (!userSnapshot.empty) {
                    // Store the user ID for subsequent tasks
                    const userId = userSnapshot.docs[0].id;
                    window.anonifyVerifiedUserId = userId;

                    console.log(`Found user with field '${field}' = '${usernameVariant}', ID: ${userId}`);
                    return true;
                }
            }
        }

        // If we get here, we've tried all combinations and found nothing
        console.log("Username not found in any field variation");
        return false;
    } catch (error) {
        console.error("Error verifying Anonify user:", error);
        return false;
    }
};

// Verify user has earned tokens on Anonify
const verifyAnonifyTokens = async (username) => {
    try {
        const anonifyFirebase = initializeAnonifyFirebase();
        if (!anonifyFirebase) {
            console.error("Anonify Firebase not initialized");
            return false;
        }

        // First get the user ID using the same flexible approach as verifyAnonifyUser
        let userId = null;
        let userDoc = null;
        const possibleFields = ['username', 'userName', 'user_name', 'name', 'displayName'];
        const usernamesToTry = [username, username.toLowerCase()];

        // Try each combination of field name and username format
        for (const field of possibleFields) {
            for (const usernameVariant of usernamesToTry) {
                const userSnapshot = await anonifyFirebase.db.collection('users')
                    .where(field, '==', usernameVariant)
                    .limit(1)
                    .get();

                if (!userSnapshot.empty) {
                    userId = userSnapshot.docs[0].id;
                    userDoc = userSnapshot.docs[0];
                    break;
                }
            }
            if (userId) break;
        }

        if (!userId) {
            console.log("User not found for token verification");
            return false;
        }

        // Check the user's balance directly from the user document
        const userData = userDoc.data();
        const userBalance = userData.balance || userData.tokens || 0;

        console.log(`User ${username} (ID: ${userId}) has a balance of ${userBalance} tokens on Anonify`);

        // Store the userId in a global variable for the messages verification
        window.anonifyVerifiedUserId = userId;

        // Require at least 150 tokens in balance
        return userBalance >= 150;
    } catch (error) {
        console.error("Error verifying Anonify tokens:", error);
        return false;
    }
};

// Verify user has received messages on Anonify
const verifyAnonifyMessages = async (username) => {
    try {
        const anonifyFirebase = initializeAnonifyFirebase();
        if (!anonifyFirebase) {
            console.error("Anonify Firebase not initialized");
            return false;
        }

        // Use the userId from the previous verification if available
        let userId = window.anonifyVerifiedUserId;

        // If not available (e.g., if user is verifying this task directly), look it up
        if (!userId) {
            console.log("No verified user ID found, looking up by username");

            // First get the user ID using the same flexible approach as verifyAnonifyUser
            const possibleFields = ['username', 'userName', 'user_name', 'name', 'displayName'];
            const usernamesToTry = [username, username.toLowerCase()];

            // Try each combination of field name and username format
            for (const field of possibleFields) {
                for (const usernameVariant of usernamesToTry) {
                    const userSnapshot = await anonifyFirebase.db.collection('users')
                        .where(field, '==', usernameVariant)
                        .limit(1)
                        .get();

                    if (!userSnapshot.empty) {
                        userId = userSnapshot.docs[0].id;
                        break;
                    }
                }
                if (userId) break;
            }
        }

        if (!userId) {
            console.log("User not found for message verification");
            return false;
        }

        console.log(`Checking messages for user ID: ${userId}`);

        // Check if user has received at least 5 messages in the main messages collection
        // Try different possible field names for recipient ID
        const possibleRecipientFields = ['recipientId', 'recipient_id', 'receiverId', 'receiver_id', 'toUserId', 'to_user_id', 'userId'];
        let messageCount = 0;

        // Try each possible field name for recipient ID
        for (const field of possibleRecipientFields) {
            console.log(`Checking messages collection with field '${field}' = '${userId}'`);

            const messagesSnapshot = await anonifyFirebase.db.collection('messages')
                .where(field, '==', userId)
                .limit(5)
                .get();

            if (!messagesSnapshot.empty) {
                messageCount = messagesSnapshot.size;
                console.log(`Found ${messageCount} messages with field '${field}' = '${userId}'`);
                break;
            }
        }

        // If still no messages found, try one more approach with a direct query
        if (messageCount === 0) {
            console.log("No messages found with field-based queries, trying direct collection query");

            // Get all messages (limited to a reasonable number) and check manually
            const allMessagesSnapshot = await anonifyFirebase.db.collection('messages')
                .limit(100)
                .get();

            if (!allMessagesSnapshot.empty) {
                console.log(`Retrieved ${allMessagesSnapshot.size} messages to check manually`);

                // Check each message for any field that might contain the user ID
                allMessagesSnapshot.forEach(doc => {
                    const messageData = doc.data();
                    const allValues = Object.values(messageData);

                    // Check if any field in the message contains the user ID
                    if (allValues.includes(userId)) {
                        messageCount++;
                        console.log(`Found message with user ID in data: ${doc.id}`);
                    }
                });

                console.log(`Found ${messageCount} messages after manual check`);
            }
        }

        console.log(`Total message count for user ${username} (ID: ${userId}): ${messageCount}`);

        return messageCount >= 5;
    } catch (error) {
        console.error("Error verifying Anonify messages:", error);
        return false;
    }
};

// Check if user has completed all Anonify tasks
const checkAllAnonifyTasksCompleted = async (binkUserId) => {
    try {
        // Get the BINK Firebase instance
        const db = firebase.firestore();

        // Get user's Anonify username from user profile
        const userDoc = await db.collection('users').doc(binkUserId).get();
        if (!userDoc.exists) {
            console.log("User document not found");
            return false;
        }

        const userData = userDoc.data();
        const anonifyUsername = userData.anonifyUsername;

        if (!anonifyUsername) {
            console.log("User has no Anonify username set");
            return false;
        }

        console.log(`Checking if user ${binkUserId} has completed all Anonify tasks`);
        console.log(`User's Anonify username: ${anonifyUsername}`);

        // Create a set of completed task types
        const completedTaskTypes = new Set();

        // Check 1: Check completedTaskTypes field in user document (most reliable source)
        if (userData.completedTaskTypes) {
            Object.keys(userData.completedTaskTypes).forEach(taskType => {
                if (taskType && taskType.startsWith('anonify_') && userData.completedTaskTypes[taskType] === true) {
                    completedTaskTypes.add(taskType);
                    console.log(`Found completed task type in user document: ${taskType}`);
                }
            });
        }

        // Check 2: Check user's completedTasks subcollection
        try {
            const userCompletedTasksSnapshot = await db.collection('users')
                .doc(binkUserId)
                .collection('completedTasks')
                .get();

            userCompletedTasksSnapshot.forEach(doc => {
                const taskType = doc.id; // Document ID is the task type
                if (taskType && taskType.startsWith('anonify_')) {
                    completedTaskTypes.add(taskType);
                    console.log(`Found completed task type in completedTasks collection: ${taskType}`);
                }
            });
        } catch (error) {
            console.error("Error checking user's completedTasks collection:", error);
        }

        // Check 3: Get completed Anonify tasks from taskCompletions collection
        const completionsSnapshot = await db.collection('taskCompletions')
            .where('userId', '==', binkUserId)
            .where('taskCategory', '==', 'anonify')
            .get();

        completionsSnapshot.forEach(doc => {
            const taskType = doc.data().taskType;
            if (taskType) {
                completedTaskTypes.add(taskType);
                console.log(`Found completed task type in taskCompletions: ${taskType}`);
            }
        });

        // Check if all three Anonify tasks are completed
        const requiredTasks = ['anonify_signup', 'anonify_earn_tokens', 'anonify_messages'];
        const allCompleted = requiredTasks.every(task => {
            const isCompleted = completedTaskTypes.has(task);
            console.log(`Task ${task} completed: ${isCompleted}`);
            return isCompleted;
        });

        console.log(`All required tasks completed: ${allCompleted}`);

        // If not all tasks are completed, let's verify them directly
        if (!allCompleted) {
            console.log("Not all tasks are completed according to database. Verifying directly...");

            // Check if signup task is completed
            if (!completedTaskTypes.has('anonify_signup')) {
                console.log("Signup task not marked as completed, but we have a username, so it should be completed");
                // If we have a username, the signup task should be considered completed
                completedTaskTypes.add('anonify_signup');
            }

            // Verify tokens task directly
            if (!completedTaskTypes.has('anonify_earn_tokens')) {
                console.log("Tokens task not marked as completed, verifying directly...");
                const tokensVerified = await verifyAnonifyTokens(anonifyUsername);
                if (tokensVerified) {
                    console.log("Tokens task verified directly");
                    completedTaskTypes.add('anonify_earn_tokens');
                }
            }

            // Verify messages task directly
            if (!completedTaskTypes.has('anonify_messages')) {
                console.log("Messages task not marked as completed, verifying directly...");
                const messagesVerified = await verifyAnonifyMessages(anonifyUsername);
                if (messagesVerified) {
                    console.log("Messages task verified directly");
                    completedTaskTypes.add('anonify_messages');
                }
            }

            // Check again if all tasks are completed after direct verification
            const allCompletedAfterVerification = requiredTasks.every(task => {
                const isCompleted = completedTaskTypes.has(task);
                console.log(`Task ${task} completed after verification: ${isCompleted}`);
                return isCompleted;
            });

            console.log(`All required tasks completed after verification: ${allCompletedAfterVerification}`);

            // If all tasks are now verified as completed, update the user document
            if (allCompletedAfterVerification) {
                console.log("All tasks verified as completed, updating user document...");

                // Update the completedTaskTypes in the user document
                const updatedCompletedTaskTypes = userData.completedTaskTypes || {};
                requiredTasks.forEach(taskType => {
                    updatedCompletedTaskTypes[taskType] = true;
                });

                await db.collection('users').doc(binkUserId).update({
                    completedTaskTypes: updatedCompletedTaskTypes,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                console.log("User document updated with all completed tasks");
            }

            // Return the result after verification
            return allCompletedAfterVerification;
        }

        // If all tasks are completed but bonus not yet awarded, award the bonus
        if (allCompleted) {
            // Check if bonus already awarded
            const bonusSnapshot = await db.collection('taskCompletions')
                .where('userId', '==', binkUserId)
                .where('taskType', '==', 'anonify_all_completed')
                .limit(1)
                .get();

            if (bonusSnapshot.empty) {
                console.log("All tasks completed but bonus not yet awarded, awarding bonus...");
                // Award bonus tokens
                await awardAnonifyCompletionBonus(binkUserId);
            } else {
                console.log("Bonus already awarded");
            }
        }

        return allCompleted;
    } catch (error) {
        console.error("Error checking Anonify tasks completion:", error);
        return false;
    }
};

// Award bonus tokens for completing all Anonify tasks
const awardAnonifyCompletionBonus = async (userId) => {
    try {
        // Get the BINK Firebase instance
        const db = firebase.firestore();

        // Get current user tokens
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        const currentTokens = userData.tokens || 0;
        const bonusTokens = 200; // Bonus for completing all tasks
        const newTokens = currentTokens + bonusTokens;

        console.log(`Awarding ${bonusTokens} bonus tokens to user ${userId}`);
        console.log(`Current tokens: ${currentTokens}, New tokens: ${newTokens}`);

        // Create or update completedTaskTypes object
        const completedTaskTypes = userData.completedTaskTypes || {};
        completedTaskTypes['anonify_signup'] = true;
        completedTaskTypes['anonify_earn_tokens'] = true;
        completedTaskTypes['anonify_messages'] = true;
        completedTaskTypes['anonify_all_completed'] = true;

        // Update user tokens and store completed task types
        await db.collection('users').doc(userId).update({
            tokens: newTokens,
            completedTaskTypes: completedTaskTypes,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log("User document updated with tokens and completed task types");

        // Also save to user's completedTasks subcollection
        await db.collection('users').doc(userId)
            .collection('completedTasks').doc('anonify_all_completed').set({
                taskType: 'anonify_all_completed',
                taskCategory: 'anonify',
                tokenReward: bonusTokens,
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        console.log("Task completion saved to user's completedTasks collection");

        // Record token transaction
        await db.collection('tokenTransactions').add({
            userId: userId,
            type: 'task_reward',
            taskType: 'anonify_all_completed',
            amount: bonusTokens,
            balanceAfter: newTokens,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log("Token transaction recorded");

        // Record task completion in main taskCompletions collection
        await db.collection('taskCompletions').add({
            userId: userId,
            taskId: 'anonify_all_completed_task',
            taskType: 'anonify_all_completed',
            taskCategory: 'anonify',
            tokenReward: bonusTokens,
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log("Task completion recorded in taskCompletions collection");
        console.log(`Successfully awarded ${bonusTokens} bonus tokens to user ${userId} for completing all Anonify tasks`);
        return true;
    } catch (error) {
        console.error("Error awarding Anonify completion bonus:", error);
        return false;
    }
};

// Save Anonify username to user profile
const saveAnonifyUsername = async (binkUserId, anonifyUsername) => {
    try {
        // Get the BINK Firebase instance
        const db = firebase.firestore();

        // Update user profile with Anonify username and mark task as completed
        await db.collection('users').doc(binkUserId).update({
            anonifyUsername: anonifyUsername,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            // Mark the signup task as completed in the user document
            'completedTaskTypes.anonify_signup': true
        });

        // Also save to user's completedTasks subcollection
        await db.collection('users').doc(binkUserId)
            .collection('completedTasks').doc('anonify_signup').set({
                taskType: 'anonify_signup',
                taskCategory: 'anonify',
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        return true;
    } catch (error) {
        console.error("Error saving Anonify username:", error);
        return false;
    }
};



// Export functions
window.BINK = window.BINK || {};
window.BINK.anonifyVerification = {
    verifyAnonifyUser,
    verifyAnonifyTokens,
    verifyAnonifyMessages,
    checkAllAnonifyTasksCompleted,
    saveAnonifyUsername
};
