import { useClerk } from '@/context/ClerkContext';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useClerk();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isAuthPage = segments[0] === 'login' || segments[0] === 'signup';

    if (!isSignedIn && !isAuthPage) {
      // Redirect to login if not signed in and not on auth page
      router.replace('/login');
    } else if (isSignedIn && isAuthPage) {
      // Redirect to home if signed in and on auth page
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, segments]);

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return <>{children}</>;
}
