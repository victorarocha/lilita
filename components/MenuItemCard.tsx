import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Plus, X, Minus, Check } from "lucide-react-native";
import { MenuItem } from "@/types";
import { useApp } from "@/context/AppContext";
import { getProductVariations } from "@/lib/database";
import { ProductVariation } from "@/types/database";

interface MenuItemCardProps {
  item: MenuItem;
  venueId: string;
  venueName: string;
}

export function MenuItemCard({ item, venueId, venueName }: MenuItemCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState("");
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [selectedVariation, setSelectedVariation] =
    useState<ProductVariation | null>(null);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const { addToCart, cartVenueId, cartVenueName, clearCart } = useApp();

  useEffect(() => {
    if (modalVisible) {
      fetchVariations();
    }
  }, [modalVisible]);

  const fetchVariations = async () => {
    try {
      setLoadingVariations(true);
      const data = await getProductVariations(Number(item.id));
      setVariations(data);
      setSelectedVariation(null);
    } catch (error) {
      console.error("Error fetching product variations:", error);
    } finally {
      setLoadingVariations(false);
    }
  };

  const calculateTotalPrice = () => {
    const basePrice =
      item.price + (selectedVariation ? selectedVariation.price : 0);
    return basePrice * quantity;
  };

  const handleAddToCart = () => {
    // Check if cart has items from a different venue
    if (cartVenueId && cartVenueId !== venueId) {
      Alert.alert(
        "Different Venue",
        `Your cart contains items from ${cartVenueName}. Would you like to clear your cart and add items from ${venueName}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Clear Cart",
            style: "destructive",
            onPress: () => {
              clearCart();
              addItemToCart();
            },
          },
        ],
      );
      return;
    }
    addItemToCart();
  };

  const addItemToCart = () => {
    const cartItem = {
      ...item,
      quantity,
      customizations: customizations || undefined,
      venueId,
      venueName,
      price: item.price + (selectedVariation ? selectedVariation.price : 0),
      selectedVariation: selectedVariation
        ? {
            id: selectedVariation.id,
            name: selectedVariation.name,
            price: selectedVariation.price,
          }
        : undefined,
    };
    addToCart(cartItem);
    setModalVisible(false);
    setQuantity(1);
    setCustomizations("");
    setSelectedVariation(null);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="bg-white rounded-card overflow-hidden mb-4 shadow-soft flex-row active:scale-[0.98]"
        activeOpacity={0.9}
      >
        <View className="overflow-hidden items-center justify-center h-[150px]">
          <Image
            source={{ uri: item.image }}
            style={{
              width: 150,
              height: 150,
            }}
            resizeMode="cover"
          />
        </View>
        <View className="flex-1 p-4 justify-between">
          <View>
            <Text className="text-charcoal font-bold text-base mb-1">
              {item.name}
            </Text>
            <Text className="text-charcoal/60 text-sm mb-2" numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-turquoise font-bold text-lg">
              ${item.price}
            </Text>
            <View className="bg-coral rounded-full p-1.5">
              <Plus size={18} color="#FAF7F2" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
      {/* Product Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ maxHeight: "92%" }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View
                className="bg-cream rounded-t-3xl"
                style={{ maxHeight: "100%" }}
              >
                <View className="relative">
                  <View
                    className="w-full h-56 overflow-hidden items-center justify-center"
                    style={{
                      borderTopLeftRadius: 24,
                      borderTopRightRadius: 24,
                    }}
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={{
                        width: 500,
                        height: 280,
                      }}
                      resizeMode="cover"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="absolute top-4 right-4 bg-white/90 rounded-full p-2 shadow-soft"
                    activeOpacity={0.8}
                  >
                    <X size={24} color="#3E3D38" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View className="p-6 pb-8">
                    <Text className="text-charcoal font-bold text-2xl mb-2">
                      {item.name}
                    </Text>
                    <Text className="text-charcoal/70 text-base mb-4">
                      {item.description}
                    </Text>

                    {item.dietary && item.dietary.length > 0 && (
                      <View className="flex-row mb-4">
                        {item.dietary.map((diet, index) => (
                          <View
                            key={index}
                            className="bg-turquoise/10 rounded-full px-3 py-1.5 mr-2"
                          >
                            <Text className="text-turquoise text-sm font-semibold">
                              {diet}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Product Variations */}
                    {loadingVariations ? (
                      <View className="py-4 items-center">
                        <ActivityIndicator size="small" color="#00A896" />
                      </View>
                    ) : (
                      variations.length > 0 && (
                        <View className="mb-4">
                          <Text className="text-charcoal/60 text-sm mb-2">
                            Select Variation (Optional)
                          </Text>
                          <View className="flex-row flex-wrap">
                            {variations.map((variation) => {
                              const isSelected =
                                selectedVariation?.id === variation.id;
                              return (
                                <TouchableOpacity
                                  key={variation.id}
                                  onPress={() =>
                                    setSelectedVariation(
                                      isSelected ? null : variation,
                                    )
                                  }
                                  className={`mr-2 mb-2 px-4 py-2.5 rounded-full flex-row items-center ${
                                    isSelected ? "bg-turquoise" : "bg-sand"
                                  }`}
                                  activeOpacity={0.8}
                                >
                                  {isSelected && (
                                    <Check
                                      size={14}
                                      color="#FAF7F2"
                                      style={{ marginRight: 6 }}
                                    />
                                  )}
                                  <Text
                                    className={`font-semibold ${
                                      isSelected
                                        ? "text-white"
                                        : "text-charcoal"
                                    }`}
                                  >
                                    {variation.name}
                                  </Text>
                                  <Text
                                    className={`ml-2 ${
                                      isSelected
                                        ? "text-white/80"
                                        : "text-charcoal/60"
                                    }`}
                                  >
                                    ${variation.price.toFixed(2)}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      )
                    )}

                    <Text className="text-charcoal/60 text-sm mb-2">
                      Special Instructions (Optional)
                    </Text>
                    <TextInput
                      value={customizations}
                      onChangeText={setCustomizations}
                      placeholder="e.g., No ice, extra lime"
                      placeholderTextColor="#3E3D38"
                      className="bg-white rounded-button p-4 mb-4 text-charcoal border border-sand"
                      multiline
                      blurOnSubmit={true}
                      returnKeyType="done"
                    />

                    <View className="flex-row items-center justify-between mb-6">
                      <Text className="text-charcoal text-base font-semibold">
                        Quantity
                      </Text>
                      <View className="flex-row items-center">
                        <TouchableOpacity
                          onPress={() => setQuantity(Math.max(1, quantity - 1))}
                          className="bg-sand rounded-full p-2"
                          activeOpacity={0.8}
                        >
                          <Minus size={20} color="#3E3D38" />
                        </TouchableOpacity>
                        <Text className="text-charcoal font-bold text-xl mx-6">
                          {quantity}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setQuantity(quantity + 1)}
                          className="bg-coral rounded-full p-2"
                          activeOpacity={0.8}
                        >
                          <Plus size={20} color="#FAF7F2" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={handleAddToCart}
                      className="bg-turquoise rounded-button py-4 items-center active:scale-95"
                      activeOpacity={0.9}
                    >
                      <Text className="text-white font-bold text-lg">
                        Add to Cart • ${calculateTotalPrice().toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}
