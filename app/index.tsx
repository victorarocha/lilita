import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LocationSelector } from "@/components/LocationSelector";
import { VenueCard } from "@/components/VenueCard";
import { BottomTabBar } from "@/components/BottomTabBar";
import { getMerchantsByCenter } from "@/lib/database";
import { useApp } from "@/context/AppContext";
import { useClerk } from "@/context/ClerkContext";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { resortName, hospitalityCenterId } = useApp();
  const { isLoaded, isSignedIn, user } = useClerk();
  const router = useRouter();
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      router.replace('/login');
      return;
    }

    if (hospitalityCenterId) {
      loadVenues();
    }
  }, [isLoaded, isSignedIn, hospitalityCenterId]);

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
