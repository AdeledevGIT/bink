<?php
/**
 * Paystack Webhook Handler for BINK
 *
 * This script handles webhook events from Paystack to automatically
 * process payments and update user subscriptions.
 */

// Set headers
header('Content-Type: application/json');

// Paystack settings
$paystackSecretKey = 'sk_live_02edcbcdb3317e6385d9b4163faa76584ccfc01d'; // Your Paystack secret key
// Paystack uses the secret key to sign webhooks, so we'll use that as the webhook secret
$webhookSecret = $paystackSecretKey; // Use the secret key for webhook verification

// IMPORTANT: When going live, replace the test keys with your live keys
// $paystackSecretKey = 'sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// Firebase settings
// Get these values from your Firebase project settings
$firebaseApiKey = 'AIzaSyCC0cGcsdiMmeTYp2gNCjpO_XrJFE4Uj-g'; 
$firebaseProjectId = 'trustpay-d9d40'; 

// IMPORTANT: For security, consider storing these values in environment variables
// rather than hardcoding them in the file

// Verify Paystack webhook signature
function verifyWebhookSignature($payload, $signature, $secret) {
    // Get expected signature
    $expectedSignature = hash_hmac('sha512', $payload, $secret);

    // Compare signatures
    return hash_equals($expectedSignature, $signature);
}

// Log webhook event
function logWebhookEvent($event, $data) {
    $logFile = 'paystack_webhook.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[{$timestamp}] {$event}: " . json_encode($data) . PHP_EOL;

    // Append to log file
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

// Get Firebase ID token (for server-to-server authentication)
function getFirebaseIdToken($apiKey) {
    // In a real implementation, you would use a service account key file
    // and the Firebase Admin SDK to authenticate with Firebase

    // For demonstration purposes, we'll return a placeholder
    // In production, you should:
    // 1. Use a service account key file
    // 2. Use the Firebase Admin SDK to generate a token
    // 3. Use that token to authenticate with Firebase

    // Log the attempt to get a token
    logWebhookEvent('auth', [
        'message' => 'Attempting to get Firebase ID token',
        'apiKey' => substr($apiKey, 0, 5) . '...' // Only log part of the key for security
    ]);

    return 'firebase-id-token';
}

// Update Firebase data
function updateFirebase($projectId, $idToken, $collection, $document, $data) {
    // Firebase REST API endpoint
    $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/{$collection}/{$document}";

    // Convert data to Firestore format
    $firestoreData = [
        'fields' => []
    ];

    foreach ($data as $key => $value) {
        if (is_string($value)) {
            $firestoreData['fields'][$key] = ['stringValue' => $value];
        } elseif (is_int($value)) {
            $firestoreData['fields'][$key] = ['integerValue' => $value];
        } elseif (is_float($value)) {
            $firestoreData['fields'][$key] = ['doubleValue' => $value];
        } elseif (is_bool($value)) {
            $firestoreData['fields'][$key] = ['booleanValue' => $value];
        } elseif (is_array($value)) {
            $firestoreData['fields'][$key] = ['arrayValue' => ['values' => $value]];
        } elseif (is_null($value)) {
            $firestoreData['fields'][$key] = ['nullValue' => null];
        }
    }

    // Set up cURL request
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($firestoreData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $idToken
    ]);

    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Return success or failure
    return $httpCode >= 200 && $httpCode < 300;
}

// Process charge.success event
function processChargeSuccess($data) {
    global $firebaseApiKey, $firebaseProjectId;

    // Get payment reference
    $reference = $data['reference'];

    // Get metadata
    $metadata = $data['metadata'] ?? [];

    // Get Firebase ID token
    $idToken = getFirebaseIdToken($firebaseApiKey);

    // Find payment in Firebase
    // In a real implementation, you would query Firestore to find the payment
    // For demonstration purposes, we'll assume we know the payment ID

    // Update payment status
    $paymentData = [
        'status' => 'completed',
        'paystackResponse' => json_encode($data),
        'completedAt' => date('c'),
        'updatedAt' => date('c')
    ];

    // Update payment in Firebase
    $paymentUpdated = updateFirebase(
        $firebaseProjectId,
        $idToken,
        'payments',
        $reference, // Using reference as document ID for simplicity
        $paymentData
    );

    // Process based on payment type
    if (isset($metadata['token_amount'])) {
        // Token purchase
        processTokenPurchase($data, $metadata, $idToken);
    } else {
        // Subscription payment
        processSubscription($data, $metadata, $idToken);
    }

    return $paymentUpdated;
}

