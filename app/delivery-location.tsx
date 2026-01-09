import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Armchair, Waves, House, Sun } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { getOrderingLocationsByHospitalityCenter } from '@/lib/database';
import { OrderingLocation } from '@/types/database';
import { DeliveryLocation } from '@/types';

const getLocationIcon = (type: string) => {
  switch (type) {
    case 'alberca':
      return Waves;
    case 'villa':
      return House;
    case 'mesa':
      return Armchair;
    case 'playa':
      return Sun
    default:
      return MapPin;
  }
};

export default function DeliveryLocationScreen() {
  const { setDeliveryLocation, hospitalityCenterId } = useApp();
  const [selectedLocation, setSelectedLocation] = useState<OrderingLocation | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [locations, setLocations] = useState<OrderingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLocations() {
      if (!hospitalityCenterId) {
        setError('Please select a hospitality center first');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getOrderingLocationsByHospitalityCenter(hospitalityCenterId);
        setLocations(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching ordering locations:', err);
        setError('Failed to load delivery locations');
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, [hospitalityCenterId]);

  const handleContinue = () => {
    if (!selectedLocation) return;

    const locationWithNote: DeliveryLocation = {
      id: selectedLocation.id.toString(),
      name: selectedLocation.name,
      type: (selectedLocation.type as any) || 'custom',
      customNote: customNote || undefined,
    };

    setDeliveryLocation(locationWithNote);
    router.push('/checkout');
  };

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1">
        <View className="bg-white px-6 py-4 border-b border-sand/50 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4" activeOpacity={0.8}>
            <ArrowLeft size={24} color="#3E3D38" />
          </TouchableOpacity>
          <Text className="text-charcoal font-bold text-xl">Delivery Location</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6">
            <Text className="text-charcoal text-lg font-bold mb-4">
              Where should we deliver your order?
            </Text>

            {loading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#00A896" />
                <Text className="text-charcoal/60 mt-4">Loading delivery locations...</Text>
              </View>
            ) : error ? (
              <View className="bg-coral/10 rounded-card p-4 mb-4">
                <Text className="text-coral text-center">{error}</Text>
              </View>
            ) : locations.length === 0 ? (
              <View className="bg-sand rounded-card p-6 mb-4">
                <Text className="text-charcoal text-center">
                  No delivery locations available for this center
                </Text>
              </View>
            ) : (
              locations.map((location) => {
                const Icon = getLocationIcon(location.type || 'custom');
                const isSelected = selectedLocation?.id === location.id;

                return (
                  <TouchableOpacity
                    key={location.id}
                    onPress={() => setSelectedLocation(location)}
                    className={`bg-white rounded-card p-4 mb-3 shadow-soft flex-row items-center ${
                      isSelected ? 'border-2 border-turquoise' : 'border border-transparent'
                    }`}
                    activeOpacity={0.8}
                  >
                    <View
                      className={`rounded-full p-3 mr-3 ${
                        isSelected ? 'bg-turquoise' : 'bg-sand'
                      }`}
                    >
                      <Icon size={22} color={isSelected ? '#FAF7F2' : '#3E3D38'} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-charcoal font-semibold text-base">
                        {location.name}
                      </Text>
                      {location.type && (
                        <Text className="text-charcoal/60 text-sm capitalize">
                          Area de {location.type}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <View className="bg-turquoise rounded-full w-6 h-6 items-center justify-center">
                        <Text className="text-white font-bold">✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}

            {selectedLocation && (
              <View className="mt-4">
                <Text className="text-charcoal text-base font-semibold mb-2">
                  Additional Instructions (Optional)
                </Text>
                <TextInput
                  value={customNote}
                  onChangeText={setCustomNote}
                  placeholder="e.g., Near the palm tree, left side"
                  placeholderTextColor="#3E3D38"
                  className="bg-white rounded-button p-4 text-charcoal border border-sand"
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
          </View>
        </ScrollView>

        <View className="bg-white px-6 py-4 border-t border-sand/50">
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!selectedLocation}
            className={`rounded-button py-4 items-center active:scale-95 ${
              selectedLocation ? 'bg-turquoise' : 'bg-sand'
            }`}
            activeOpacity={0.9}
          >
            <Text className={`font-bold text-lg ${selectedLocation ? 'text-white' : 'text-charcoal/40'}`}>
              Continue to Payment
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
