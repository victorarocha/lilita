import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Calendar, LogOut, Camera, Pencil } from 'lucide-react-native';
import { BottomTabBar } from '@/components/BottomTabBar';
import { useClerk } from '@/context/ClerkContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export default function ProfileScreen() {
  const { isSignedIn, isLoaded, user, customer, signOut, syncCustomer, updateProfileImage } = useClerk();
  const router = useRouter();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  const handleEditAvatar = async () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose how you want to update your profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Photo',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Choose from Library',
          onPress: () => pickImage('library'),
        },
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library permission is needed to select photos.');
          return;
        }
      }

      // Launch image picker
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('[Profile] Image selection cancelled');
        return;
      }

      const selectedAsset = result.assets[0];
      console.log('[Profile] Image selected:', { uri: selectedAsset.uri, width: selectedAsset.width, height: selectedAsset.height });

      // Resize image if needed (max 1024px)
      let processedUri = selectedAsset.uri;
      let processedType = selectedAsset.mimeType || 'image/jpeg';

      if (selectedAsset.width > 1024 || selectedAsset.height > 1024) {
        console.log('[Profile] Resizing image...');
        const manipResult = await ImageManipulator.manipulateAsync(
          selectedAsset.uri,
          [{ resize: { width: 1024, height: 1024 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        processedUri = manipResult.uri;
        processedType = 'image/jpeg';
        console.log('[Profile] Image resized:', { uri: manipResult.uri, width: manipResult.width, height: manipResult.height });
      }

      // Upload the image
      setUploadingAvatar(true);

      const uploadResult = await updateProfileImage({
        uri: processedUri,
        type: processedType,
        name: 'avatar.jpg',
      });

      setUploadingAvatar(false);

      if (uploadResult.error) {
        console.error('[Profile] Avatar upload error:', uploadResult.error);
        Alert.alert('Upload Failed', uploadResult.error.message);
        return;
      }

      console.log('[Profile] Avatar updated successfully:', uploadResult.avatarUrl);
      Alert.alert('Success', 'Your profile picture has been updated!');

    } catch (error: any) {
      console.error('[Profile] Error picking/uploading image:', error);
      setUploadingAvatar(false);
      Alert.alert('Error', error.message || 'Failed to update profile picture');
    }
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
                <TouchableOpacity 
                  onPress={handleEditAvatar}
                  disabled={uploadingAvatar}
                  activeOpacity={0.8}
                  className="relative"
                >
                  {customer?.avatar_url || user?.imageUrl || user?.profile_image_url ? (
                    <Image 
                      source={{ uri: customer?.avatar_url || user?.imageUrl || user?.profile_image_url }}
                      className="w-28 h-28 rounded-full mb-4"
                      style={{ backgroundColor: '#E8DFD0' }}
                    />
                  ) : (
                    <View className="bg-turquoise rounded-full w-28 h-28 items-center justify-center mb-4 shadow-soft">
                      <User size={56} color="#FAF7F2" />
                    </View>
                  )}
                  
                  {/* Edit overlay button */}
                  <View className="absolute bottom-3 right-0 bg-coral rounded-full w-9 h-9 items-center justify-center shadow-soft border-2 border-cream">
                    {uploadingAvatar ? (
                      <ActivityIndicator size="small" color="#FAF7F2" />
                    ) : (
                      <Camera size={18} color="#FAF7F2" />
                    )}
                  </View>
                </TouchableOpacity>
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
