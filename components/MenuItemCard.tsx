import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, TextInput, Alert } from 'react-native';
import { Plus, X, Minus } from 'lucide-react-native';
import { MenuItem } from '@/types';
import { useApp } from '@/context/AppContext';

interface MenuItemCardProps {
  item: MenuItem;
  venueId: string;
  venueName: string;
}

export function MenuItemCard({ item, venueId, venueName }: MenuItemCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState('');
  const { addToCart, cartVenueId, cartVenueName, clearCart } = useApp();

  const handleAddToCart = () => {
    // Check if cart has items from a different venue
    if (cartVenueId && cartVenueId !== venueId) {
      Alert.alert(
        'Different Venue',
        `Your cart contains items from ${cartVenueName}. Would you like to clear your cart and add items from ${venueName}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Clear Cart',
            style: 'destructive',
            onPress: () => {
              clearCart();
              addItemToCart();
            },
          },
        ]
      );
      return;
    }
    addItemToCart();
  };

  const addItemToCart = () => {
    addToCart({
      ...item,
      quantity,
      customizations: customizations || undefined,
      venueId,
      venueName,
    });
    setModalVisible(false);
    setQuantity(1);
    setCustomizations('');
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="bg-white rounded-card overflow-hidden mb-4 shadow-soft flex-row active:scale-[0.98]"
        activeOpacity={0.9}
      >
        <Image source={{ uri: item.image }} className="w-28 h-28" resizeMode="cover" />
        <View className="flex-1 p-4 justify-between">
          <View>
            <Text className="text-charcoal font-bold text-base mb-1">{item.name}</Text>
            <Text className="text-charcoal/60 text-sm mb-2" numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-turquoise font-bold text-lg">${item.price}</Text>
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
          <View className="bg-cream rounded-t-3xl max-h-[85%]">
            <View className="relative">
              <Image source={{ uri: item.image }} className="w-full h-64" resizeMode="cover" />
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="absolute top-4 right-4 bg-white/90 rounded-full p-2 shadow-soft"
                activeOpacity={0.8}
              >
                <X size={24} color="#3E3D38" />
              </TouchableOpacity>
            </View>

            <View className="p-6">
              <Text className="text-charcoal font-bold text-2xl mb-2">{item.name}</Text>
              <Text className="text-charcoal/70 text-base mb-4">{item.description}</Text>
              
              {item.dietary && item.dietary.length > 0 && (
                <View className="flex-row mb-4">
                  {item.dietary.map((diet, index) => (
                    <View key={index} className="bg-turquoise/10 rounded-full px-3 py-1.5 mr-2">
                      <Text className="text-turquoise text-sm font-semibold">{diet}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Text className="text-charcoal/60 text-sm mb-2">Special Instructions (Optional)</Text>
              <TextInput
                value={customizations}
                onChangeText={setCustomizations}
                placeholder="e.g., No ice, extra lime"
                placeholderTextColor="#3E3D38"
                className="bg-white rounded-button p-4 mb-4 text-charcoal border border-sand"
                multiline
              />

              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-charcoal text-base font-semibold">Quantity</Text>
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    className="bg-sand rounded-full p-2"
                    activeOpacity={0.8}
                  >
                    <Minus size={20} color="#3E3D38" />
                  </TouchableOpacity>
                  <Text className="text-charcoal font-bold text-xl mx-6">{quantity}</Text>
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
                  Add to Cart • ${(item.price * quantity).toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
