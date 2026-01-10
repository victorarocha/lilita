import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Home, ClipboardList, ShoppingBag, User } from 'lucide-react-native';
import { usePathname, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';

export function BottomTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { cart } = useApp();
  
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const tabs = [
    { id: 'home', label: 'Home', icon: Home, route: '/' },
    { id: 'orders', label: 'My Orders', icon: ClipboardList, route: '/my-orders' },
    { id: 'profile', label: 'Profile', icon: User, route: '/profile' },
  ];

  const isTabActive = (route: string) => {
    if (route === '/') {
      return pathname === '/' || pathname === '/index';
    }
    return pathname === route;
  };

  return (
    <View 
      className="bg-white border-t border-sand/50"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {/* View Cart Button */}
      {itemCount > 0 && (
        <TouchableOpacity
          onPress={() => router.push('/cart')}
          className="bg-coral mx-4 mt-3 rounded-button flex-row items-center justify-center py-3 active:scale-95"
          activeOpacity={0.9}
        >
          <ShoppingBag size={20} color="#FAF7F2" />
          <View className="bg-white/20 rounded-full w-5 h-5 items-center justify-center ml-2">
            <Text className="text-cream font-bold text-xs">{itemCount}</Text>
          </View>
          <Text className="text-cream font-bold text-base ml-3">View Cart</Text>
        </TouchableOpacity>
      )}
      
      {/* Tab Navigation */}
      <View className="flex-row items-center justify-around px-4 py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = isTabActive(tab.route);

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => router.push(tab.route as any)}
              className="items-center justify-center flex-1 py-2"
              activeOpacity={0.7}
            >
              <Icon size={24} color={isActive ? '#00A896' : '#3E3D38'} opacity={isActive ? 1 : 0.5} />
              <Text
                className={`text-xs mt-1 font-semibold ${
                  isActive ? 'text-turquoise' : 'text-charcoal/50'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
