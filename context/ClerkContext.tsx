import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { supabase } from '@/lib/supabase';

interface Customer {
  id: string;
  clerk_user_id: string | null;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UpdateProfileImageError {
  code: 'NOT_AUTHENTICATED' | 'INVALID_IMAGE' | 'UPLOAD_FAILED' | 'CLERK_UPDATE_FAILED' | 'DB_SYNC_FAILED' | 'CANCELLED';
  message: string;
}

interface UpdateProfileImageResult {
  customer?: Customer;
  avatarUrl?: string;
  error?: UpdateProfileImageError;
}

interface ClerkContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  user: any;
  customer: Customer | null;
  signOut: () => Promise<void>;
  fetchUserDetails: (userId: string) => Promise<any>;
  syncCustomer: () => Promise<Customer | null>;
  updateProfileImage: (file: { uri: string; type?: string; name?: string }) => Promise<UpdateProfileImageResult>;
}

const ClerkContext = createContext<ClerkContextType | undefined>(undefined);

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, signOut } = useAuth();
  const { user } = useUser();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const fetchUserDetails = async (clerkUserId: string) => {
    try {
      console.log('[ClerkContext] Fetching user details for:', clerkUserId);
      const { data, error } = await supabase.functions.invoke('supabase-functions-get-clerk-user', {
        body: { user_id: clerkUserId }
      });

      if (error) {
        console.error('[ClerkContext] Error fetching user details:', error);
        // Return null gracefully - the app will use local Clerk user data
        return null;
      }

      // Check for fallback response (when Pica API fails)
      if (data?.fallback) {
        console.log('[ClerkContext] Using fallback - Pica API unavailable');
        return null;
      }

      console.log('[ClerkContext] User details fetched successfully');
      return data;
    } catch (error) {
      console.error('[ClerkContext] Error fetching user details:', error);
      // Return null gracefully - the app will use local Clerk user data
      return null;
    }
  };

  // Sync customer profile with database
  const syncCustomer = async (): Promise<Customer | null> => {
    if (!user) {
      console.log('[ClerkContext] No user available for sync');
      return null;
    }

    try {
      const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
      
      if (!email) {
        console.error('[ClerkContext] No email available from Clerk user');
        return null;
      }

      console.log('[ClerkContext] Syncing customer with email:', email);
      
      // First try the SSO lookup edge function (handles Pica integration and server-side sync)
      const { data: ssoData, error: ssoError } = await supabase.functions.invoke('supabase-functions-clerk-sso-lookup', {
        body: {
          user_id: user.id,
        }
      });

      if (!ssoError && ssoData?.customer) {
        console.log('[ClerkContext] Customer synced via SSO lookup:', ssoData.customer.id);
        setCustomer(ssoData.customer);
        return ssoData.customer;
      }

      // Fallback to direct sync if SSO lookup fails
      console.log('[ClerkContext] Falling back to direct sync...');
      const { data, error } = await supabase.functions.invoke('supabase-functions-sync-clerk-customer', {
        body: {
          clerk_user_id: user.id,
          email: email,
          first_name: user.firstName || null,
          last_name: user.lastName || null,
          full_name: user.fullName || null,
        }
      });

      if (error) {
        console.error('[ClerkContext] Error syncing customer:', error);
        return null;
      }

      if (data?.data?.customer) {
        console.log('[ClerkContext] Customer synced successfully:', data.data.customer.id, 'created:', data.created);
        setCustomer(data.data.customer);
        return data.data.customer;
      }

      console.log('[ClerkContext] No customer data returned');
      return null;
    } catch (error) {
      console.error('[ClerkContext] Error syncing customer:', error);
      return null;
    }
  };

  // Update profile image
  // NOTE: use userId from useAuth() which is the Clerk user ID (user.id)
  // This matches the clerk_user_id field in the customers table
  const updateProfileImage = async (file: { uri: string; type?: string; name?: string }): Promise<UpdateProfileImageResult> => {
    if (!user || !userId) {
      console.log('[ClerkContext] No user available for avatar update');
      return { error: { code: 'NOT_AUTHENTICATED', message: 'Please sign in to update your profile picture' } };
    }

    // userId is the Clerk user ID (e.g., "user_xxx") from useAuth()
    const clerkUserId = userId;

    try {
      console.log('[ClerkContext] Updating profile image for clerk_user_id:', clerkUserId);

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      const fileType = file.type || 'image/jpeg';
      if (!allowedTypes.includes(fileType)) {
        return { error: { code: 'INVALID_IMAGE', message: `File type ${fileType} is not supported. Please use JPEG, PNG, or WebP.` } };
      }

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: fileType,
        name: file.name || 'avatar.jpg',
      } as any);
      // Use clerkUserId which is the Clerk user ID from useAuth()
      formData.append('clerk_user_id', clerkUserId);

      // Get the Supabase URL from env
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        return { error: { code: 'UPLOAD_FAILED', message: 'Missing Supabase configuration' } };
      }

      // Call our Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/supabase-functions-update-avatar`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[ClerkContext] Avatar upload failed:', result);
        return { 
          error: { 
            code: result.code || 'UPLOAD_FAILED', 
            message: result.message || result.error || 'Failed to upload profile picture' 
          } 
        };
      }

      console.log('[ClerkContext] Avatar updated successfully:', result.avatarUrl);

      // Update local customer state
      if (result.customer) {
        setCustomer(result.customer);
      } else if (result.avatarUrl && customer) {
        // Partial success - update avatar_url locally
        setCustomer({ ...customer, avatar_url: result.avatarUrl });
      }

      return { customer: result.customer, avatarUrl: result.avatarUrl };

    } catch (error: any) {
      console.error('[ClerkContext] Error updating profile image:', error);
      return { error: { code: 'UPLOAD_FAILED', message: error.message || 'Failed to upload profile picture' } };
    }
  };

  useEffect(() => {
    if (isSignedIn && userId && user) {
      // Fetch extended user details from Clerk via Pica
      fetchUserDetails(userId).then(setUserDetails);
      
      // Sync customer with database
      syncCustomer();
    } else {
      setUserDetails(null);
      setCustomer(null);
    }
  }, [isSignedIn, userId, user]);

  return (
    <ClerkContext.Provider
      value={{
        isLoaded,
        isSignedIn: isSignedIn ?? false,
        userId,
        user: userDetails || user,
        customer,
        signOut,
        fetchUserDetails,
        syncCustomer,
        updateProfileImage,
      }}
    >
      {children}
    </ClerkContext.Provider>
  );
}

export function useClerk() {
  const context = useContext(ClerkContext);
  if (context === undefined) {
    throw new Error('useClerk must be used within a ClerkProvider');
  }
  return context;
}
