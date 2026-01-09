import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Clock, Star } from 'lucide-react-native';
import { getMerchantById, getProductsByMerchant, getProductCategories } from '@/lib/database';
import { MenuItemCard } from '@/components/MenuItemCard';
import { BottomTabBar } from '@/components/BottomTabBar';
import { formatPrepTimeRange } from '@/src/utils/utility_fnc';

export default function VenueScreen() {
  const { id } = useLocalSearchParams();
  const [venue, setVenue] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVenueData();
  }, [id]);

  const loadVenueData = async () => {
    try {
      setLoading(true);
      
      const merchantData = await getMerchantById(id as string);
      setVenue({
        id: merchantData.id,
        name: merchantData.name,
        description: merchantData.description || '',
        image: merchantData.image_url || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
        cuisine: merchantData.cuisine_type || 'Various',
        prepTime: merchantData.prep_time || 15,
        rating: merchantData.rating || 4.5,
      });

      const productsData = await getProductsByMerchant(id as string);
      setProducts(productsData);

      const categoriesData = await getProductCategories();
      setCategories(categoriesData);
      
      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id);
      }
    } catch (error) {
      console.error('Error loading venue data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter categories to only show those that have products
  const categoriesWithItems = categories.filter(category => 
    products.some(product => product.category_id === category.id)
  );

  const filteredItems = products.filter(
    (product) => product.category_id === selectedCategory
  );

  // Auto-select first category with items if current selection has no items
  useEffect(() => {
    if (categoriesWithItems.length > 0 && !categoriesWithItems.find(c => c.id === selectedCategory)) {
      setSelectedCategory(categoriesWithItems[0].id);
    }
  }, [categoriesWithItems, selectedCategory]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00A896" />
        </View>
      </SafeAreaView>
    );
  }

  if (!venue) {
    return (
      <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-charcoal text-lg">Venue not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="flex-1">
        {/* Header Image */}
        <View className="relative">
          <Image source={{ uri: venue.image }} className="w-full h-56" resizeMode="cover" />
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-4 left-4 bg-white/90 rounded-full p-2.5 shadow-soft"
            activeOpacity={0.8}
          >
            <ArrowLeft size={24} color="#3E3D38" />
          </TouchableOpacity>
        </View>

        {/* Venue Info */}
        <View className="bg-white px-6 py-4 border-b border-sand/50">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 pr-2">
              <Text className="text-charcoal font-bold text-2xl mb-1">{venue.name}</Text>
              {venue.description && (
                <Text className="text-charcoal/60 text-base mb-1">{venue.description}</Text>
              )}
              <Text className="text-charcoal/60 text-base">{venue.cuisine}</Text>
            </View>
            <View className="bg-coral/10 rounded-full px-3 py-1.5 flex-row items-center">
              <Star size={16} color="#FF6B35" fill="#FF6B35" />
              <Text className="text-coral font-semibold text-base ml-1">{venue.rating}</Text>
            </View>
          </View>
          <View className="flex-row items-center mt-2">
            <Clock size={16} color="#3E3D38" opacity={0.6} />
            <Text className="text-charcoal/60 text-sm ml-1.5">{formatPrepTimeRange(Number(venue.prepTime))}</Text>
          </View>
        </View>

        {/* Category Tabs */}
        {categoriesWithItems.length > 0 && (
          <View className="bg-white border-b border-sand/50">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12 }}
            >
              {categoriesWithItems.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  className={`mr-3 px-5 py-2.5 rounded-full ${
                    selectedCategory === category.id ? 'bg-turquoise' : 'bg-sand'
                  }`}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`font-semibold text-base ${
                      selectedCategory === category.id ? 'text-white' : 'text-charcoal'
                    }`}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Menu Items */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 py-4 pb-24">
            {filteredItems.map((product) => {
              const menuItem = {
                id: product.id,
                name: product.name,
                description: product.description || '',
                price: product.price,
                image: product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
                category: product.product_category?.name || '',
              };
              return (
                <MenuItemCard 
                  key={product.id} 
                  item={menuItem} 
                  venueId={venue.id} 
                  venueName={venue.name} 
                />
              );
            })}
          </View>
        </ScrollView>

        <BottomTabBar />
      </View>
    </SafeAreaView>
  );
}
