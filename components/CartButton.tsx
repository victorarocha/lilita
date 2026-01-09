import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { router } from 'expo-router';

export function CartButton() {
  const { cart } = useApp();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (itemCount === 0) return null;

  return (
    <TouchableOpacity
      onPress={() => router.push('/cart')}
      className="absolute bottom-20 right-6 bg-coral rounded-full shadow-lift flex-row items-center px-6 py-4 active:scale-95"
      activeOpacity={0.9}
    >
      <ShoppingBag size={24} color="#FAF7F2" />
      <View className="bg-white/20 rounded-full w-6 h-6 items-center justify-center ml-2">
        <Text className="text-cream font-bold text-sm">{itemCount}</Text>
      </View>
      <Text className="text-cream font-bold text-base ml-3">View Cart</Text>
    </TouchableOpacity>
  );
}
