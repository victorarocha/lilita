import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Calendar, LogOut } from 'lucide-react-native';
import { BottomTabBar } from '@/components/BottomTabBar';
import { getCustomerById } from '@/lib/database';
import { Customer } from '@/types/database';

// Default user ID (customer with id=2 as per requirement)
const DEFAULT_USER_ID = 2;

export default function ProfileScreen() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomerById(DEFAULT_USER_ID);
      if (data) {
        setCustomer(data);
      } else {
        setError('User not found');
      }
    } catch (err) {
      console.error('Error loading customer:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {loading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#00A896" />
              <Text className="text-charcoal/60 mt-4">Loading profile...</Text>
            </View>
          ) : error ? (
            <View className="p-6">
              <View className="bg-coral/10 rounded-card p-6">
                <Text className="text-coral text-center font-semibold">{error}</Text>
              </View>
            </View>
          ) : customer ? (
            <View className="p-6">
              {/* Profile Avatar */}
              <View className="items-center mb-8">
                {customer.picture_url ? (
                  <Image 
                    source={{ uri: customer.picture_url }}
                    className="w-28 h-28 rounded-full mb-4"
                    style={{ backgroundColor: '#E8DFD0' }}
                  />
                ) : (
                  <View className="bg-turquoise rounded-full w-28 h-28 items-center justify-center mb-4 shadow-soft">
                    <User size={56} color="#FAF7F2" />
                  </View>
                )}
                <Text className="text-charcoal font-bold text-2xl">{customer.name}</Text>
                <Text className="text-charcoal/60 mt-1">Guest User</Text>
              </View>

              {/* Profile Details Card */}
              <View className="bg-white rounded-card shadow-soft p-6 mb-6">
                <Text className="text-charcoal font-bold text-lg mb-4">Account Details</Text>
                
                {/* Name */}
                <View className="flex-row items-center py-4 border-b border-sand/50">
                  <View className="bg-sand rounded-full p-3 mr-4">
                    <User size={20} color="#3E3D38" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-charcoal/60 text-sm">Full Name</Text>
                    <Text className="text-charcoal font-semibold text-base">{customer.name}</Text>
                  </View>
                </View>

                {/* Email */}
                <View className="flex-row items-center py-4 border-b border-sand/50">
                  <View className="bg-sand rounded-full p-3 mr-4">
                    <Mail size={20} color="#3E3D38" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-charcoal/60 text-sm">Email Address</Text>
                    <Text className="text-charcoal font-semibold text-base">{customer.email}</Text>
                  </View>
                </View>

                {/* Member Since */}
                <View className="flex-row items-center py-4">
                  <View className="bg-sand rounded-full p-3 mr-4">
                    <Calendar size={20} color="#3E3D38" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-charcoal/60 text-sm">Member Since</Text>
                    <Text className="text-charcoal font-semibold text-base">
                      {formatDate(customer.created_at)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Info Card */}
              <View className="bg-turquoise/10 rounded-card p-4">
                <Text className="text-turquoise text-center text-sm">
                  🏖️ Welcome to the resort! Enjoy seamless ordering from your poolside or cabana.
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <BottomTabBar />
      </View>
    </SafeAreaView>
  );
}
