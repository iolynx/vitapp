import { ScrollView, FlatList, StyleSheet } from "react-native";
import { Headline, Text, Button, Surface, Appbar } from "react-native-paper";
import { useTheme } from "react-native-paper";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";
import CourseItem from "@/components/CourseItem";

// const courses = [
//   { id: '1', name: 'Mathematics' },
//   { id: '2', name: 'Physics' },
//   { id: '3', name: 'Computer Science' },
//   { id: '4', name: 'History' },
// ];


interface Course {
  code: string;
  title: string;
  type: "theory" | "lab"; // Restricting to known values
  credits: number;
  slots: string[];
  venue: string;
  faculty: string;
  nbr: string;
}

interface Attendance {
  attended: number;
  course_type: string;
  percentage: number;
  slot: string;
  total: number;
}

type CourseList = Course[]; // Type alias for an array of courses
export default function CoursesPage() {
  const theme = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  useEffect(() => {
    async function loadCourses() {
      const fetchedCourses = await SecureStore.getItemAsync('courses');
      const fetchedAttendance = await SecureStore.getItemAsync('attendance');

      if (fetchedCourses) {
        console.log('fetched courses');
        setCourses(JSON.parse(fetchedCourses));
      }
      if (fetchedAttendance) {
        console.log('fetched attendance')
        setAttendance(JSON.parse(fetchedAttendance));
      }
      console.log('done');
      console.log(courses);
    }
    loadCourses();
  }, [])


  function updateCourses() {
    console.log(courses.length);
    console.log(attendance.length);
    if (courses.length > 0 && attendance.length > 0) {
      console.log('gay')
      const updatedCourses = courses.map(course => {
        console.log(course.slots[0]);
        const matchingAttendance = attendance.find(a => a.slot.startsWith(course.slots[0]));
        return {
          ...course,
          'attendance': matchingAttendance.percentage
        };
      });

      setCourses(updatedCourses);
      console.log('Updated courses with matching attendance:', updatedCourses);
    }
  };


  return (
    <FlatList
      data={courses}
      keyExtractor={(item) => item.code}
      renderItem={({ item }) =>
        <CourseItem
          item={item}
        />
      }
    />
  )
}
const styles = StyleSheet.create({
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
