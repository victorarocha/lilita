import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, SafeAreaView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Star } from 'lucide-react-native';

export default function RatingScreen() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [tip, setTip] = useState<number | null>(null);

  const tipOptions = [5, 10, 15, 20];

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting');
      return;
    }

    Alert.alert('Thank You!', 'Your feedback has been submitted', [
      {
        text: 'OK',
        onPress: () => router.replace('/'),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1 px-6 py-8">
        <Text className="text-charcoal text-2xl font-bold mb-2 text-center">
          How was your experience?
        </Text>
        <Text className="text-charcoal/60 text-base text-center mb-8">
          Your feedback helps us serve you better
        </Text>

        {/* Star Rating */}
        <View className="bg-white rounded-card p-6 shadow-soft mb-6">
          <Text className="text-charcoal font-bold text-lg mb-4 text-center">Rate Your Order</Text>
          <View className="flex-row justify-center mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                className="mx-1"
                activeOpacity={0.8}
              >
                <Star
                  size={40}
                  color="#FF6B35"
                  fill={star <= rating ? '#FF6B35' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience (optional)"
            placeholderTextColor="#3E3D38"
            className="bg-cream rounded-button p-4 text-charcoal"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Tip Selection */}
        <View className="bg-white rounded-card p-6 shadow-soft mb-6">
          <Text className="text-charcoal font-bold text-lg mb-4 text-center">Add a Tip?</Text>
          <View className="flex-row justify-between mb-3">
            {tipOptions.map((amount) => (
              <TouchableOpacity
                key={amount}
                onPress={() => setTip(amount)}
                className={`rounded-button py-3 px-5 ${
                  tip === amount ? 'bg-turquoise' : 'bg-sand'
                }`}
                activeOpacity={0.8}
              >
                <Text
                  className={`font-bold text-base ${
                    tip === amount ? 'text-white' : 'text-charcoal'
                  }`}
                >
                  ${amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => setTip(null)}
            className={`rounded-button py-3 ${tip === null ? 'bg-sand' : 'bg-cream'}`}
            activeOpacity={0.8}
          >
            <Text className="text-charcoal font-semibold text-base text-center">No Tip</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-coral rounded-button py-4 items-center active:scale-95"
          activeOpacity={0.9}
        >
          <Text className="text-white font-bold text-lg">Submit Feedback</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/')}
          className="mt-4 py-3 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-charcoal/60 font-semibold text-base">Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
