import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';

export default function OrderConfirmationScreen() {
  const { currentOrder } = useApp();

  useEffect(() => {
    if (!currentOrder) {
      router.replace('/');
    }
  }, [currentOrder]);

  if (!currentOrder) return null;

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-turquoise/10 rounded-full p-6 mb-6">
          <CheckCircle size={80} color="#00A896" />
        </View>

        <Text className="text-charcoal text-3xl font-bold mb-2 text-center">Order Confirmed!</Text>
        <Text className="text-charcoal/60 text-base text-center mb-8">
          Your order has been received and is being prepared
        </Text>

        <View className="bg-white rounded-card p-6 shadow-soft w-full mb-6">
          <View className="items-center border-b border-sand/50 pb-4 mb-4">
            <Text className="text-charcoal/60 text-sm mb-1">Order Code</Text>
            <Text className="text-charcoal font-bold text-2xl">{currentOrder.orderCode}</Text>
          </View>

          <View className="items-center border-b border-sand/50 pb-4 mb-4">
            <Text className="text-charcoal/60 text-sm mb-1">Estimated Time</Text>
            <Text className="text-turquoise font-bold text-xl">{currentOrder.estimatedTime}</Text>
          </View>

          <View className="items-center">
            <Text className="text-charcoal/60 text-sm mb-1">Delivery Location</Text>
            <Text className="text-charcoal font-semibold text-base text-center">
              {currentOrder.deliveryLocation.name}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/order-tracker')}
          className="bg-turquoise rounded-button py-4 px-8 mb-3 w-full items-center active:scale-95"
          activeOpacity={0.9}
        >
          <Text className="text-white font-bold text-lg">Track Your Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/')}
          className="bg-white rounded-button py-4 px-8 w-full items-center border border-sand active:scale-95"
          activeOpacity={0.9}
        >
          <Text className="text-charcoal font-bold text-lg">Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
