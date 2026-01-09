import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Armchair, Coffee, Waves } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { mockDeliveryLocations } from '@/data/mockData';
import { DeliveryLocation } from '@/types';

const getLocationIcon = (type: string) => {
  switch (type) {
    case 'pool':
      return Waves;
    case 'cabana':
      return Armchair;
    case 'table':
      return Coffee;
    default:
      return MapPin;
  }
};

export default function DeliveryLocationScreen() {
  const { setDeliveryLocation } = useApp();
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(null);
  const [customNote, setCustomNote] = useState('');

  const handleContinue = () => {
    if (!selectedLocation) return;

    const locationWithNote = {
      ...selectedLocation,
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

            {mockDeliveryLocations.map((location) => {
              const Icon = getLocationIcon(location.type);
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
                    <Text className="text-charcoal/60 text-sm capitalize">
                      {location.type} Area
                    </Text>
                  </View>
                  {isSelected && (
                    <View className="bg-turquoise rounded-full w-6 h-6 items-center justify-center">
                      <Text className="text-white font-bold">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

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