// Process token purchase
function processTokenPurchase($data, $metadata, $idToken) {
    global $firebaseProjectId;

    // Get user ID and token amount
    $userId = $metadata['user_id'] ?? null;
    $tokenAmount = (int)($metadata['token_amount'] ?? 0);
    $isFirstPurchase = $metadata['is_first_purchase'] ?? false;
    $purchaseRequestId = $metadata['purchase_request_id'] ?? null;

    if (!$userId || !$tokenAmount || !$purchaseRequestId) {
        logWebhookEvent('error', [
            'message' => 'Missing required metadata for token purchase',
            'metadata' => $metadata
        ]);
        return false;
    }

    logWebhookEvent('token_purchase', [
        'userId' => $userId,
        'tokenAmount' => $tokenAmount,
        'isFirstPurchase' => $isFirstPurchase,
        'purchaseRequestId' => $purchaseRequestId
    ]);

    // Calculate bonus tokens
    $bonusTokens = $isFirstPurchase ? 200 : 0;

    // First, get the user's current token balance
    // In a real implementation, you would query Firestore to get the user's current token balance
    // For demonstration purposes, we'll assume the user has 0 tokens
    $currentTokens = 0;
    $totalTokens = $currentTokens + $tokenAmount + $bonusTokens;

    logWebhookEvent('token_calculation', [
        'currentTokens' => $currentTokens,
        'purchasedTokens' => $tokenAmount,
        'bonusTokens' => $bonusTokens,
        'totalTokens' => $totalTokens
    ]);

    // Update token purchase request
    $requestData = [
        'status' => 'approved',
        'paystackReference' => $data['reference'],
        'approvedAt' => date('c'),
        'updatedAt' => date('c')
    ];

    $requestUpdated = updateFirebase(
        $firebaseProjectId,
        $idToken,
        'tokenPurchaseRequests',
        $purchaseRequestId,
        $requestData
    );

    if (!$requestUpdated) {
        logWebhookEvent('error', [
            'message' => 'Failed to update token purchase request',
            'purchaseRequestId' => $purchaseRequestId
        ]);
    } else {
        logWebhookEvent('info', [
            'message' => 'Token purchase request updated successfully',
            'purchaseRequestId' => $purchaseRequestId
        ]);
    }

    // Update user tokens
    $userData = [
        'tokens' => $totalTokens,
        'hasPurchasedTokens' => true,
        'lastTokenPurchase' => [
            'amount' => $tokenAmount,
            'bonus' => $bonusTokens,
            'date' => date('c'),
            'reference' => $data['reference']
        ],
        'updatedAt' => date('c')
    ];

    $userUpdated = updateFirebase(
        $firebaseProjectId,
        $idToken,
        'users',
        $userId,
        $userData
    );

    if (!$userUpdated) {
        logWebhookEvent('error', [
            'message' => 'Failed to update user tokens',
            'userId' => $userId
        ]);
        return false;
    }

    logWebhookEvent('info', [
        'message' => 'User tokens updated successfully',
        'userId' => $userId,
        'totalTokens' => $totalTokens
    ]);

    // Create a token transaction record
    $transactionData = [
        'userId' => $userId,
        'type' => 'purchase',
        'amount' => $tokenAmount,
        'bonus' => $bonusTokens,
        'reference' => $data['reference'],
        'balanceAfter' => $totalTokens,
        'createdAt' => date('c')
    ];

    $transactionCreated = updateFirebase(
        $firebaseProjectId,
        $idToken,
        'tokenTransactions',
        uniqid('trx_'),
        $transactionData
    );

    if (!$transactionCreated) {
        logWebhookEvent('warning', [
            'message' => 'Failed to create token transaction record',
            'userId' => $userId
        ]);
        // Continue anyway since the tokens were already added
    }

    return $userUpdated;
}

