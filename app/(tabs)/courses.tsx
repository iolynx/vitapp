import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View, Modal, TouchableWithoutFeedback } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { CoursesScreenNavigationProp } from "../../types/types";
import AttendancePieChart from "../../components/AttendancePieChart";

interface Course {
  code: string;
  title: string;
  type: "theory" | "lab";
  credits: number;
  slots: string[];
  venue: string;
  faculty: string;
  nbr: string;
  attendance?: number;
}

interface Attendance {
  attended: number;
  course_type: string;
  percentage: number;
  slot: string;
  total: number;
}

export default function CoursesPage() {
  const theme = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      const fetchedCourses = await SecureStore.getItemAsync("courses");
      const fetchedAttendance = await SecureStore.getItemAsync("attendance");

      if (fetchedCourses) {
        setCourses(JSON.parse(fetchedCourses));
      }
      if (fetchedAttendance) {
        setAttendance(JSON.parse(fetchedAttendance));
      }
    }
    loadCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0 && attendance.length > 0) {
      const updatedCourses = courses.map((course) => {
        const matchingAttendance = attendance.find((a) =>
          a.slot.startsWith(course.slots[0])
        );
        return {
          ...course,
          attendance: matchingAttendance?.percentage || 0,
        };
      });
      if (JSON.stringify(updatedCourses) !== JSON.stringify(courses)) {
        setCourses(updatedCourses);
      }
    }
  }, [courses, attendance]);

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedCourse(item);
        setModalVisible(true);
      }}
    >
      <Card style={styles.courseCard}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle}>{item.title}</Text>
            <Text style={styles.courseCode}>{item.code}</Text>
          </View>
          <View style={styles.attendanceContainer}>
            <AttendancePieChart attendance={item.attendance || 0} radius={42} />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.header}>
        Courses
      </Text>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.code}
        renderItem={renderCourseItem}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedCourse && (
                <>
                  <Text style={styles.modalTitle}>{selectedCourse.title}</Text>
                  <Text style={styles.modalText}>Code: {selectedCourse.code}</Text>
                  <Text style={styles.modalText}>Faculty: {selectedCourse.faculty}</Text>
                  <Text style={styles.modalText}>Venue: {selectedCourse.venue}</Text>
                  <Text style={styles.modalText}>Attendance: {selectedCourse.attendance}%</Text>
                  <Text style={styles.sectionTitle}>Marks</Text>
                  {selectedCourse.type === "theory" ? (
                    <>
                      <Text style={styles.modalText}>DA1: -</Text>
                      <Text style={styles.modalText}>DA2: -</Text>
                      <Text style={styles.modalText}>DA3: -</Text>
                      <Text style={styles.modalText}>CAT-1: -</Text>
                      <Text style={styles.modalText}>CAT-2: -</Text>
                      <Text style={styles.modalText}>FAT: -</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.modalText}>PAT: -</Text>
                      <Text style={styles.modalText}>MAT: -</Text>
                      <Text style={styles.modalText}>FAT: -</Text>
                      <Text style={styles.modalText}>Lab Assignments: -</Text>
                    </>
                  )}
                </>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#332f36",
  },
  header: {
    marginBottom: 16,
    fontWeight: "bold",
    color: "#fff",
    fontSize: 24,
    paddingTop: 40
  },
  listContainer: {
    paddingBottom: 16,
  },
  courseCard: {
    marginBottom: 12,
    borderRadius: 20,
    elevation: 2,
    backgroundColor: "#5b5768",
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  courseCode: {
    fontSize: 14,
    color: "#ddd",
  },
  attendanceContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  attendanceText: {
    position: "absolute",
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#5b5768",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#fff",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#fff",
  },
});