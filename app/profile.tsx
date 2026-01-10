import React, { useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Calendar, LogOut } from 'lucide-react-native';
import { BottomTabBar } from '@/components/BottomTabBar';
import { useClerk } from '@/context/ClerkContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { isSignedIn, isLoaded, user, customer, signOut, syncCustomer } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Redirect to login if not signed in
      router.replace('/login');
    }
  }, [isLoaded, isSignedIn]);

  // Sync customer if not yet loaded
  useEffect(() => {
    if (isSignedIn && !customer) {
      syncCustomer();
    }
  }, [isSignedIn, customer]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  // Show loading while Clerk is loading or if signed in but customer not yet loaded
  const loading = !isLoaded || (isSignedIn && !customer && !user);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {loading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#00A896" />
              <Text className="text-charcoal/60 mt-4">Loading profile...</Text>
            </View>
          ) : !isSignedIn ? (
            <View className="p-6">
              <View className="bg-coral/10 rounded-card p-6">
                <Text className="text-coral text-center font-semibold">Please sign in to view your profile</Text>
              </View>
            </View>
          ) : (
            <View className="p-6">
              {/* Profile Avatar */}
              <View className="items-center mb-8">
                {user?.imageUrl || user?.profile_image_url ? (
                  <Image 
                    source={{ uri: user?.imageUrl || user?.profile_image_url }}
                    className="w-28 h-28 rounded-full mb-4"
                    style={{ backgroundColor: '#E8DFD0' }}
                  />
                ) : (
                  <View className="bg-turquoise rounded-full w-28 h-28 items-center justify-center mb-4 shadow-soft">
                    <User size={56} color="#FAF7F2" />
                  </View>
                )}
                <Text className="text-charcoal font-bold text-2xl">
                  {customer?.full_name || 
                    (user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.fullName || 'User')}
                </Text>
                <Text className="text-charcoal/60 mt-1">
                  {customer?.email || user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress}
                </Text>
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
                    <Text className="text-charcoal font-semibold text-base">
                      {customer?.full_name || 
                        (user?.firstName && user?.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user?.fullName || 'N/A')}
                    </Text>
                  </View>
                </View>

                {/* Email */}
                <View className="flex-row items-center py-4 border-b border-sand/50">
                  <View className="bg-sand rounded-full p-3 mr-4">
                    <Mail size={20} color="#3E3D38" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-charcoal/60 text-sm">Email Address</Text>
                    <Text className="text-charcoal font-semibold text-base">
                      {customer?.email || user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Member Since */}
                <View className="flex-row items-center py-4 border-b border-sand/50">
                  <View className="bg-sand rounded-full p-3 mr-4">
                    <Calendar size={20} color="#3E3D38" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-charcoal/60 text-sm">Member Since</Text>
                    <Text className="text-charcoal font-semibold text-base">
                      {customer?.created_at 
                        ? formatDate(customer.created_at)
                        : user?.createdAt 
                          ? formatDate(new Date(user.createdAt).toISOString())
                          : 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Sign Out Button */}
                <TouchableOpacity 
                  onPress={handleSignOut}
                  className="flex-row items-center py-4 mt-2"
                >
                  <View className="bg-coral/10 rounded-full p-3 mr-4">
                    <LogOut size={20} color="#FF6B6B" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-coral font-semibold text-base">Sign Out</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Info Card */}
              <View className="bg-turquoise/10 rounded-card p-4">
                <Text className="text-turquoise text-center text-sm">
                  🏖️ Welcome to the resort! Enjoy seamless ordering from your poolside or cabana.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <BottomTabBar />
      </View>
    </SafeAreaView>
  );
}
