import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";
import { Circle, Svg } from "react-native-svg";
import { CoursesScreenNavigationProp } from "../../types/types";

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
  // const navigation = useNavigation();
  const navigation = useNavigation<CoursesScreenNavigationProp>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

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
      setCourses(updatedCourses);
    }
  }, [courses, attendance]);

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("CourseDetails", { course: item })
      }
    >
      <Card style={styles.courseCard}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle}>{item.title}</Text>
            <Text style={styles.courseCode}>{item.code}</Text>
          </View>
          <View style={styles.attendanceContainer}>
            <Svg width={60} height={60}>
              <Circle
                cx={30}
                cy={30}
                r={25}
                stroke={theme.colors.primary}
                strokeWidth={5}
                fill="transparent"
              />
              <Circle
                cx={30}
                cy={30}
                r={25}
                stroke={theme.colors.primary}
                strokeWidth={5}
                fill="transparent"
                strokeDasharray={Math.PI * 50}
                strokeDashoffset={
                  Math.PI * 50 * (1 - (item.attendance || 0) / 100)
                }
                transform="rotate(-90, 30, 30)"
              />
            </Svg>
            <Text style={styles.attendanceText}>
              {item.attendance}%
            </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    marginBottom: 16,
    fontWeight: "bold",
    color: "#333",
  },
  listContainer: {
    paddingBottom: 16,
  },
  courseCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: "#fff",
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
    color: "#333",
  },
  courseCode: {
    fontSize: 14,
    color: "#666",
  },
  attendanceContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  attendanceText: {
    position: "absolute",
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
});
