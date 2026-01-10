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
import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const hasNavigated = useRef(false);

  // Redirect to home when user becomes signed in
  useEffect(() => {
    console.log('[SignUpScreen] Auth state:', { authLoaded, isSignedIn, hasNavigated: hasNavigated.current });
    if (authLoaded && isSignedIn && !hasNavigated.current) {
      hasNavigated.current = true;
      setLoading(false);
      router.replace('/');
    }
  }, [authLoaded, isSignedIn]);

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
                disabled={loading || !emailAddress || !password || !firstName || !lastName}
                className={`rounded-xl py-4 items-center mb-4 ${
                  loading || !emailAddress || !password || !firstName || !lastName
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
