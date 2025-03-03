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
  ScrollView,
} from 'react-native';
import { Card, Button } from 'react-native-paper';
import * as SecureStore from "expo-secure-store";
import AttendancePieChart from './AttendancePieChart';

const { width, height } = Dimensions.get('window'); // Get screen width and height

type ClassDetails = {
  slot: string;
  code: string;
  venue: string;
  type: string;
  start_time: string; // Start time of the class
  end_time: string;   // End time of the class
  title: string;
  faculty: string;
  attendance: number;
};

const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const Timetable = () => {
  const [selectedDay, setSelectedDay] = useState(0); // TODO: get the current day and map it to [0->6]
  const [selectedClass, setSelectedClass] = useState<ClassDetails | null>(null); // Track the selected class for details
  const flatListRef = useRef<FlatList>(null); // Reference to the FlatList for scrolling
  const slideAnim = useRef(new Animated.Value(height)).current; // Animation value for bottom sheet
  const [storedName, setStoredName] = useState<string | null>(null);
  const [storedUsername, setStoredUsername] = useState<string | null>(null);
  const [timetableData, setTimetableData] = useState<{ day: string; classes: ClassDetails[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimetableData = async () => {
      try {
        const data = await SecureStore.getItemAsync('timetable');
        if (data) {
          const parsedData = JSON.parse(data); // Parse the stringified data
          setTimetableData(parsedData); // Set the parsed data to state
        } else {
          setError('No timetable data found.'); // Handle case where data is not available
        }
      } catch (err) {
        setError('Failed to fetch timetable data.'); // Handle errors
        console.error(err);
      } finally {
        setIsLoading(false); // Set loading to false after fetching
      }
    };

    fetchTimetableData();
  }, []);

  useEffect(() => {
    const fetchName = async () => {
      const name = await SecureStore.getItemAsync("name");
      if (name) {
        setStoredName(toTitleCase(name)); // Convert to Title Case
      }
    };
    fetchName();
  }, []);


  useEffect(() => {
    const fetchUsername = async () => {
      const username = await SecureStore.getItemAsync("username");
      if (username) {
        setStoredUsername(username); // Convert to Title Case
      }
    };
    fetchUsername();
  }, []);

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Shortened day names for the tab bar

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

  const renderDay = ({ item }: { item: { day: string; classes: ClassDetails[] } }) => (
    <ScrollView style={styles.dayContainer}>
      {item.classes.map((cls, index) => (
        <TouchableOpacity key={index} onPress={() => handleClassPress(cls)}>
          <Card style={styles.classCard}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.timeBackground}>
                <View style={styles.timeContainer}>
                  <Text style={styles.time}>{cls.start_time}</Text>
                  <Text style={styles.time}>{cls.end_time}</Text>
                </View>
              </View>
              <View style={styles.subject}>
                <Text style={styles.classText}>{cls.title}</Text>
                <Text style={styles.venueText}>{cls.venue}</Text>
              </View>
              <View style={styles.attendancePie}>
                <AttendancePieChart attendance={cls.attendance} radius={44} />
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.cont}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{storedName}</Text>
          <Text style={styles.reg}>{storedUsername}</Text>
        </View>
        <Card style={styles.attendanceCard}>
          <Card.Content style={styles.attendanceContent}>
            <Text style={styles.attendancePerc}>93%</Text>
            <Text style={styles.attendance}>Overall Attendance</Text>
            {/* <Text style={styles.attendance}>Attendance</Text> */}
          </Card.Content>
        </Card>
      </View>
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
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.floor(event.nativeEvent.contentOffset.x / width);
          setSelectedDay(index);
        }}
        onScrollBeginDrag={() => {
        }}
        onScroll={(event) => {
          const index = Math.floor(event.nativeEvent.contentOffset.x / width);
          setSelectedDay(index);
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
                  <Text style={styles.modalTitle}>{selectedClass?.title}</Text>
                  <Text style={styles.modalText}>{selectedClass?.code}</Text>
                  <Text />
                  <Text style={styles.modalText}>Faculty: {selectedClass?.faculty}</Text>
                  <Text style={styles.modalText}>Venue: {selectedClass?.venue}</Text>
                  <View style={styles.slot}>
                    <Text style={styles.modalText}>{selectedClass?.slot}</Text>
                  </View>
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
    backgroundColor: "#332f36",
    //backgroundColor: "#3d3742"
  },
  cont: {
    flexDirection: 'row',
    paddingTop: 50,
  },
  nameContainer: {
    width: 0.6 * width,
    justifyContent: 'center',
    textAlign: 'left'
  },
  name: {
    paddingLeft: 20,
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    fontFamily: 'Inter_600SemiBold',
  },
  reg: {
    padding: 20,
    paddingTop: 5,
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Inter_500Medium',
  },
  attendanceCard: {
    width: 0.33 * width,
    alignSelf: 'center',
    backgroundColor: '#5b5768',
    marginBottom: 12,
    borderRadius: 20,
    elevation: 2,
    height: 100, // Increased height for class cards
    justifyContent: 'center', // Center content vertically
    marginHorizontal: 10,
  },
  attendanceContent: {
    alignItems: 'center', // Center items vertically
    justifyContent: 'space-between', // Space between time and subject name
    paddingHorizontal: 15, // Add horizontal padding
  },
  attendance: {
    fontSize: 9,
    color: '#ddd',
    fontFamily: 'Inter_300Light',
  },
  attendancePerc: {
    fontSize: 38,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    padding: 10,
  },
  tabButton: {
    padding: 15,
    width: 50,
    textAlign: 'center',
    borderRadius: 40,
    margin: 0,
  },
  selectedTab: {
    backgroundColor: '#b1a8c3', // Selected tab background color
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff', // White text for tabs
  },
  dayContainer: {
    width: width + 10, // Full screen width
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 10
  },
  classCard: {
    marginBottom: 12,
    borderRadius: 20,
    elevation: 2,
    height: 80, // Increased height for class cards
    justifyContent: 'center', // Center content vertically
  },
  cardContent: {
    flexDirection: 'row', // Align time and subject name side by side
    alignItems: 'center', // Center items vertically
    // justifyContent: 'space-between', // Space between time and subject name
    paddingHorizontal: 16, // Add horizontal padding
  },
  timeBackground: {
    backgroundColor: '#5b5768', // White background for the time
    width: 65, // Width of the white background
    height: 80, // Full height of the card
    justifyContent: 'center',
    alignItems: 'center', // Center time vertically
    borderTopLeftRadius: 20, // Match card border radius
    borderBottomLeftRadius: 20,
    marginTop: -16,
    marginLeft: -16,
  },
  timeContainer: {
    alignItems: 'flex-start',
  },
  time: {
    fontSize: 16, // Slightly smaller font size for time
    color: '#ddd', // Light gray text for time
    marginTop: 1,
    marginBottom: 1,
    fontFamily: 'Inter_400Regular'
  },
  subject: {
    textAlign: 'left',
    marginLeft: 16,
    flex: 1,
    flexShrink: 1, // Allow shrinking to fit within the card
    flexWrap: 'wrap',
    marginTop: -25
  },
  classText: {
    fontSize: 16,
    color: '#fff',
    alignSelf: 'flex-start', // Prevent stretching
    flexWrap: 'wrap', // Allow text wrapping
  },
  venueText: {
    fontSize: 13,
    color: '#fff',
    alignSelf: 'flex-start', // Prevent stretching
    flexWrap: 'wrap',
    marginTop: 5
  },
  attendancePie: {
    width: 65, // Width of the white background
    height: 80, // Full height of the card
    justifyContent: 'center',
    alignItems: 'center', // Center time vertically
    borderTopRightRadius: 20, // Match card border radius
    borderBottomRightRadius: 20,
    marginTop: -16,

  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'flex-end', // Align bottom sheet to the bottom
  },
  bottomSheet: {
    width: '100%',
    backgroundColor: '#5b5768', // Dark background for bottom sheet
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#5b5768', // Dark background for modal
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#fff', // White text for modal title
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'left',
    color: '#fff',
  },
  slot: {
    padding: 1,
    paddingBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    width: 50,
    backgroundColor: ' rgb(66, 63, 74)',
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#fff',
    borderStyle: 'solid'
  }
});

export default Timetable;
