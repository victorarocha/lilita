import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Clock, Star } from 'lucide-react-native';
import { Venue } from '@/types';
import { router } from 'expo-router';
import { formatPrepTimeRange } from '@/src/utils/utility_fnc';

interface VenueCardProps {
  venue: Venue;
}

export function VenueCard({ venue }: VenueCardProps) {
  const handlePress = () => {
    router.push({
      pathname: '/venue/[id]',
      params: { id: venue.id, name: venue.name },
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white rounded-card overflow-hidden mb-4 shadow-soft active:scale-[0.98]"
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: venue.image }}
        className="w-full h-48"
        resizeMode="cover"
      />
      <View className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 pr-2">
            <Text className="text-charcoal font-bold text-lg mb-1">{venue.name}</Text>
            {venue.description && (
              <Text className="text-charcoal/60 text-sm mb-1" numberOfLines={2}>{venue.description}</Text>
            )}
            <Text className="text-charcoal/60 text-sm">{venue.cuisineType}</Text>
          </View>
          <View className="bg-coral/10 rounded-full px-3 py-1.5 flex-row items-center">
            <Star size={14} color="#FF6B35" fill="#FF6B35" />
            <Text className="text-coral font-semibold text-sm ml-1">{venue.rating}</Text>
          </View>
        </View>
        
        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row items-center">
            <Clock size={16} color="#3E3D38" opacity={0.6} />
            <Text className="text-charcoal/60 text-sm ml-1.5">{formatPrepTimeRange(Number(venue.prepTime))}</Text>
          </View>
          
          <View className="flex-row flex-wrap justify-end flex-1 ml-2">
            {(venue.tags || []).slice(0, 2).map((tag, index) => (
              <View key={index} className="bg-sand rounded-full px-2.5 py-1 ml-1.5">
                <Text className="text-charcoal text-xs">{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
