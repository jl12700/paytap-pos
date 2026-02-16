# Firebase Authentication Setup Guide

## Step 1: Enable Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Authentication** in the left sidebar
4. Click **Get Started** (if you haven't enabled it yet)
5. Click on the **Sign-in method** tab

## Step 2: Enable Email/Password Authentication

1. In the Sign-in providers list, find **Email/Password**
2. Click on **Email/Password**
3. Toggle **Enable** to ON
4. Click **Save**

## Step 3: Add Users (Two Methods)

### Method 1: Add Users via Firebase Console (Recommended for Initial Setup)

1. Go to **Authentication** → **Users** tab
2. Click **Add user**
3. Enter:
   - **Email**: user@example.com
   - **Password**: (minimum 6 characters)
4. Click **Add user**

### Method 2: Let Users Sign Up via Your App

The app includes sign-up functionality. Users can create accounts directly through the sign-in page.

## Step 4: Verify Your Environment Variables

Make sure your `.env` file includes:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Step 5: Test Authentication

1. Start your development server
2. Navigate to `/auth`
3. Sign in with the credentials you created

## Important Notes

- **Email format**: Firebase uses email addresses as usernames
- **Password requirements**: Minimum 6 characters
- **User management**: You can manage users in Firebase Console → Authentication → Users
- **Security**: Make sure your Firebase rules are properly configured

## Troubleshooting

### Common Issues:

1. **"An error occurred. Please try again."**
   - Open your browser's Developer Console (F12) and check for error messages
   - Look for the actual Firebase error code (e.g., `auth/invalid-credential`)
   - Verify that Email/Password authentication is enabled in Firebase Console

2. **"auth/invalid-email"**: Check that the email format is correct (must be a valid email)

3. **"auth/user-not-found"**: User doesn't exist. Create the user first in Firebase Console

4. **"auth/wrong-password"** or **"auth/invalid-credential"**: 
   - Incorrect password entered
   - Double-check the password in Firebase Console
   - Make sure there are no extra spaces

5. **"auth/operation-not-allowed"**: 
   - Email/Password authentication is NOT enabled
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Email/Password provider

6. **"auth/network-request-failed"**: 
   - Check your internet connection
   - Verify Firebase project settings
   - Check if Firebase API is accessible

7. **"auth/invalid-api-key"** or **"auth/app-not-authorized"**:
   - Check your `.env` file has correct Firebase credentials
   - Make sure you've restarted the dev server after adding `.env`
   - Verify the API key matches your Firebase project

### Debugging Steps:

1. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for error messages when signing in
   - The error will show the actual Firebase error code

2. **Verify User Exists**:
   - Go to Firebase Console → Authentication → Users
   - Confirm the user email is listed
   - Check if the user is enabled (not disabled)

3. **Verify Authentication is Enabled**:
   - Go to Firebase Console → Authentication → Sign-in method
   - Email/Password should be enabled (toggle ON)
   - Click on Email/Password to verify it's active

