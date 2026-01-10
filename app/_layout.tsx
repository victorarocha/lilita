import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import "../global.css";
import { AppProvider } from "@/context/AppContext";
import { ClerkProvider as ClerkProviderBase } from "@clerk/clerk-expo";
import { ClerkProvider } from "@/context/ClerkContext";
import * as SecureStore from "expo-secure-store";
import { Platform, View, ActivityIndicator } from "react-native";
import * as WebBrowser from "expo-web-browser";

// Complete any pending auth session at app startup (MUST be called at root level)
// This handles SSO redirects back to the app
const authSessionResult = WebBrowser.maybeCompleteAuthSession();
console.log('[RootLayout] maybeCompleteAuthSession result:', authSessionResult);

// Detect if we're running in a browser environment
const isWebBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Check if we're returning from an SSO redirect
const isReturningFromSSO = isWebBrowser && (
  window.location.search.includes('__clerk') ||
  window.location.hash.includes('__clerk') ||
  document.referrer.includes('accounts.google.com') ||
  document.referrer.includes('appleid.apple.com') ||
  document.referrer.includes('facebook.com') ||
  authSessionResult?.type === 'success'
);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Token cache for Clerk - platform-specific implementation
const tokenCache = {
  async getToken(key: string) {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (err) {
      // Ignore
    }
  },
};

// Get Clerk publishable key from env
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  
  // Add a delay on web to ensure navigation context is fully initialized
  // This prevents "couldn't find navigation context" errors after SSO redirects
  // Use longer delay when returning from SSO (especially Apple which can be slower)
  const [isReady, setIsReady] = useState(!isWebBrowser);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore splash screen errors in development/web
      });
    }
  }, [loaded]);

  // On web, delay rendering to allow navigation context to initialize
  // Use longer delay when returning from SSO redirect
  useEffect(() => {
    if (isWebBrowser && !isReady) {
      // Use longer delay when returning from SSO to ensure everything is initialized
      const delay = isReturningFromSSO ? 200 : 100;
      console.log('[RootLayout] Delaying render by', delay, 'ms, isReturningFromSSO:', isReturningFromSSO);
      const timer = setTimeout(() => {
        setIsReady(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  if (!loaded || !isReady) {
    // Show a minimal loading state while fonts load or navigation initializes
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF7F2' }}>
        <ActivityIndicator size="large" color="#00A896" />
      </View>
    );
  }

  return (
    <ClerkProviderBase
      publishableKey={publishableKey}
      tokenCache={tokenCache}
    >
      <ClerkProvider>
        <AppProvider>
          <ThemeProvider value={DefaultTheme}>
            <Stack
              screenOptions={({ route }) => ({
                headerShown: !route.name.startsWith("tempobook"),
                contentStyle: { backgroundColor: "#FAF7F2" },
                animation: "slide_from_right",
                })}
              >
                <Stack.Screen
                  name="index"
                  options={{ headerShown: false, animation: "none" }}
                />
                <Stack.Screen
                  name="login"
                  options={{
                    headerShown: false,
                    animation: "slide_from_bottom",
                  }}
                />
                <Stack.Screen
                  name="signup"
                  options={{
                    headerShown: false,
                    animation: "slide_from_bottom",
                  }}
                />
                <Stack.Screen
                  name="venue/[id]"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="cart" options={{ headerShown: false }} />
                <Stack.Screen
                  name="delivery-location"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="checkout"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="order-confirmation"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="order-tracker"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="rating" options={{ headerShown: false }} />
                <Stack.Screen
                  name="my-orders"
                  options={{ headerShown: false, animation: "none" }}
                />
                <Stack.Screen
                  name="profile"
                  options={{ headerShown: false, animation: "none" }}
                />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </AppProvider>
      </ClerkProvider>
    </ClerkProviderBase>
  );
}
