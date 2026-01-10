import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard, Smartphone, MapPin } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { useClerk } from '@/context/ClerkContext';
import { Order, OrderStatus } from '@/types';
import { createOrder, createOrderProducts } from '@/lib/database';

type PaymentMethod = 'card' | 'apple' | 'google';

export default function CheckoutScreen() {
  const { cart, deliveryLocation, setCurrentOrder, addToOrderHistory, clearCart, hospitalityCenterId, cartVenueId } = useApp();
  const { customer, isSignedIn, syncCustomer, user } = useClerk();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 5;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!deliveryLocation) {
      Alert.alert('Error', 'Please select a delivery location');
      return;
    }

    // Check if user is signed in
    if (!isSignedIn) {
      Alert.alert('Sign In Required', 'Please sign in to place an order.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/login') }
      ]);
      return;
    }

    setIsProcessing(true);

    try {
      // Validate delivery location ID
      const locationId = Number(deliveryLocation.id);
      if (isNaN(locationId) || locationId <= 0) {
        throw new Error('Invalid delivery location');
      }

      // Use the authenticated customer from Clerk context
      let resolvedCustomer = customer;
      
      // If customer is not synced yet, sync now
      if (!resolvedCustomer && user) {
        console.log('[Checkout] Customer not synced, syncing now...');
        resolvedCustomer = await syncCustomer();
      }
      
      if (!resolvedCustomer?.id) {
        throw new Error('Unable to resolve customer. Please try signing out and signing in again.');
      }
      
      console.log('[Checkout] Using customer ID:', resolvedCustomer.id, 'for clerk user:', user?.id);

      // Create the order in the database
      const orderInstructions = deliveryLocation.customNote?.trim() || null;
      
      const dbOrder = await createOrder({
        ordering_location_id: locationId,
        customer_id: resolvedCustomer.id,
        total_price: total,
        instructions: orderInstructions,
        status: 'received',
        hospitality_center_id: hospitalityCenterId || undefined,
        merchant_id: cartVenueId ? Number(cartVenueId) : undefined,
      });
      
      if (!dbOrder || !dbOrder.order_code) {
        throw new Error('Order creation failed - no order code returned');
      }

      // Create order products with variations
      const orderProducts = cart.map(item => ({
        product_id: Number(item.id),
        price: item.price * item.quantity,
        product_variation_json: item.selectedVariation ? {
          id: item.selectedVariation.id,
          name: item.selectedVariation.name,
          price: item.selectedVariation.price,
        } : null,
      }));

      await createOrderProducts(dbOrder.id, orderProducts);

      // Create local order object for the app
      const order: Order = {
        id: dbOrder.id.toString(),
        orderCode: dbOrder.order_code,
        items: cart,
        deliveryLocation,
        status: 'received' as OrderStatus,
        total,
        createdAt: new Date(),
        estimatedTime: '15-20 min',
      };

      setCurrentOrder(order);
      addToOrderHistory(order);
      clearCart();
      setIsProcessing(false);
      router.replace('/order-confirmation');
    } catch (error: any) {
      console.error('Error creating order:', error);
      setIsProcessing(false);
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      Alert.alert('Error', `Failed to place order: ${errorMessage}`);
    }
  };

  if (!deliveryLocation) {
    router.back();
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1">
        <View className="bg-white px-6 py-4 border-b border-sand/50 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4" activeOpacity={0.8}>
            <ArrowLeft size={24} color="#3E3D38" />
          </TouchableOpacity>
          <Text className="text-charcoal font-bold text-xl">Checkout</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6">
            {/* Delivery Location */}
            <View className="bg-white rounded-card p-6 shadow-soft mb-4">
              <Text className="text-charcoal font-bold text-lg mb-3">Delivery Location</Text>
              <View className="flex-row items-start">
                <View className="bg-turquoise/10 rounded-full p-2 mr-3">
                  <MapPin size={20} color="#00A896" />
                </View>
                <View className="flex-1">
                  <Text className="text-charcoal font-semibold text-base">
                    {deliveryLocation.name}
                  </Text>
                  {deliveryLocation.customNote && (
                    <Text className="text-charcoal/60 text-sm mt-1">
                      {deliveryLocation.customNote}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Payment Method */}
            <View className="bg-white rounded-card p-6 shadow-soft mb-4">
              <Text className="text-charcoal font-bold text-lg mb-3">Payment Method</Text>

              <TouchableOpacity
                onPress={() => setSelectedPayment('card')}
                className={`rounded-button p-4 mb-3 flex-row items-center ${
                  selectedPayment === 'card'
                    ? 'bg-turquoise/10 border-2 border-turquoise'
                    : 'bg-sand'
                }`}
                activeOpacity={0.8}
              >
                <CreditCard size={24} color={selectedPayment === 'card' ? '#00A896' : '#3E3D38'} />
                <Text
                  className={`ml-3 font-semibold text-base ${
                    selectedPayment === 'card' ? 'text-turquoise' : 'text-charcoal'
                  }`}
                >
                  Credit / Debit Card
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedPayment('apple')}
                className={`rounded-button p-4 mb-3 flex-row items-center ${
                  selectedPayment === 'apple'
                    ? 'bg-turquoise/10 border-2 border-turquoise'
                    : 'bg-sand'
                }`}
                activeOpacity={0.8}
              >
                <Smartphone size={24} color={selectedPayment === 'apple' ? '#00A896' : '#3E3D38'} />
                <Text
                  className={`ml-3 font-semibold text-base ${
                    selectedPayment === 'apple' ? 'text-turquoise' : 'text-charcoal'
                  }`}
                >
                  Apple Pay
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedPayment('google')}
                className={`rounded-button p-4 flex-row items-center ${
                  selectedPayment === 'google'
                    ? 'bg-turquoise/10 border-2 border-turquoise'
                    : 'bg-sand'
                }`}
                activeOpacity={0.8}
              >
                <Smartphone size={24} color={selectedPayment === 'google' ? '#00A896' : '#3E3D38'} />
                <Text
                  className={`ml-3 font-semibold text-base ${
                    selectedPayment === 'google' ? 'text-turquoise' : 'text-charcoal'
                  }`}
                >
                  Google Pay
                </Text>
              </TouchableOpacity>
            </View>

            {/* Order Summary */}
            <View className="bg-white rounded-card p-6 shadow-soft">
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
            onPress={handlePlaceOrder}
            disabled={isProcessing}
            className={`rounded-button py-4 items-center active:scale-95 ${
              isProcessing ? 'bg-sand' : 'bg-coral'
            }`}
            activeOpacity={0.9}
          >
            <Text className="text-white font-bold text-lg">
              {isProcessing ? 'Processing...' : `Place Order • $${total.toFixed(2)}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
