import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  ChevronRight,
} from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { BottomTabBar } from "@/components/BottomTabBar";
import { Order, OrderStatus } from "@/types";
import { getOrdersByCustomerId } from "@/lib/database";
import { supabase } from "@/lib/supabase";

// Default user ID (customer with id=2 as per requirement)
const DEFAULT_USER_ID = 2;

const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case "received":
      return { label: "Order Received", icon: CheckCircle, color: "#00A896" };
    case "preparing":
      return { label: "Preparing", icon: Clock, color: "#FF6B35" };
    case "delivering":
      return { label: "Out for Delivery", icon: Truck, color: "#FF6B35" };
    case "delivered":
      return { label: "Delivered", icon: MapPin, color: "#00A896" };
    default:
      return { label: "Unknown", icon: Clock, color: "#3E3D38" };
  }
};

interface OrderCardProps {
  order: Order;
  isCurrent?: boolean;
}

function OrderCard({ order, isCurrent }: OrderCardProps) {
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <TouchableOpacity
      onPress={() => isCurrent && router.push("/order-tracker")}
      className={`bg-white rounded-card p-4 mb-4 shadow-soft ${isCurrent ? "border-2 border-turquoise" : ""}`}
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
            <Text className="text-charcoal font-bold text-base">
              {order.id}
            </Text>
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
            {order.items.length} {order.items.length === 1 ? "item" : "items"}:{" "}
            {order.items
              .map((item) => item.name)
              .slice(0, 2)
              .join(", ")}
            {order.items.length > 2 && "..."}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MyOrdersScreen() {
  const { currentOrder, orderHistory } = useApp();
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  // Subscribe to real-time updates for order status changes
  useEffect(() => {
    const channel = supabase
      .channel("my-orders-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "order",
          filter: `customer_id=eq.${DEFAULT_USER_ID}`,
        },
        (payload) => {
          const updatedOrder = payload.new;
          setDbOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === updatedOrder.id
                ? { ...order, ...updatedOrder }
                : order,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order",
          filter: `customer_id=eq.${DEFAULT_USER_ID}`,
        },
        () => {
          // Reload orders when a new order is inserted
          loadOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const orders = await getOrdersByCustomerId(DEFAULT_USER_ID);
      setDbOrders(orders);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Separate current orders (not delivered) and past orders (delivered)
  const currentOrders = dbOrders.filter(
    (order) => order.status !== "delivered",
  );
  const pastOrders = dbOrders.filter((order) => order.status === "delivered");

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <View className="flex-1">
        <View className="bg-cream px-6 py-4 border-b border-cream">
          <Text className="text-charcoal font-bold text-2xl">
            My Orders<View className="bg-cream"></View>
          </Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6 pb-24">
            {loading ? (
              <View className="bg-white rounded-card p-8 shadow-soft items-center">
                <ActivityIndicator size="large" color="#00A896" />
                <Text className="text-charcoal/60 mt-4">Loading orders...</Text>
              </View>
            ) : (
              <>
                {/* Current Orders Section */}
                {currentOrders.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-charcoal text-lg font-bold mb-4">
                      Current Orders
                    </Text>
                    {currentOrders.map((order) => (
                      <TouchableOpacity
                        key={order.id}
                        className="bg-white rounded-card p-4 mb-4 shadow-soft border-2 border-turquoise"
                        onPress={() =>
                          router.push(`/order-tracker?orderId=${order.id}`)
                        }
                      >
                        <View className="flex-row items-center justify-between mb-3">
                          <View>
                            <Text className="text-charcoal font-bold text-base">
                              Order #{order.order_code}
                            </Text>
                            {order.merchant && (
                              <Text className="text-turquoise text-sm font-medium">
                                {order.merchant.name}
                              </Text>
                            )}
                            <Text className="text-charcoal/60 text-sm">
                              {formatDate(order.ordered_at)}
                            </Text>
                          </View>
                          <ChevronRight size={20} color="#00A896" />
                        </View>

                        <View className="border-t border-sand/50 pt-3">
                          <View className="flex-row items-center justify-between mb-2">
                            <Text className="font-semibold text-sm text-turquoise">
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)}
                            </Text>
                            <Text className="text-turquoise font-bold text-base">
                              ${order.total_price.toFixed(2)}
                            </Text>
                          </View>

                          {order.ordering_location && (
                            <View className="space-y-1">
                              {order.hospitality_center && (
                                <View className="flex-row items-center mb-1">
                                  <MapPin
                                    size={14}
                                    color="#FF6B35"
                                    opacity={0.8}
                                  />
                                  <Text className="text-charcoal/70 text-sm ml-1.5 font-medium">
                                    {order.hospitality_center.name}
                                  </Text>
                                </View>
                              )}
                              <View className="flex-row items-center">
                                <MapPin
                                  size={14}
                                  color="#3E3D38"
                                  opacity={0.6}
                                />
                                <Text className="text-charcoal/60 text-sm ml-1.5">
                                  {order.ordering_location.name}
                                </Text>
                              </View>
                            </View>
                          )}

                          {order.instructions && (
                            <View className="mt-2">
                              <Text className="text-charcoal/60 text-sm">
                                Note: {order.instructions}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Order History Section */}
                <View>
                  <Text className="text-charcoal text-lg font-bold mb-4">
                    Order History
                  </Text>
                  {pastOrders.length === 0 ? (
                    <View className="bg-white rounded-card p-8 shadow-soft items-center">
                      <Text className="text-charcoal/60 text-base text-center">
                        No past orders yet.{"\n"}Your order history will appear
                        here.
                      </Text>
                    </View>
                  ) : (
                    pastOrders.map((order) => (
                      <TouchableOpacity
                        key={order.id}
                        className="bg-white rounded-card p-4 mb-4 shadow-soft"
                        onPress={() =>
                          router.push(`/order-tracker?orderId=${order.id}`)
                        }
                      >
                        <View className="flex-row items-center justify-between mb-3">
                          <View>
                            <Text className="text-charcoal font-bold text-base">
                              Order #{order.order_code}
                            </Text>
                            {order.merchant && (
                              <Text className="text-charcoal/70 text-sm font-medium">
                                {order.merchant.name}
                              </Text>
                            )}
                            <Text className="text-charcoal/60 text-sm">
                              {formatDate(order.ordered_at)}
                            </Text>
                          </View>
                          <ChevronRight
                            size={20}
                            color="#3E3D38"
                            opacity={0.5}
                          />
                        </View>

                        <View className="border-t border-sand/50 pt-3">
                          <View className="flex-row items-center justify-between mb-2">
                            <Text className="font-semibold text-sm text-turquoise">
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)}
                            </Text>
                            <Text className="text-turquoise font-bold text-base">
                              ${order.total_price.toFixed(2)}
                            </Text>
                          </View>

                          {order.ordering_location && (
                            <View className="space-y-1">
                              {order.hospitality_center && (
                                <View className="flex-row items-center mb-1">
                                  <MapPin
                                    size={14}
                                    color="#FF6B35"
                                    opacity={0.8}
                                  />
                                  <Text className="text-charcoal/70 text-sm ml-1.5 font-medium">
                                    {order.hospitality_center.name}
                                  </Text>
                                </View>
                              )}
                              <View className="flex-row items-center">
                                <MapPin
                                  size={14}
                                  color="#3E3D38"
                                  opacity={0.6}
                                />
                                <Text className="text-charcoal/60 text-sm ml-1.5">
                                  {order.ordering_location.name}
                                </Text>
                              </View>
                            </View>
                          )}

                          {order.instructions && (
                            <View className="mt-2">
                              <Text className="text-charcoal/60 text-sm">
                                Note: {order.instructions}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>
        <BottomTabBar />
      </View>
    </SafeAreaView>
  );
}