// Process subscription
function processSubscription($data, $metadata, $idToken) {
    global $firebaseProjectId;

    // Get user ID, plan, and duration
    $userId = $metadata['user_id'] ?? null;
    $plan = $metadata['plan_type'] ?? 'premium';
    $duration = $metadata['plan_duration'] ?? 'monthly';

    if (!$userId) {
        logWebhookEvent('error', [
            'message' => 'Missing user ID for subscription',
            'metadata' => $metadata
        ]);
        return false;
    }

    logWebhookEvent('subscription', [
        'userId' => $userId,
        'plan' => $plan,
        'duration' => $duration
    ]);

    // Calculate expiration date and duration text
    $expirationDate = new DateTime();
    $durationText = '';

    switch ($duration) {
        case 'monthly':
            $expirationDate->modify('+1 month');
            $durationText = '1 Month';
            break;
        case 'yearly':
            $expirationDate->modify('+1 year');
            $durationText = '1 Year';
            break;
        case 'quarterly':
            $expirationDate->modify('+3 months');
            $durationText = '3 Months';
            break;
        case 'lifetime':
            $expirationDate->modify('+100 years');
            $durationText = 'Lifetime';
            break;
        default:
            $expirationDate->modify('+1 month');
            $durationText = '1 Month';
    }

    logWebhookEvent('subscription_details', [
        'plan' => $plan,
        'duration' => $duration,
        'expirationDate' => $expirationDate->format('c')
    ]);

    // Get current user data to check previous subscription
    // In a real implementation, you would query Firestore to get the user's current subscription
    // For demonstration purposes, we'll assume the user has no subscription
    $previousTier = 'free';
    $isUpgrade = $previousTier === 'free' ||
        ($previousTier === 'premium' && $plan === 'creator');

    logWebhookEvent('subscription_change', [
        'previousTier' => $previousTier,
        'newTier' => $plan,
        'isUpgrade' => $isUpgrade
    ]);

    // Update user subscription
    $userData = [
        'subscriptionTier' => $plan,
        'subscriptionStart' => date('c'),
        'subscriptionExpiration' => $expirationDate->format('c'),
        'subscriptionDuration' => $duration,
        'subscriptionDurationText' => $durationText,
        'lastPaymentReference' => $data['reference'],
        'previousSubscriptionTier' => $previousTier,
        'updatedAt' => date('c')
    ];

    $userUpdated = updateFirebase(
        $firebaseProjectId,
        $idToken,
        'users',
        $userId,
        $userData
    );

    if (!$userUpdated) {
        logWebhookEvent('error', [
            'message' => 'Failed to update user subscription',
            'userId' => $userId
        ]);
        return false;
    }

    logWebhookEvent('info', [
        'message' => 'User subscription updated successfully',
        'userId' => $userId,
        'plan' => $plan,
        'duration' => $duration
    ]);

    // Create a subscription history record
    $historyData = [
        'userId' => $userId,
        'plan' => $plan,
        'duration' => $duration,
        'durationText' => $durationText,
        'startDate' => date('c'),
        'expirationDate' => $expirationDate->format('c'),
        'reference' => $data['reference'],
        'amount' => $data['amount'] / 100, // Convert from kobo to naira
        'currency' => $data['currency'] ?? 'NGN',
        'createdAt' => date('c')
    ];

    $historyCreated = updateFirebase(
        $firebaseProjectId,
        $idToken,
        'subscriptionHistory',
        uniqid('sub_'),
        $historyData
    );

    if (!$historyCreated) {
        logWebhookEvent('warning', [
            'message' => 'Failed to create subscription history record',
            'userId' => $userId
        ]);
        // Continue anyway since the subscription was already updated
    }

    return $userUpdated;
}

// Main webhook handler
try {
    // Get payload and signature
    $payload = file_get_contents('php://input');
    $signature = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';

    // Verify signature
    if (!verifyWebhookSignature($payload, $signature, $webhookSecret)) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Invalid signature']);
        exit;
    }

    // Parse payload
    $data = json_decode($payload, true);

    // Check if payload is valid
    if (!$data || !isset($data['event'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid payload']);
        exit;
    }

    // Log webhook event
    logWebhookEvent($data['event'], $data['data']);

    // Process based on event type
    switch ($data['event']) {
        case 'charge.success':
            $success = processChargeSuccess($data['data']);
            break;
        default:
            // Ignore other events
            $success = true;
    }

    // Return response
    if ($success) {
        http_response_code(200);
        echo json_encode(['status' => 'success']);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to process webhook']);
    }
} catch (Exception $e) {
    // Log error
    logWebhookEvent('error', [
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);

    // Return error response
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Internal server error']);
}
