import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignUp, useAuth, useSSO } from '@clerk/clerk-expo';
import { useRouter, useSegments, useRootNavigation } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import * as Linking from 'expo-linking';

// Note: WebBrowser.maybeCompleteAuthSession() is called in _layout.tsx at app root

// Detect if we're running in a browser environment (more reliable than Platform.OS on web)
const isWebBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();
  // useSegments is a reliable way to check if navigation is mounted
  const segments = useSegments();
  // Get the root navigation object to check if it's ready
  const rootNavigation = useRootNavigation();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  const hasNavigated = useRef(false);
  const navigationAttempts = useRef(0);
  const [isMounted, setIsMounted] = useState(false);
  const [navigationContextReady, setNavigationContextReady] = useState(false);

  // SSO hooks
  const { startSSOFlow: startGoogleSSO } = useSSO();
  const { startSSOFlow: startFacebookSSO } = useSSO();
  const { startSSOFlow: startAppleSSO } = useSSO();

  // Track when component is mounted
  useEffect(() => {
    // Delay slightly to ensure navigation context is ready
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Check if root navigation is ready
  useEffect(() => {
    if (rootNavigation?.isReady()) {
      console.log('[SignUpScreen] Root navigation is ready');
      setNavigationContextReady(true);
    } else {
      // Listen for when navigation becomes ready
      const unsubscribe = rootNavigation?.addListener?.('state', () => {
        if (rootNavigation?.isReady()) {
          console.log('[SignUpScreen] Root navigation became ready');
          setNavigationContextReady(true);
        }
      });
      return () => unsubscribe?.();
    }
  }, [rootNavigation]);

  // Check if navigation is ready - segments array exists when navigation is mounted
  const navigationReady = isMounted && navigationContextReady;

  // Safe navigation function with retry logic
  const safeNavigate = useCallback(() => {
    if (hasNavigated.current) return;
    
    navigationAttempts.current += 1;
    console.log('[SignUpScreen] Safe navigate attempt:', navigationAttempts.current, {
      isMounted,
      navigationContextReady,
      rootNavigationReady: rootNavigation?.isReady?.(),
      isWebBrowser,
      platformOS: Platform.OS
    });
    
    // On web/browser, use window.location for reliable navigation after SSO
    // This completely bypasses expo-router's navigation and avoids any context issues
    // Use isWebBrowser check which is more reliable than Platform.OS in some environments
    if (isWebBrowser || Platform.OS === 'web') {
      hasNavigated.current = true;
      console.log('[SignUpScreen] Using window.location for web navigation');
      // Use setTimeout to ensure any pending state updates complete first
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      return;
    }
    
    // For native, check if navigation is truly ready
    const isNavReady = isMounted && rootNavigation?.isReady?.();
    
    if (!isNavReady) {
      // Navigation not ready yet, retry after a delay
      if (navigationAttempts.current < 15) {
        console.log('[SignUpScreen] Navigation not ready, retrying in 300ms...');
        setTimeout(safeNavigate, 300);
      } else {
        console.error('[SignUpScreen] Navigation failed after max attempts');
      }
      return;
    }
    
    try {
      hasNavigated.current = true;
      router.replace('/');
      console.log('[SignUpScreen] Navigation successful');
    } catch (navError) {
      console.error('[SignUpScreen] Navigation error:', navError);
      hasNavigated.current = false;
      // Retry with longer delay
      if (navigationAttempts.current < 15) {
        setTimeout(safeNavigate, 400);
      }
    }
  }, [isMounted, navigationContextReady, rootNavigation, router]);

  // Redirect to home when user becomes signed in
  useEffect(() => {
    console.log('[SignUpScreen] Auth state:', { 
      authLoaded, 
      isSignedIn, 
      hasNavigated: hasNavigated.current,
      isMounted,
      navigationContextReady
    });
    
    if (authLoaded && isSignedIn && !hasNavigated.current) {
      setLoading(false);
      setSsoLoading(null);
      // Use safe navigation with retry logic
      navigationAttempts.current = 0;
      // Defer navigation to ensure everything is mounted
      // Use longer delay for web after SSO redirect to allow navigation context to fully initialize
      // Apple SSO can take longer to complete session initialization
      const delay = (isWebBrowser || Platform.OS === 'web') ? 750 : 300;
      console.log('[SignUpScreen] Scheduling navigation with delay:', delay, 'ms');
      setTimeout(safeNavigate, delay);
    }
  }, [authLoaded, isSignedIn, safeNavigate, isMounted, navigationContextReady]);

  // Handle SSO sign-up
  const handleSSOSignUp = useCallback(async (provider: 'oauth_google' | 'oauth_facebook' | 'oauth_apple') => {
    if (!isLoaded) {
      Alert.alert('Please Wait', 'Authentication is still loading.');
      return;
    }

    setSsoLoading(provider);
    console.log(`[SignUpScreen] Starting ${provider} SSO...`);

    try {
      let startSSO;
      if (provider === 'oauth_google') {
        startSSO = startGoogleSSO;
      } else if (provider === 'oauth_facebook') {
        startSSO = startFacebookSSO;
      } else {
        startSSO = startAppleSSO;
      }

      // Get redirect URL for Expo
      // IMPORTANT: Redirect back to /signup route so the auth state check can handle navigation
      // This avoids "couldn't find navigation context" errors on web
      // Use isWebBrowser check which is more reliable than Platform.OS in some environments
      const redirectUrl = (isWebBrowser || Platform.OS === 'web')
        ? `${window.location.origin}/signup`
        : Linking.createURL('/signup');
      console.log('[SignUpScreen] SSO redirect URL:', redirectUrl, 'isWebBrowser:', isWebBrowser);

      const { createdSessionId, setActive: ssoSetActive, signIn: ssoSignIn, signUp: ssoSignUp } = await startSSO({
        strategy: provider,
        redirectUrl,
      });

      console.log('[SignUpScreen] SSO flow result:', { 
        createdSessionId, 
        hasSetActive: !!ssoSetActive,
        hasSignIn: !!ssoSignIn,
        hasSignUp: !!ssoSignUp
      });

      // If sign-up was successful, set the session
      if (createdSessionId && ssoSetActive) {
        console.log('[SignUpScreen] SSO session created, activating...');
        try {
          await ssoSetActive({ session: createdSessionId });
          console.log('[SignUpScreen] SSO session activated successfully');
          // DO NOT call router.replace here - let the useEffect handle navigation
          // when auth state changes to avoid "couldn't find navigation context" error
          // The useEffect watching isSignedIn will handle navigation safely
        } catch (activationError: any) {
          console.error('[SignUpScreen] SSO session activation error:', activationError);
          Alert.alert('Activation Error', 'Failed to activate session. Please try again.');
          setSsoLoading(null);
        }
      } else {
        if (ssoSignIn || ssoSignUp) {
          console.log('[SignUpScreen] SSO requires additional steps');
          // Navigation will be handled by the useEffect when auth state changes
        } else {
          console.log('[SignUpScreen] SSO flow incomplete, no session created');
          setSsoLoading(null);
        }
      }
    } catch (err: any) {
      console.error(`[SignUpScreen] ${provider} SSO error:`, err);
      let errorMessage = 'SSO sign-up failed. Please try again.';
      if (err?.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].longMessage || err.errors[0].message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      Alert.alert('SSO Error', errorMessage);
      setSsoLoading(null);
    }
  }, [isLoaded, startGoogleSSO, startFacebookSSO, startAppleSSO]);

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      await signUp.create({
        emailAddress,
        password,
        firstName,
        lastName,
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
    } catch (err: any) {
      console.error('Error signing up:', err);
      Alert.alert('Sign Up Error', err?.errors?.[0]?.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded || !signUp) return;

    setLoading(true);
    try {
      console.log('[SignUpScreen] Verifying email...');
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      console.log('[SignUpScreen] Verification result:', {
        status: completeSignUp.status,
        createdSessionId: completeSignUp.createdSessionId
      });

      if (!completeSignUp.createdSessionId) {
        console.error('[SignUpScreen] No session ID returned');
        Alert.alert('Verification Error', 'Failed to create session. Please try again.');
        setLoading(false);
        return;
      }

      // Set the session as active - this will trigger the useEffect above
      console.log('[SignUpScreen] Setting active session...');
      await setActive({ session: completeSignUp.createdSessionId });
      console.log('[SignUpScreen] Session activated, waiting for auth state update...');
      
      // Add a timeout to prevent infinite loading
      setTimeout(() => {
        if (!hasNavigated.current) {
          console.log('[SignUpScreen] Timeout - forcing navigation');
          setLoading(false);
          router.replace('/');
        }
      }, 3000);
      
    } catch (err: any) {
      console.error('[SignUpScreen] Error verifying email:', err);
      const errorMessage = err?.errors?.[0]?.message || err?.message || 'Invalid verification code.';
      Alert.alert('Verification Error', errorMessage);
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
              <UserPlus size={32} color="#FF6B6B" />
            </View>
            <Text className="text-charcoal text-3xl font-bold mb-2">
              {pendingVerification ? 'Verify Email' : 'Create Account'}
            </Text>
            <Text className="text-charcoal/60 text-base">
              {pendingVerification
                ? 'Enter the verification code sent to your email'
                : 'Sign up to get started'}
            </Text>
          </View>

          {!pendingVerification ? (
            <>
              {/* Sign Up Form */}
              <View className="mb-6">
                <Text className="text-charcoal text-sm font-medium mb-2">
                  First Name
                </Text>
                <TextInput
                  value={firstName}
                  placeholder="Enter your first name"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={setFirstName}
                  autoComplete="given-name"
                  className="bg-white border border-charcoal/10 rounded-xl px-4 py-4 text-charcoal text-base mb-4"
                />

                <Text className="text-charcoal text-sm font-medium mb-2">
                  Last Name
                </Text>
                <TextInput
                  value={lastName}
                  placeholder="Enter your last name"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={setLastName}
                  autoComplete="family-name"
                  className="bg-white border border-charcoal/10 rounded-xl px-4 py-4 text-charcoal text-base mb-4"
                />

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
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  onChangeText={setPassword}
                  autoComplete="password-new"
                  className="bg-white border border-charcoal/10 rounded-xl px-4 py-4 text-charcoal text-base"
                />
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                onPress={onSignUpPress}
                disabled={loading || !emailAddress || !password || !firstName || !lastName || ssoLoading !== null}
                className={`rounded-xl py-4 items-center mb-4 ${
                  loading || !emailAddress || !password || !firstName || !lastName || ssoLoading !== null
                    ? 'bg-charcoal/30'
                    : 'bg-coral'
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    Sign Up
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center mb-4">
                <View className="flex-1 h-[1px] bg-charcoal/10" />
                <Text className="text-charcoal/40 text-sm mx-4">or sign up with</Text>
                <View className="flex-1 h-[1px] bg-charcoal/10" />
              </View>

              {/* SSO Buttons */}
              <View className="space-y-3 mb-4">
                {/* Google */}
                <TouchableOpacity
                  onPress={() => handleSSOSignUp('oauth_google')}
                  disabled={loading || ssoLoading !== null}
                  activeOpacity={0.8}
                  className={`flex-row items-center justify-center rounded-xl py-4 border border-charcoal/10 bg-white mb-3 ${
                    ssoLoading !== null ? 'opacity-50' : ''
                  }`}
                >
                  {ssoLoading === 'oauth_google' ? (
                    <ActivityIndicator color="#4285F4" />
                  ) : (
                    <>
                      <Image 
                        source={{ uri: 'https://www.google.com/favicon.ico' }} 
                        className="w-5 h-5 mr-3"
                      />
                      <Text className="text-charcoal text-base font-medium">
                        Continue with Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Facebook */}
                <TouchableOpacity
                  onPress={() => handleSSOSignUp('oauth_facebook')}
                  disabled={loading || ssoLoading !== null}
                  activeOpacity={0.8}
                  className={`flex-row items-center justify-center rounded-xl py-4 bg-[#1877F2] mb-3 ${
                    ssoLoading !== null ? 'opacity-50' : ''
                  }`}
                >
                  {ssoLoading === 'oauth_facebook' ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text className="text-white text-lg font-bold mr-2">f</Text>
                      <Text className="text-white text-base font-medium">
                        Continue with Facebook
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Apple - Only show on iOS */}
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    onPress={() => handleSSOSignUp('oauth_apple')}
                    disabled={loading || ssoLoading !== null}
                    activeOpacity={0.8}
                    className={`flex-row items-center justify-center rounded-xl py-4 bg-black ${
                      ssoLoading !== null ? 'opacity-50' : ''
                    }`}
                  >
                    {ssoLoading === 'oauth_apple' ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Text className="text-white text-lg mr-2"></Text>
                        <Text className="text-white text-base font-medium">
                          Continue with Apple
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <>
              {/* Verification Form */}
              <View className="mb-6">
                <Text className="text-charcoal text-sm font-medium mb-2">
                  Verification Code
                </Text>
                <TextInput
                  value={code}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  className="bg-white border border-charcoal/10 rounded-xl px-4 py-4 text-charcoal text-base text-center text-2xl tracking-widest"
                />
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                onPress={onPressVerify}
                disabled={loading || code.length !== 6}
                className={`rounded-xl py-4 items-center mb-4 ${
                  loading || code.length !== 6
                    ? 'bg-charcoal/30'
                    : 'bg-coral'
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    Verify Email
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Sign In Link */}
          <View className="flex-row items-center justify-center">
            <Text className="text-charcoal/60 text-base">
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text className="text-coral text-base font-semibold">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
