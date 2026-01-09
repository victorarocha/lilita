import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Clock, CheckCircle, Truck, MapPin, ChevronRight } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { BottomTabBar } from '@/components/BottomTabBar';
import { Order, OrderStatus } from '@/types';

const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case 'received':
      return { label: 'Order Received', icon: CheckCircle, color: '#00A896' };
    case 'preparing':
      return { label: 'Preparing', icon: Clock, color: '#FF6B35' };
    case 'delivering':
      return { label: 'Out for Delivery', icon: Truck, color: '#FF6B35' };
    case 'delivered':
      return { label: 'Delivered', icon: MapPin, color: '#00A896' };
    default:
      return { label: 'Unknown', icon: Clock, color: '#3E3D38' };
  }
};

interface OrderCardProps {
  order: Order;
  isCurrent?: boolean;
}

function OrderCard({ order, isCurrent }: OrderCardProps) {
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      onPress={() => isCurrent && router.push('/order-tracker')}
      className={`bg-white rounded-card p-4 mb-4 shadow-soft ${isCurrent ? 'border-2 border-turquoise' : ''}`}
      activeOpacity={isCurrent ? 0.8 : 1}
      disabled={!isCurrent}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View
            className="rounded-full p-2 mr-3"
            style={{ backgroundColor: `${statusConfig.color}15` }}
          >
            <StatusIcon size={20} color={statusConfig.color} />
          </View>
          <View>
            <Text className="text-charcoal font-bold text-base">{order.id}</Text>
            <Text className="text-charcoal/60 text-sm">{formattedDate}</Text>
          </View>
        </View>
        {isCurrent && <ChevronRight size={20} color="#3E3D38" />}
      </View>

      <View className="border-t border-sand/50 pt-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text
            className="font-semibold text-sm"
            style={{ color: statusConfig.color }}
          >
            {statusConfig.label}
          </Text>
          <Text className="text-turquoise font-bold text-base">
            ${order.total.toFixed(2)}
          </Text>
        </View>

        <View className="flex-row items-center">
          <MapPin size={14} color="#3E3D38" opacity={0.6} />
          <Text className="text-charcoal/60 text-sm ml-1.5">
            {order.deliveryLocation.name}
          </Text>
        </View>

        <View className="mt-3">
          <Text className="text-charcoal/60 text-sm">
            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}:{' '}
            {order.items.map((item) => item.name).slice(0, 2).join(', ')}
            {order.items.length > 2 && '...'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MyOrdersScreen() {
  const { currentOrder, orderHistory } = useApp();

  const pastOrders = orderHistory.filter(
    (order) => order.status === 'delivered' || order.id !== currentOrder?.id
  );

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="flex-1">
        <View className="bg-white px-6 py-4 border-b border-sand/50">
          <Text className="text-charcoal font-bold text-2xl">My Orders</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6 pb-24">
            {currentOrder && currentOrder.status !== 'delivered' && (
              <View className="mb-6">
                <Text className="text-charcoal text-lg font-bold mb-4">
                  Current Order
                </Text>
                <OrderCard order={currentOrder} isCurrent />
              </View>
            )}

            <View>
              <Text className="text-charcoal text-lg font-bold mb-4">
                Order History
              </Text>
              {pastOrders.length === 0 ? (
                <View className="bg-white rounded-card p-8 shadow-soft items-center">
                  <Text className="text-charcoal/60 text-base text-center">
                    No past orders yet.{'\n'}Your order history will appear here.
                  </Text>
                </View>
              ) : (
                pastOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </View>
          </View>
        </ScrollView>
        <BottomTabBar />
      </View>
    </SafeAreaView>
  );
}
