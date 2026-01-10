import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle, Clock, Truck, MapPin, Phone, MessageCircle } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { OrderStatus } from '@/types';
import { getOrderById } from '@/lib/database';

const statusSteps: { status: string; label: string; icon: any }[] = [
  { status: 'received', label: 'Order Received', icon: CheckCircle },
  { status: 'preparing', label: 'Preparing', icon: Clock },
  { status: 'on-delivery', label: 'Out for Delivery', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: MapPin },
];

export default function OrderTrackerScreen() {
  const { currentOrder, setCurrentOrder } = useApp();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [dbOrder, setDbOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>('received');

  useEffect(() => {
    if (orderId) {
      loadOrderFromDb();
    } else if (!currentOrder) {
      router.replace('/');
    }
  }, [orderId, currentOrder]);

  const loadOrderFromDb = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const order = await getOrderById(orderId);
      setDbOrder(order);
      setCurrentStatus(order.status as OrderStatus);
    } catch (error) {
      console.error('Error loading order:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  // If loading from DB
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator size="large" color="#00A896" />
        <Text className="text-charcoal/60 mt-4">Loading order...</Text>
      </SafeAreaView>
    );
  }

  // If no order data available
  if (!dbOrder && !currentOrder) return null;

  // Use dbOrder if available, otherwise use currentOrder from context
  const orderData = dbOrder || currentOrder;
  const orderCode = dbOrder?.order_code || currentOrder?.orderCode;
  const merchantName = dbOrder?.merchant?.name || (currentOrder?.items?.length > 0 ? currentOrder.items[0].venueName : null);
  const deliveryLocationName = dbOrder?.ordering_location?.name || currentOrder?.deliveryLocation?.name;
  const deliveryLocationNote = dbOrder?.instructions || currentOrder?.deliveryLocation?.customNote;
  const hospitalityCenterName = dbOrder?.hospitality_center?.name;

  const currentStepIndex = statusSteps.findIndex((step) => step.status === currentStatus);

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1">
        <View className="bg-white px-6 py-4 border-b border-sand/50 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4" activeOpacity={0.8}>
            <ArrowLeft size={24} color="#3E3D38" />
          </TouchableOpacity>
          <Text className="text-charcoal font-bold text-xl">Track Order</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6">
            {/* Order Info */}
            <View className="bg-white rounded-card p-6 shadow-soft mb-6">
              <Text className="text-charcoal/60 text-sm mb-1">Order Code</Text>
              <Text className="text-charcoal font-bold text-xl">{orderCode}</Text>
              {merchantName && (
                <Text className="text-charcoal/60 text-sm mb-4">from {merchantName}</Text>
              )}

              <View className="flex-row items-center mb-3 mt-4">
                <MapPin size={18} color="#00A896" />
                <Text className="text-charcoal/60 text-sm ml-2">Delivering to:</Text>
              </View>
              <Text className="text-charcoal font-semibold text-base">
                {deliveryLocationName}
              </Text>
              {deliveryLocationNote && (
                <Text className="text-charcoal/60 text-sm mt-1">
                  {deliveryLocationNote}
                </Text>
              )}
            </View>

            {/* Status Timeline */}
            <View className="bg-white rounded-card p-6 shadow-soft mb-6">
              <Text className="text-charcoal font-bold text-lg mb-6">Order Status</Text>

              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <View key={step.status} className="flex-row items-start mb-6">
                    <View className="items-center mr-4">
                      <View
                        className={`rounded-full p-2 ${
                          isCompleted ? 'bg-turquoise' : 'bg-sand'
                        }`}
                      >
                        <Icon size={24} color={isCompleted ? '#FAF7F2' : '#3E3D38'} />
                      </View>
                      {index < statusSteps.length - 1 && (
                        <View
                          className={`w-0.5 h-12 mt-2 ${
                            isCompleted ? 'bg-turquoise' : 'bg-sand'
                          }`}
                        />
                      )}
                    </View>

                    <View className="flex-1 pt-1">
                      <Text
                        className={`font-semibold text-base ${
                          isCompleted ? 'text-charcoal' : 'text-charcoal/40'
                        }`}
                      >
                        {step.label}
                      </Text>
                      {isCurrent && (
                        <Text className="text-turquoise text-sm mt-1">In Progress...</Text>
                      )}
                      {isCompleted && !isCurrent && (
                        <Text className="text-charcoal/60 text-sm mt-1">Completed</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Contact Options */}
            <View className="bg-white rounded-card p-6 shadow-soft">
              <Text className="text-charcoal font-bold text-lg mb-4">Need Help?</Text>

              <TouchableOpacity
                className="bg-sand rounded-button p-4 mb-3 flex-row items-center"
                activeOpacity={0.8}
              >
                <Phone size={22} color="#3E3D38" />
                <Text className="ml-3 text-charcoal font-semibold text-base">Call Waiter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-sand rounded-button p-4 flex-row items-center"
                activeOpacity={0.8}
              >
                <MessageCircle size={22} color="#3E3D38" />
                <Text className="ml-3 text-charcoal font-semibold text-base">Send Message</Text>
              </TouchableOpacity>
            </View>

            {currentStatus === 'delivered' && (
              <View className="mt-6">
                <TouchableOpacity
                  onPress={() => router.push('/rating')}
                  className="bg-coral rounded-button py-4 items-center active:scale-95"
                  activeOpacity={0.9}
                >
                  <Text className="text-white font-bold text-lg">Rate Your Experience</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
