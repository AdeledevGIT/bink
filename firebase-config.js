// IMPORTANT: Make sure you have included the Firebase SDKs in your HTML files
// (e.g., <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js"></script>)

const firebaseConfig = {
  apiKey: "AIzaSyCC0cGcsdiMmeTYp2gNCjpO_XrJFE4Uj-g",
  authDomain: "trustpay-d9d40.firebaseapp.com",
  projectId: "trustpay-d9d40",
  storageBucket: "trustpay-d9d40.appspot.com",
  messagingSenderId: "835444953806",
  appId: "1:835444953806:web:9231281cd19c075b7a769f",
  measurementId: "G-5LRE3395RT"
};

// Initialize Firebase
// Check if Firebase is already initialized to avoid errors
let app;
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app(); // if already initialized, use that instance
}


// Get Firebase services (make sure the SDKs are included in HTML)
const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;
// Check if firebase.storage is a function before calling it
const storage = typeof firebase !== 'undefined' && typeof firebase.storage === 'function' ? firebase.storage() : null;

// Helper function to display errors
function displayError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        console.error("Error element not found:", elementId);
        alert(message); // Fallback
    }
}

// Helper function to clear errors
function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}