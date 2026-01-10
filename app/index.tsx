import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LocationSelector } from "@/components/LocationSelector";
import { VenueCard } from "@/components/VenueCard";
import { BottomTabBar } from "@/components/BottomTabBar";
import { getMerchantsByCenter } from "@/lib/database";
import { useApp } from "@/context/AppContext";
import { useClerk } from "@/context/ClerkContext";
import { useRouter, useRootNavigation } from "expo-router";

// Detect if we're running in a browser environment (more reliable than Platform.OS on web)
const isWebBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export default function HomeScreen() {
  const { resortName, hospitalityCenterId } = useApp();
  const { isLoaded, isSignedIn, user } = useClerk();
  const router = useRouter();
  const rootNavigation = useRootNavigation();
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const hasRedirected = useRef(false);
  const [navigationReady, setNavigationReady] = useState(false);

  // Track navigation readiness
  useEffect(() => {
    if (rootNavigation?.isReady()) {
      setNavigationReady(true);
    } else {
      const timer = setTimeout(() => {
        setNavigationReady(rootNavigation?.isReady?.() || false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [rootNavigation]);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn && !hasRedirected.current) {
      hasRedirected.current = true;
      
      // On web/browser, use window.location for reliable redirect
      // This avoids "couldn't find navigation context" errors
      // Use isWebBrowser check which is more reliable than Platform.OS in some environments
      if (isWebBrowser || Platform.OS === 'web') {
        window.location.href = '/login';
        return;
      }
      
      // On native, wait for navigation to be ready
      if (navigationReady || rootNavigation?.isReady?.()) {
        try {
          router.replace('/login');
        } catch (err) {
          console.error('[HomeScreen] Navigation error:', err);
          // Retry after a delay
          setTimeout(() => {
            try {
              router.replace('/login');
            } catch (retryErr) {
              console.error('[HomeScreen] Retry navigation error:', retryErr);
            }
          }, 300);
        }
      } else {
        // Navigation not ready, defer
        hasRedirected.current = false;
        setTimeout(() => {
          hasRedirected.current = false;
        }, 100);
      }
      return;
    }

    if (hospitalityCenterId) {
      loadVenues();
    }
  }, [isLoaded, isSignedIn, hospitalityCenterId, navigationReady]);

  const loadVenues = async () => {
    if (!hospitalityCenterId) return;
    
    try {
      setLoading(true);
      const merchants = await getMerchantsByCenter(hospitalityCenterId);

      // Transform merchant data to match Venue interface
      const transformedVenues = merchants.map((merchant) => ({
        id: merchant.id,
        name: merchant.name,
        description: merchant.description || "",
        image:
          merchant.image_url ||
          "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
        cuisine: merchant.cuisine_type || "Various",
        prepTime: merchant.prep_time || 15,
        rating: merchant.rating || 4.5,
      }));

      setVenues(transformedVenues);
    } catch (error) {
      console.error("Error loading venues:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <View className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 pt-6 pb-24">
            <Text className="text-charcoal text-3xl font-bold mb-2">
              Good Afternoon{user?.first_name ? `, ${user.first_name}` : ''}
            </Text>
            <Text className="text-charcoal/60 text-base mb-6">
              What can we bring to you today?
            </Text>

            <LocationSelector />

            <Text className="text-charcoal text-xl font-bold mb-4">
              Available Venues
            </Text>

            {venues.length === 0 ? (
              <Text className="text-charcoal/60 text-center py-12">
                Select a location to see the available venues
              </Text>
            ) : (
              venues.map((venue) => <VenueCard key={venue.id} venue={venue} />)
            )}
          </View>
        </ScrollView>
        <BottomTabBar />
      </View>
    </SafeAreaView>
  );
}
