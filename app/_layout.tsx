import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
import { AppProvider } from "@/context/AppContext";
import { ClerkProvider as ClerkProviderBase } from "@clerk/clerk-expo";
import { ClerkProvider } from "@/context/ClerkContext";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

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

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore splash screen errors in development/web
      });
    }
  }, [loaded]);

  if (!loaded) {
    return null;
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
