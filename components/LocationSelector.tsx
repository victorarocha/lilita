import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import { MapPin, ChevronDown, X } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { getHospitalityCenters } from '@/lib/database';
import type { HospitalityCenter } from '@/types/database';

export function LocationSelector() {
  const { resortName, setResortName, setHospitalityCenterId } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [locations, setLocations] = useState<HospitalityCenter[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modalVisible) {
      loadLocations();
    }
  }, [modalVisible]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const centers = await getHospitalityCenters();
      console.log('Fetched hospitality centers:', centers);
      setLocations(centers);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (location: HospitalityCenter) => {
    setResortName(location.name);
    setHospitalityCenterId(location.id);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity 
        className="bg-white rounded-card p-4 mb-6 shadow-soft"
        onPress={() => {
          console.log('Location selector pressed');
          setModalVisible(true);
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="bg-turquoise/10 rounded-full p-2 mr-3">
              <MapPin size={20} color="#00A896" />
            </View>
            <View className="flex-1">
              <Text className="text-charcoal/60 text-xs mb-0.5">Current Location</Text>
              <Text className="text-charcoal font-semibold text-base">{resortName}</Text>
            </View>
          </View>
          <ChevronDown size={20} color="#3E3D38" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-cream rounded-t-3xl" style={{ maxHeight: '80%' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-charcoal/10">
              <Text className="text-charcoal text-xl font-bold">Select Location</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#3E3D38" />
              </TouchableOpacity>
            </View>

            {/* Location List */}
            {loading ? (
              <View className="p-8 items-center justify-center">
                <ActivityIndicator size="large" color="#00A896" />
              </View>
            ) : (
              <FlatList
                data={locations}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="bg-white rounded-card p-4 mb-3 shadow-soft"
                    onPress={() => handleSelectLocation(item)}
                  >
                    <View className="flex-row items-center">
                      <View className="bg-turquoise/10 rounded-full p-2 mr-3">
                        <MapPin size={20} color="#00A896" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-charcoal font-semibold text-base">
                          {item.name}
                        </Text>
                      </View>
                      {resortName === item.name && (
                        <View className="w-2 h-2 bg-turquoise rounded-full" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View className="p-8 items-center justify-center">
                    <Text className="text-charcoal/60 text-center">
                      No locations available
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
