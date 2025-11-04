# Firebase Points System Setup Guide

This guide explains how the points system is integrated with Firebase Authentication and Firestore.

## Overview

The points system ties each user's point balance to their Firebase Authentication account. Points are stored in a `vendors` collection in Firestore, where each document corresponds to a user's UID.

## Database Structure

### Collection: `vendors`

Each document in the `vendors` collection uses the Firebase Auth User UID as the document ID.

**Document Structure:**
```javascript
{
  userId: "firebase-auth-uid",
  email: "user@example.com",
  points: 1000,  // Current point balance
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## How It Works

### 1. User Authentication
- When a user logs in, their Firebase Auth UID is used to identify their vendor account
- The system automatically creates a vendor document if one doesn't exist

### 2. Points Initialization
- When a user first logs in, a vendor document is created with `points: 0`
- The document is created automatically when needed

### 3. Points Updates
- **PayTap Payments**: When a customer pays using PayTap, points are added to the vendor's account
  - Default: 1 peso = 1 point (you can adjust this in `Menu.jsx`)
- Points are updated atomically using Firestore's `increment()` function to prevent race conditions

### 4. Points Display
- The Header component fetches and displays the current user's points
- Points are updated in real-time when the user logs in

## Firestore Security Rules

You'll need to set up Firestore security rules to protect the `vendors` collection. Add these rules in your Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Vendors collection - users can only read/write their own document
    match /vendors/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Your other collections...
  }
}
```

## Customization

### Changing Point Conversion Rate

In `paytap-pos/src/pages/Menu.jsx`, you can modify how points are calculated:

```javascript
// Current: 1 peso = 1 point
const pointsToAdd = Math.floor(amount);

// Example: 1 peso = 2 points
const pointsToAdd = Math.floor(amount * 2);

// Example: 100 pesos = 1 point
const pointsToAdd = Math.floor(amount / 100);
```

### Initial Points

To give new vendors initial points, modify `paytap-pos/src/firebase/pointsService.js`:

```javascript
await setDoc(vendorDocRef, {
  userId: userId,
  email: userEmail || '',
  points: 100, // Change from 0 to your desired initial points
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});
```

## Testing

1. **Create a test user** in Firebase Authentication
2. **Log in** with that user
3. **Check Firestore** - a document should be created in `vendors` collection with the user's UID
4. **Place an order** with PayTap payment
5. **Check points** - should increase in the Header and in Firestore

## Troubleshooting

### Points not updating
- Check browser console for errors
- Verify Firestore security rules allow write access
- Ensure user is authenticated (`getCurrentUser()` returns a user)

### Points not displaying
- Check that `initializeVendor()` is called on login
- Verify the `vendors` collection exists in Firestore
- Check browser console for fetch errors

### Points reset to 0
- Check if vendor document exists in Firestore
- Verify the document ID matches the user's UID
- Check Firestore security rules

## API Reference

### `initializeVendor(userId, userEmail)`
Creates a new vendor document if it doesn't exist.

### `getVendorPoints(userId)`
Retrieves the current points balance for a user.

### `addPoints(userId, pointsToAdd)`
Adds points to a user's account (atomic operation).

### `subtractPoints(userId, pointsToSubtract)`
Subtracts points from a user's account (atomic operation).

### `setPoints(userId, newPoints)`
Sets points to a specific value (use with caution).

