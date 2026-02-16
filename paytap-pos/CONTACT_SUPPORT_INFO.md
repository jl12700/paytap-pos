# Contact Support System - Information Sent to Admin

## Overview
When a user submits a support ticket through the Contact Support page, the following information is automatically collected and sent to the admin database (Firestore collection: `supportTickets`).

## Information Automatically Sent

### Required User Information
1. **userId** (string)
   - Firebase Authentication User ID (UID)
   - Unique identifier for the user submitting the ticket
   - Example: `"abc123xyz789"`

2. **userEmail** (string)
   - Email address of the logged-in user
   - Retrieved from Firebase Auth
   - Example: `"vendor@example.com"`

3. **vendorName** (string)
   - Display name for the vendor (typically the email)
   - Example: `"vendor@example.com"`

4. **timestamp** (string)
   - ISO 8601 formatted timestamp of when the ticket was created
   - Example: `"2024-01-15T10:30:00.000Z"`

### User-Provided Information
5. **subject** (string)
   - Subject/title of the support ticket
   - Required field entered by the user
   - Example: `"Payment processing issue"`

6. **category** (string)
   - Category of the support request
   - Selected from predefined options:
     - `"technical"` - Technical Issue
     - `"payment"` - Payment Issue
     - `"account"` - Account Issue
     - `"feature"` - Feature Request
     - `"bug"` - Bug Report
     - `"other"` - Other

7. **status** (string)
   - Current status of the ticket
   - Default: `"pending"`
   - Options:
     - `"pending"` - Pending
     - `"in-progress"` - In Progress
     - `"resolved"` - Resolved
     - `"closed"` - Closed

8. **details** (string)
   - Detailed description of the issue or request
   - Required field entered by the user
   - Multi-line text input

### System Metadata
9. **ticketNumber** (string)
   - Unique ticket identifier generated automatically
   - Format: `"TICKET-{timestamp}"`
   - Example: `"TICKET-1705318200000"`

10. **createdAt** (Date/Timestamp)
    - Firestore server timestamp when the ticket was created
    - Used for sorting and filtering

11. **updatedAt** (Date/Timestamp)
    - Firestore server timestamp when the ticket was last updated
    - Updated whenever the ticket is modified

### Configuration Information (for Admin Reference)
12. **apiKey** (string)
    - Indicates if Firebase API key is configured
    - Value: `"Configured"` or `"Not Configured"`
    - **Note**: The actual API key is NOT sent for security reasons
    - Only sends a status indicator

13. **projectId** (string)
    - Firebase Project ID from environment variables
    - Example: `"paytap-pos-production"`
    - Helps admin identify which project/environment the ticket is from

## Database Structure

### Firestore Collection: `supportTickets`

Each document in the collection contains:
```javascript
{
  userId: "firebase-auth-uid",
  userEmail: "vendor@example.com",
  vendorName: "vendor@example.com",
  subject: "Payment processing issue",
  category: "payment",
  status: "pending",
  details: "I'm experiencing issues with...",
  ticketNumber: "TICKET-1705318200000",
  apiKey: "Configured", // Only status, not actual key
  projectId: "paytap-pos-production",
  timestamp: "2024-01-15T10:30:00.000Z",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Security Considerations

### What is NOT Sent
- **Actual Firebase API Key**: Only a status indicator (`"Configured"` or `"Not Configured"`) is sent
- **User Password**: Never stored or transmitted
- **Payment Card Numbers**: Never stored in support tickets
- **Sensitive Personal Data**: Only email and user ID are included

### What Should Be Added (If Needed)
If you need to send additional information to admin, consider:

1. **Environment/App Version**
   - App version number
   - Build number
   - Platform (web/mobile)

2. **Device Information** (Optional)
   - Browser/device type
   - Operating system
   - Screen resolution

3. **Session Information** (Optional)
   - Current point balance
   - Recent transaction count
   - Last login time

4. **File Attachments** (Future Enhancement)
   - Screenshots
   - Error logs
   - PDF documents

## Admin Access

To view support tickets from the admin side, you can:

1. **Query by User**: Get all tickets from a specific user
   ```javascript
   await getSupportTicketsByUser(userId);
   ```

2. **Query by Status**: Get all pending tickets
   ```javascript
   await getSupportTicketsByStatus('pending');
   ```

3. **Query by Category**: Get all payment-related tickets
   ```javascript
   await getSupportTicketsByCategory('payment');
   ```

4. **Get All Tickets**: Retrieve all tickets sorted by date
   ```javascript
   await getSupportTickets();
   ```

## Firestore Security Rules Example

To protect the support tickets collection, add these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Support tickets collection
    match /supportTickets/{ticketId} {
      // Users can only create tickets
      allow create: if request.auth != null;
      
      // Users can read their own tickets
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      
      // Users can update their own tickets (status changes)
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
      
      // Admin can do everything (you'll need to add admin check)
      allow read, write: if request.auth != null && 
                           get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## API Key Information

**Important**: The actual Firebase API key is stored in environment variables (`VITE_FIREBASE_API_KEY`) and is **NOT** sent to the database. Only a status indicator is sent to help admins troubleshoot configuration issues.

If you need to verify API key configuration, check:
- `.env` file contains `VITE_FIREBASE_API_KEY`
- Firebase Console → Project Settings → General → Your apps

**Never expose the actual API key in support tickets or logs.**

