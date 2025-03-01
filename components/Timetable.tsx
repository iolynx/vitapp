import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Text,
  Modal,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { Card, Button } from 'react-native-paper';

const { width, height } = Dimensions.get('window'); // Get screen width and height

// Define the type for class details
type ClassDetails = {
  name: string;
  time: string;
  faculty: string;
  venue: string;
  attendance: string;
};

const Timetable = () => {
  const [selectedDay, setSelectedDay] = useState(0); // Track the selected day
  const [selectedClass, setSelectedClass] = useState<ClassDetails | null>(null); // Track the selected class for details
  const flatListRef = useRef<FlatList>(null); // Reference to the FlatList for scrolling
  const slideAnim = useRef(new Animated.Value(height)).current; // Animation value for bottom sheet

  const timetableData: { day: string; classes: ClassDetails[] }[] = [
    {
      day: 'Monday',
      classes: [
        { name: 'BCSE401L', time: '08:55 - 09:45', faculty: 'FACULTY NAME', venue: 'VENUE', attendance: '95%' },
        { name: 'BHUM110E', time: '09:50 - 10:40', faculty: 'FACULTY NAME', venue: 'VENUE', attendance: '90%' },
        { name: 'BCSE209L', time: '10:45 - 11:35', faculty: 'FACULTY NAME', venue: 'VENUE', attendance: '85%' },
      ],
    },
    {
      day: 'Tuesday',
      classes: [
        { name: 'BCSE401L', time: '08:00 - 08:50', faculty: 'FACULTY NAME', venue: 'VENUE', attendance: '95%' },
        { name: 'BHUM110E', time: '08:55 - 09:45', faculty: 'FACULTY NAME', venue: 'VENUE', attendance: '90%' },
      ],
    },
    // Add more days as needed
  ];

  const days = ['M', 'T', 'W', 'T', 'F']; // Shortened day names for the tab bar

  // Handle day selection from the tab bar
  const handleDaySelect = (index: number) => {
    setSelectedDay(index);
    flatListRef.current?.scrollToIndex({ index, animated: true }); // Scroll to the selected day
  };

  // Handle class button press
  const handleClassPress = (cls: ClassDetails) => {
    setSelectedClass(cls); // Set the selected class to show details
    Animated.timing(slideAnim, {
      toValue: 0, // Slide up to the top of the screen
      duration: 300, // Animation duration
      useNativeDriver: true, // Use native driver for better performance
    }).start();
  };

  // Handle closing the bottom sheet
  const closeBottomSheet = () => {
    Animated.timing(slideAnim, {
      toValue: height, // Slide down to the bottom of the screen
      duration: 300, // Animation duration
      useNativeDriver: true, // Use native driver for better performance
    }).start(() => {
      setSelectedClass(null); // Reset the selected class after animation
    });
  };

  // Render each day's classes in a box
  const renderDay = ({ item }: { item: { day: string; classes: ClassDetails[] } }) => (
    <View style={styles.dayContainer}>
      {item.classes.map((cls, index) => (
        <TouchableOpacity key={index} onPress={() => handleClassPress(cls)}>
          <Card style={styles.classCard}>
            <Card.Content>
              <Text style={styles.classText}>{cls.name}</Text>
              <Text style={styles.classText}>{cls.time}</Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tabButton, selectedDay === index && styles.selectedTab]}
            onPress={() => handleDaySelect(index)}
          >
            <Text style={styles.tabText}>{day}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Horizontal FlatList for Timetable */}
      <FlatList
        ref={flatListRef}
        data={timetableData}
        renderItem={renderDay}
        keyExtractor={(item) => item.day}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.floor(event.nativeEvent.contentOffset.x / width);
          setSelectedDay(index); // Update selected day when scrolling
        }}
      />

      {/* Bottom Sheet for Course Details */}
      <Modal visible={!!selectedClass} transparent={true} animationType="none">
        <TouchableWithoutFeedback onPress={closeBottomSheet}>
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.bottomSheet,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Card mode='contained' style={styles.modalCard}>
                <Card.Content>
                  <Text style={styles.modalTitle}>{selectedClass?.name}</Text>
                  <Text style={styles.modalText}>Time: {selectedClass?.time}</Text>
                  <Text style={styles.modalText}>Faculty: {selectedClass?.faculty}</Text>
                  <Text style={styles.modalText}>Venue: {selectedClass?.venue}</Text>
                  <Text style={styles.modalText}>Attendance: {selectedClass?.attendance}</Text>
                </Card.Content>
              </Card>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    marginTop: 100,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  tabButton: {
    padding: 10,
    borderRadius: 5,
  },
  selectedTab: {
    backgroundColor: 'lightgrey', // Selected tab background color
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff', // White text for tabs
  },
  dayContainer: {
    width: width, // Full screen width
    paddingHorizontal: 16,
    height: 80, // Fixed height for the day container
  },
  classCard: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    height: 80, // Fixed height for class cards
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
  },
  classText: {
    fontSize: 20,
    color: '#fff', // White text for class names
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'flex-end', // Align bottom sheet to the bottom
  },
  bottomSheet: {
    width: '100%',
    backgroundColor: '#333', // Dark background for bottom sheet
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#333', // Dark background for modal
    borderRadius: 10,
    
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff', // White text for modal title
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#fff', // White text for modal content
  },
});

export default Timetable;