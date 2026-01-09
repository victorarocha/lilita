import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';

export default function CartScreen() {
  const { cart, cartVenueName, updateCartItem, removeFromCart } = useApp();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 5;
  const total = subtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-cream">
        <View className="flex-1">
          <View className="bg-white px-6 py-4 border-b border-sand/50 flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4" activeOpacity={0.8}>
              <ArrowLeft size={24} color="#3E3D38" />
            </TouchableOpacity>
            <Text className="text-charcoal font-bold text-xl">Your Cart</Text>
          </View>
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-charcoal text-xl font-bold mb-2">Your cart is empty</Text>
            <Text className="text-charcoal/60 text-base text-center mb-6">
              Add items from the menu to get started
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-turquoise rounded-button px-8 py-4"
              activeOpacity={0.9}
            >
              <Text className="text-white font-bold text-base">Browse Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1">
        <View className="bg-white px-6 py-4 border-b border-sand/50">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity onPress={() => router.back()} className="mr-4" activeOpacity={0.8}>
              <ArrowLeft size={24} color="#3E3D38" />
            </TouchableOpacity>
            <Text className="text-charcoal font-bold text-xl">Your Cart</Text>
          </View>
          {cartVenueName && (
            <Text className="text-charcoal/60 text-sm ml-10">Ordering from {cartVenueName}</Text>
          )}
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6">
            {cart.map((item, index) => (
              <View
                key={`${item.id}-${index}`}
                className="bg-white rounded-card overflow-hidden mb-4 shadow-soft"
              >
                <View className="flex-row">
                  <Image source={{ uri: item.image }} className="w-24 h-24" resizeMode="cover" />
                  <View className="flex-1 p-4">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 pr-2">
                        <Text className="text-charcoal font-bold text-base mb-1">{item.name}</Text>
                        {item.customizations && (
                          <Text className="text-charcoal/60 text-sm">{item.customizations}</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => removeFromCart(item.id)}
                        className="p-1"
                        activeOpacity={0.8}
                      >
                        <Trash2 size={18} color="#FF6B35" />
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-turquoise font-bold text-lg">
                        ${(item.price * item.quantity).toFixed(2)}
                      </Text>
                      <View className="flex-row items-center">
                        <TouchableOpacity
                          onPress={() => updateCartItem(item.id, item.quantity - 1)}
                          className="bg-sand rounded-full p-1.5"
                          activeOpacity={0.8}
                        >
                          <Minus size={16} color="#3E3D38" />
                        </TouchableOpacity>
                        <Text className="text-charcoal font-bold text-base mx-3">
                          {item.quantity}
                        </Text>
                        <TouchableOpacity
                          onPress={() => updateCartItem(item.id, item.quantity + 1)}
                          className="bg-coral rounded-full p-1.5"
                          activeOpacity={0.8}
                        >
                          <Plus size={16} color="#FAF7F2" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <View className="bg-white rounded-card p-6 shadow-soft mt-2">
              <Text className="text-charcoal font-bold text-lg mb-4">Order Summary</Text>
              <View className="flex-row justify-between mb-3">
                <Text className="text-charcoal/60 text-base">Subtotal</Text>
                <Text className="text-charcoal font-semibold text-base">
                  ${subtotal.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-charcoal/60 text-base">Delivery Fee</Text>
                <Text className="text-charcoal font-semibold text-base">
                  ${deliveryFee.toFixed(2)}
                </Text>
              </View>
              <View className="border-t border-sand/50 mt-2 pt-3 flex-row justify-between">
                <Text className="text-charcoal font-bold text-xl">Total</Text>
                <Text className="text-turquoise font-bold text-xl">${total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="bg-white px-6 py-4 border-t border-sand/50">
          <TouchableOpacity
            onPress={() => router.push('/delivery-location')}
            className="bg-turquoise rounded-button py-4 items-center active:scale-95"
            activeOpacity={0.9}
          >
            <Text className="text-white font-bold text-lg">Choose Delivery Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
