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
  created_at: string;
  updated_at: string;
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
