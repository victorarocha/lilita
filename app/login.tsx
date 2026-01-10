import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { LogIn } from 'lucide-react-native';

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const hasNavigated = useRef(false);

  // Redirect to home when user becomes signed in
  useEffect(() => {
    console.log('[LoginScreen] Auth state:', { authLoaded, isSignedIn, hasNavigated: hasNavigated.current });
    if (authLoaded && isSignedIn && !hasNavigated.current) {
      hasNavigated.current = true;
      setLoading(false);
      router.replace('/');
    }
  }, [authLoaded, isSignedIn]);

  const onSignInPress = async () => {
    if (!isLoaded || !signIn) {
      console.log('[LoginScreen] Not loaded yet');
      return;
    }

    if (!emailAddress.trim() || !password.trim()) {
      Alert.alert('Sign In Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      console.log('[LoginScreen] Creating sign-in with identifier and password...');
      
      // Create sign-in with both identifier and password in a single call
      const signInResult = await signIn.create({
        identifier: emailAddress.trim(),
        password: password,
      });

      console.log('[LoginScreen] Sign-in result:', { 
        status: signInResult.status,
        createdSessionId: signInResult.createdSessionId 
      });

      // Check if sign-in is complete
      if (signInResult.status === 'complete') {
        if (signInResult.createdSessionId) {
          // Set the session as active
          console.log('[LoginScreen] Setting active session...');
          await setActive({ session: signInResult.createdSessionId });
          console.log('[LoginScreen] Session activated, waiting for auth state update...');
          
          // Navigation is handled by useEffect when isSignedIn becomes true
          // Add a timeout to prevent infinite loading if something goes wrong
          setTimeout(() => {
            if (!hasNavigated.current) {
              console.log('[LoginScreen] Timeout - forcing navigation');
              setLoading(false);
              router.replace('/');
            }
          }, 3000);
        } else {
          console.error('[LoginScreen] Sign-in complete but no session ID');
          Alert.alert('Sign In Error', 'Sign-in completed but session was not created. Please try again.');
          setLoading(false);
        }
      } else if (signInResult.status === 'needs_first_factor') {
        // If needs_first_factor, try to complete with password
        console.log('[LoginScreen] Attempting first factor with password...');
        const completeSignIn = await signIn.attemptFirstFactor({
          strategy: 'password',
          password: password,
        });

        console.log('[LoginScreen] First factor result:', { 
          status: completeSignIn.status,
          createdSessionId: completeSignIn.createdSessionId 
        });

        if (completeSignIn.status === 'complete' && completeSignIn.createdSessionId) {
          await setActive({ session: completeSignIn.createdSessionId });
          setTimeout(() => {
            if (!hasNavigated.current) {
              setLoading(false);
              router.replace('/');
            }
          }, 3000);
        } else {
          Alert.alert('Sign In Error', `Unexpected status: ${completeSignIn.status}`);
          setLoading(false);
        }
      } else if (signInResult.status === 'needs_second_factor') {
        // Handle 2FA if enabled
        Alert.alert('Two-Factor Required', 'Please complete two-factor authentication.');
        setLoading(false);
      } else {
        console.log('[LoginScreen] Unexpected status:', signInResult.status);
        Alert.alert('Sign In Error', `Unexpected sign-in status: ${signInResult.status}`);
        setLoading(false);
      }
      
    } catch (err: any) {
      console.error('[LoginScreen] Error signing in:', err);
      // Extract meaningful error message from Clerk error
      let errorMessage = 'Failed to sign in. Please try again.';
      if (err?.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].longMessage || err.errors[0].message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      Alert.alert('Sign In Error', errorMessage);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1" 
          contentContainerClassName="px-6 py-8"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mb-8">
            <View className="w-16 h-16 bg-coral/10 rounded-full items-center justify-center mb-4">
              <LogIn size={32} color="#FF6B6B" />
            </View>
            <Text className="text-charcoal text-3xl font-bold mb-2">
              Welcome Back
            </Text>
            <Text className="text-charcoal/60 text-base">
              Sign in to continue
            </Text>
          </View>

          {/* Form */}
          <View className="mb-6">
            <Text className="text-charcoal text-sm font-medium mb-2">
              Email Address
            </Text>
            <TextInput
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              onChangeText={setEmailAddress}
              keyboardType="email-address"
              autoComplete="email"
              className="bg-white border border-charcoal/10 rounded-xl px-4 py-4 text-charcoal text-base mb-4"
            />

            <Text className="text-charcoal text-sm font-medium mb-2">
              Password
            </Text>
            <TextInput
              value={password}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              onChangeText={setPassword}
              autoComplete="password"
              className="bg-white border border-charcoal/10 rounded-xl px-4 py-4 text-charcoal text-base"
            />
          </View>

          {/* Sign In Button */}
          <Pressable
            onPress={() => {
              console.log('[LoginScreen] Sign In button pressed');
              onSignInPress();
            }}
            disabled={loading || !emailAddress || !password}
            style={({ pressed }) => ({
              backgroundColor: loading || !emailAddress || !password 
                ? 'rgba(51, 51, 51, 0.3)' 
                : '#FF6B6B',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 16,
              opacity: pressed ? 0.8 : 1,
              cursor: Platform.OS === 'web' ? 'pointer' : undefined,
            })}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                Sign In
              </Text>
            )}
          </Pressable>

          {/* Sign Up Link */}
          <View className="flex-row items-center justify-center">
            <Text className="text-charcoal/60 text-base">
              Don't have an account?{' '}
            </Text>
            <Pressable 
              onPress={() => router.push('/signup')}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                cursor: Platform.OS === 'web' ? 'pointer' : undefined,
              })}
            >
              <Text className="text-coral text-base font-semibold">
                Sign Up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
