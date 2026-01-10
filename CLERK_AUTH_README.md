# Clerk Authentication Implementation

This document describes the Clerk authentication implementation for this Expo application.

## Overview

Clerk authentication has been integrated with the following features:
- Email/password login and signup
- Email verification flow
- Protected routes
- Session management
- User profile with sign out
- Integration with Supabase Edge Function for user data retrieval via Pica Passthrough

## Architecture

### Components

1. **Edge Function** (`supabase/functions/get-clerk-user/index.ts`)
   - Retrieves Clerk user data via Pica Passthrough API
   - Validates environment variables (PICA_SECRET_KEY, PICA_CLERK_CONNECTION_KEY)
   - Returns user details from Clerk API

2. **Clerk Context** (`context/ClerkContext.tsx`)
   - Wraps Clerk authentication hooks
   - Provides convenient access to auth state
   - Fetches additional user details from Edge Function

3. **Authentication Screens**
   - `/app/login.tsx` - Email/password sign-in
   - `/app/signup.tsx` - Account creation with email verification

4. **Protected Routes**
   - Home screen requires authentication
   - Profile screen requires authentication
   - Automatic redirect to login when not authenticated

## Environment Variables Required

You need to set the following environment variable in your project settings:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

The following Pica environment variables are already configured:
- `PICA_SECRET_KEY`
- `PICA_CLERK_CONNECTION_KEY`

## Setup Instructions

### 1. Get Clerk Publishable Key

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select or create your application
3. Navigate to **API Keys** in the sidebar
4. Copy your **Publishable Key** (starts with `pk_test_` for development)

### 2. Add Environment Variable

1. Go to your Tempo project home page
2. Click on **Project Settings**
3. Add the environment variable:
   - Key: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Value: Your Clerk publishable key

### 3. Configure Clerk Application Settings

In your Clerk Dashboard:

1. **Email Settings**
   - Enable email/password authentication
   - Configure email verification (code-based)

2. **Session Settings**
   - Configure session lifetime as needed
   - Set up session token customization if needed

3. **User Profile**
   - Enable required fields: Email, First Name, Last Name
   - Configure optional fields as needed

## Features Implemented

### 1. Authentication Flow

- **Sign Up**:
  - User enters email, password, first name, last name
  - Clerk sends verification code to email
  - User enters 6-digit code
  - Account is created and user is signed in
  - Redirected to home screen

- **Sign In**:
  - User enters email and password
  - Clerk validates credentials
  - Session is created
  - Redirected to home screen

### 2. Protected Routes

- Home screen (`/`) - Requires authentication
- Profile screen (`/profile`) - Requires authentication
- Login/Signup screens - Redirect to home if already authenticated

### 3. Session Management

- Token cache using `expo-secure-store` for persistent sessions
- Automatic session refresh
- Session state synchronized across app

### 4. User Profile

- Displays Clerk user data (name, email, profile image)
- Shows account creation date
- Sign out button with confirmation

### 5. Edge Function Integration

- Supabase Edge Function deployed at `/get-clerk-user`
- Uses Pica Passthrough to fetch Clerk user data
- Called from ClerkContext to enrich user data

## File Structure

```
app/
├── _layout.tsx                 # Root layout with Clerk providers
├── index.tsx                   # Home screen (protected)
├── login.tsx                   # Login screen
├── signup.tsx                  # Signup screen
└── profile.tsx                 # Profile screen (protected)

components/
├── ProtectedRoute.tsx          # Route protection component
└── ...

context/
├── ClerkContext.tsx            # Clerk authentication context
└── ...

supabase/
└── functions/
    └── get-clerk-user/
        └── index.ts            # Edge function for user data
```

## Usage Examples

### Accessing User Data in Components

```tsx
import { useClerk } from '@/context/ClerkContext';

function MyComponent() {
  const { isSignedIn, user, userId } = useClerk();

  if (!isSignedIn) {
    return <Text>Please sign in</Text>;
  }

  return (
    <Text>Welcome, {user?.first_name}!</Text>
  );
}
```

### Sign Out

```tsx
import { useClerk } from '@/context/ClerkContext';
import { useRouter } from 'expo-router';

function SignOutButton() {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <TouchableOpacity onPress={handleSignOut}>
      <Text>Sign Out</Text>
    </TouchableOpacity>
  );
}
```

### Fetching Additional User Details

```tsx
import { useClerk } from '@/context/ClerkContext';

function UserDetails() {
  const { fetchUserDetails, userId } = useClerk();
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserDetails(userId).then(setDetails);
    }
  }, [userId]);

  return <Text>{JSON.stringify(details, null, 2)}</Text>;
}
```

## Security Best Practices

1. **Environment Variables**
   - Never commit API keys to version control
   - Use project settings to manage environment variables
   - Clerk publishable key is safe for client-side use

2. **Pica API Keys**
   - PICA_SECRET_KEY and PICA_CLERK_CONNECTION_KEY are server-side only
   - Only used in Supabase Edge Functions
   - Never exposed to client

3. **Session Management**
   - Sessions stored securely with expo-secure-store
   - Tokens automatically refreshed by Clerk
   - Logout clears all session data

4. **Route Protection**
   - All sensitive routes require authentication
   - Automatic redirect to login when session expires
   - User state checked on mount and route changes

## Testing

### Test User Flow

1. **Sign Up**:
   - Open signup screen
   - Enter valid email, password, first name, last name
   - Check email for verification code
   - Enter code to complete signup
   - Verify redirect to home screen

2. **Sign In**:
   - Open login screen
   - Enter registered email and password
   - Verify redirect to home screen
   - Check that user name appears in greeting

3. **Protected Routes**:
   - Try accessing home or profile without being signed in
   - Verify automatic redirect to login

4. **Sign Out**:
   - Go to profile screen
   - Tap sign out
   - Confirm sign out
   - Verify redirect to login

### Edge Function Testing

Test the edge function directly:

```bash
curl -X GET "https://YOUR_SUPABASE_URL/functions/v1/get-clerk-user?user_id=user_xxx" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

## Troubleshooting

### "Missing Pica connection" Error

- Verify PICA_SECRET_KEY and PICA_CLERK_CONNECTION_KEY are set in environment
- These should be automatically configured

### Login/Signup Not Working

- Verify EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is correctly set
- Check Clerk Dashboard that email/password auth is enabled
- Ensure email verification is configured in Clerk

### Session Not Persisting

- Verify expo-secure-store is properly installed
- Check that tokenCache is configured in ClerkProvider

### User Not Redirecting After Login

- Check that router.replace() is being called
- Verify authentication state in useEffect dependencies
- Check console for any errors

## Next Steps

Potential enhancements:

1. **Social Login**
   - Add Google, Apple, or other OAuth providers in Clerk Dashboard
   - Update login/signup screens with social buttons

2. **Password Reset**
   - Implement forgot password flow
   - Add password reset screen

3. **Multi-Factor Authentication**
   - Enable MFA in Clerk Dashboard
   - Add MFA configuration in profile screen

4. **User Metadata**
   - Store additional user preferences in Clerk metadata
   - Sync with Supabase database

5. **Organization/Team Support**
   - Enable organizations in Clerk
   - Add organization switching UI

## Support

For issues or questions:
- Clerk Documentation: https://clerk.com/docs
- Pica Documentation: https://docs.picaos.com
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
