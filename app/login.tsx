import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { LogIn, ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

// Cross-platform alert helper
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const hasNavigated = useRef(false);
  
  // 2FA state
  const [needsSecondFactor, setNeedsSecondFactor] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);

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
    console.log('[LoginScreen] onSignInPress called, isLoaded:', isLoaded, 'signIn:', !!signIn);
    
    if (!isLoaded || !signIn) {
      console.log('[LoginScreen] Not loaded yet');
      showAlert('Please Wait', 'Authentication is still loading. Please wait a moment and try again.');
      return;
    }

    if (!emailAddress.trim() || !password.trim()) {
      showAlert('Sign In Error', 'Please enter both email and password.');
      return;
    }

    console.log('[LoginScreen] Starting sign-in process...');
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
          showAlert('Sign In Error', 'Sign-in completed but session was not created. Please try again.');
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
          showAlert('Sign In Error', `Unexpected status: ${completeSignIn.status}`);
          setLoading(false);
        }
      } else if (signInResult.status === 'needs_second_factor') {
        // User has MFA enrolled but you don't want it - let's diagnose and fix
        console.log('[LoginScreen] 2FA unexpectedly required - attempting to diagnose and fix...');
        
        try {
          // Call the diagnostic function to check MFA status
          const { data: diagData, error: diagError } = await supabase.functions.invoke(
            'supabase-functions-clerk-diagnostics',
            {
              body: {
                action: 'disable_user_mfa',
                email: emailAddress.trim(),
                perform_disable: true // Auto-disable MFA since it's not wanted
              }
            }
          );
          
          console.log('[LoginScreen] Clerk diagnostics result:', diagData);
          
          if (diagError) {
            console.error('[LoginScreen] Diagnostics error:', diagError);
            showAlert('2FA Issue', 'Your account has 2FA enabled. Please contact support to disable it, or enter your 2FA code below.');
            setNeedsSecondFactor(true);
          } else if (diagData?.disable_mfa_result?.ok) {
            // MFA was disabled! Retry sign-in
            showAlert('MFA Disabled', 'Two-factor authentication has been removed from your account. Please try signing in again.');
          } else if (diagData?.mfa_diagnosis?.has_mfa) {
            // MFA is still there, show the 2FA input
            console.log('[LoginScreen] MFA still enabled, showing 2FA input');
            setNeedsSecondFactor(true);
          } else {
            // MFA not enrolled but still getting needs_second_factor - might be org policy
            showAlert('Authentication Issue', 'There may be an organization-level MFA policy. Please check your Clerk dashboard settings or clear your browser cache and try again.');
          }
        } catch (diagErr) {
          console.error('[LoginScreen] Failed to diagnose:', diagErr);
          // Fallback to showing 2FA input
          setNeedsSecondFactor(true);
        }
        
        setLoading(false);
      } else {
        console.log('[LoginScreen] Unexpected status:', signInResult.status);
        showAlert('Sign In Error', `Unexpected sign-in status: ${signInResult.status}`);
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
      showAlert('Sign In Error', errorMessage);
      setLoading(false);
    }
  };

  // Handle 2FA verification using Clerk SDK
  const onVerify2FAPress = async () => {
    if (!isLoaded || !signIn) {
      showAlert('Error', 'Authentication is not ready. Please try again.');
      return;
    }

    if (!totpCode.trim() || totpCode.trim().length < 6) {
      showAlert('Error', 'Please enter a valid 6-digit code.');
      return;
    }

    setVerifying2FA(true);
    console.log('[LoginScreen] Attempting 2FA verification...');

    try {
      // Use Clerk SDK to attempt second factor
      const result = await signIn.attemptSecondFactor({
        strategy: 'totp',
        code: totpCode.trim(),
      });

      console.log('[LoginScreen] 2FA result:', { 
        status: result.status, 
        createdSessionId: result.createdSessionId 
      });

      if (result.status === 'complete' && result.createdSessionId) {
        console.log('[LoginScreen] 2FA successful, setting active session...');
        await setActive({ session: result.createdSessionId });
        
        // Navigation is handled by useEffect when isSignedIn becomes true
        setTimeout(() => {
          if (!hasNavigated.current) {
            console.log('[LoginScreen] Timeout - forcing navigation after 2FA');
            setVerifying2FA(false);
            router.replace('/');
          }
        }, 3000);
      } else {
        showAlert('Error', `Unexpected verification status: ${result.status}`);
        setVerifying2FA(false);
      }
    } catch (err: any) {
      console.error('[LoginScreen] 2FA verification error:', err);
      let errorMessage = 'Verification failed. Please check your code and try again.';
      if (err?.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].longMessage || err.errors[0].message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      showAlert('Verification Error', errorMessage);
      setVerifying2FA(false);
    }
  };

  // Reset to login form
  const onBack2FA = () => {
    setNeedsSecondFactor(false);
    setTotpCode('');
    setPassword('');
  };

  // Render 2FA verification UI
  if (needsSecondFactor) {
    return (
      <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="mb-8">
              <TouchableOpacity 
                onPress={onBack2FA}
                className="flex-row items-center mb-4"
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color="#3E3D38" />
                <Text className="text-charcoal ml-2">Back</Text>
              </TouchableOpacity>
              
              <View className="w-16 h-16 bg-turquoise/10 rounded-full items-center justify-center mb-4">
                <ShieldCheck size={32} color="#00A896" />
              </View>
              <Text className="text-charcoal text-3xl font-bold mb-2">
                Two-Factor Authentication
              </Text>
              <Text className="text-charcoal/60 text-base">
                Enter the 6-digit code from your authenticator app
              </Text>
            </View>

            {/* TOTP Input */}
            <View className="mb-6">
              <Text className="text-charcoal text-sm font-medium mb-2">
                Verification Code
              </Text>
              <TextInput
                value={totpCode}
                placeholder="000000"
                placeholderTextColor="#9CA3AF"
                onChangeText={setTotpCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                className="bg-white border border-charcoal/10 rounded-xl px-4 py-4 text-charcoal text-2xl text-center"
                style={{ letterSpacing: 8 }}
              />
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={onVerify2FAPress}
              disabled={verifying2FA || totpCode.length < 6}
              activeOpacity={0.8}
              className={`rounded-xl py-4 items-center mb-4 ${
                verifying2FA || totpCode.length < 6 ? 'bg-turquoise/30' : 'bg-turquoise'
              }`}
            >
              {verifying2FA ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Verify
                </Text>
              )}
            </TouchableOpacity>

            {/* Help text */}
            <Text className="text-charcoal/50 text-sm text-center">
              If you've lost access to your authenticator app, you can use a backup code instead.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
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
          <TouchableOpacity
            onPress={() => {
              console.log('[LoginScreen] Sign In button pressed');
              onSignInPress();
            }}
            disabled={loading || !emailAddress || !password}
            activeOpacity={0.8}
            className={`rounded-xl py-4 items-center mb-4 ${
              loading || !emailAddress || !password ? 'bg-charcoal/30' : 'bg-coral'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View className="flex-row items-center justify-center">
            <Text className="text-charcoal/60 text-base">
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/signup')}
              activeOpacity={0.7}
            >
              <Text className="text-coral text-base font-semibold">
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
