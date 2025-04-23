// Standard Layout

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
  const [marks, setMarks] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      const fetchedCourses = await SecureStore.getItemAsync("courses");
      const fetchedAttendance = await SecureStore.getItemAsync("attendance");
      const fetchedMarks = await SecureStore.getItemAsync("marks");

      console.log('marks are: ', marks["BCSE206L"])

      if (fetchedCourses) {
        setCourses(JSON.parse(fetchedCourses));
      }
      if (fetchedAttendance) {
        setAttendance(JSON.parse(fetchedAttendance));
      }
      if (fetchedMarks) {
        setMarks(JSON.parse(fetchedMarks));
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





// // Layout 2

// import React, { useEffect, useState } from "react";
// import { FlatList, StyleSheet, TouchableOpacity, View, Modal, TouchableWithoutFeedback } from "react-native";
// import { Card, Text, useTheme } from "react-native-paper";
// import * as SecureStore from "expo-secure-store";
// import { useNavigation, useIsFocused } from "@react-navigation/native";
// import { CoursesScreenNavigationProp } from "../../types/types";
// import AttendancePieChart from "../../components/AttendancePieChart";

// interface Course {
//   code: string;
//   title: string;
//   type: "theory" | "lab";
//   credits: number;
//   slots: string[];
//   venue: string;
//   faculty: string;
//   nbr: string;
//   attendance?: number;
//   labCourse?: Course;
// }

// interface Attendance {
//   attended: number;
//   course_type: string;
//   percentage: number;
//   slot: string;
//   total: number;
// }

// export default function CoursesPage() {
//   const theme = useTheme();
//   const [courses, setCourses] = useState<Course[]>([]);
//   const [attendance, setAttendance] = useState<Attendance[]>([]);
//   const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
//   const [modalVisible, setModalVisible] = useState(false);

//   useEffect(() => {
//     async function loadCourses() {
//       const fetchedCourses = await SecureStore.getItemAsync("courses");
//       const fetchedAttendance = await SecureStore.getItemAsync("attendance");

//       if (fetchedCourses) {
//         const parsedCourses = JSON.parse(fetchedCourses);
//         const groupedCourses = parsedCourses.map((course: Course) => {
//           if (course.type === "theory") {
//             const labCourse = parsedCourses.find(
//               (c: Course) => c.type === "lab" && c.code.startsWith(course.code)
//             );
//             return { ...course, labCourse };
//           }
//           return course;
//         }).filter((course: Course) => course.type === "theory");
//         setCourses(groupedCourses);
//       }
//       if (fetchedAttendance) {
//         setAttendance(JSON.parse(fetchedAttendance));
//       }
//     }
//     loadCourses();
//   }, []);

//   useEffect(() => {
//     if (courses.length > 0 && attendance.length > 0) {
//       const updatedCourses = courses.map((course) => {
//         const matchingAttendance = attendance.find((a) =>
//           a.slot.startsWith(course.slots[0])
//         );
//         return {
//           ...course,
//           attendance: matchingAttendance?.percentage || 0,
//         };
//       });
//       if (JSON.stringify(updatedCourses) !== JSON.stringify(courses)) {
//         setCourses(updatedCourses);
//       }
//     }
//   }, [courses, attendance]);

//   const renderCourseItem = ({ item }: { item: Course }) => (
//     <View style={styles.courseRow}>
//       {/* Theory Course */}
//       <TouchableOpacity
//         onPress={() => {
//           setSelectedCourse(item);
//           setModalVisible(true);
//         }}
//         style={styles.courseContainer}
//       >
//         <Card style={styles.courseCard}>
//           <Card.Content style={styles.cardContent}>
//             <View style={styles.courseInfo}>
//               <Text style={styles.courseTitle}>{item.title}</Text>
//               <Text style={styles.courseCode}>{item.code}</Text>
//             </View>
//             <View style={styles.attendanceContainer}>
//               <AttendancePieChart attendance={item.attendance || 0} radius={42} />
//             </View>
//           </Card.Content>
//         </Card>
//       </TouchableOpacity>

//       {/* Lab Course */}
//       {item.labCourse && (
//         <TouchableOpacity
//           onPress={() => {
//             setSelectedCourse(item.labCourse || null);
//             setModalVisible(true);
//           }}
//           style={styles.courseContainer}
//         >
//           <Card style={styles.courseCard}>
//             <Card.Content style={styles.cardContent}>
//               <View style={styles.courseInfo}>
//                 <Text style={styles.courseTitle}>{item.labCourse.title}</Text>
//                 <Text style={styles.courseCode}>{item.labCourse.code}</Text>
//               </View>
//               <View style={styles.attendanceContainer}>
//                 <AttendancePieChart attendance={item.labCourse.attendance || 0} radius={42} />
//               </View>
//             </Card.Content>
//           </Card>
//         </TouchableOpacity>
//       )}
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <Text variant="headlineMedium" style={styles.header}>
//         Courses
//       </Text>
//       <FlatList
//         data={courses}
//         keyExtractor={(item) => item.code}
//         renderItem={renderCourseItem}
//         contentContainerStyle={styles.listContainer}
//       />

//       <Modal
//         visible={modalVisible}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
//           <View style={styles.modalOverlay}>
//             <View style={styles.modalContent}>
//               {selectedCourse && (
//                 <>
//                   <Text style={styles.modalTitle}>{selectedCourse.title}</Text>
//                   <Text style={styles.modalText}>Code: {selectedCourse.code}</Text>
//                   <Text style={styles.modalText}>Faculty: {selectedCourse.faculty}</Text>
//                   <Text style={styles.modalText}>Venue: {selectedCourse.venue}</Text>
//                   <Text style={styles.modalText}>Attendance: {selectedCourse.attendance}%</Text>
//                   <Text style={styles.sectionTitle}>Marks</Text>
//                   {selectedCourse.type === "theory" ? (
//                     <>
//                       <Text style={styles.modalText}>DA1: -</Text>
//                       <Text style={styles.modalText}>DA2: -</Text>
//                       <Text style={styles.modalText}>DA3: -</Text>
//                       <Text style={styles.modalText}>CAT-1: -</Text>
//                       <Text style={styles.modalText}>CAT-2: -</Text>
//                       <Text style={styles.modalText}>FAT: -</Text>
//                     </>
//                   ) : (
//                     <>
//                       <Text style={styles.modalText}>PAT: -</Text>
//                       <Text style={styles.modalText}>MAT: -</Text>
//                       <Text style={styles.modalText}>FAT: -</Text>
//                       <Text style={styles.modalText}>Lab Assignments: -</Text>
//                     </>
//                   )}
//                 </>
//               )}
//             </View>
//           </View>
//         </TouchableWithoutFeedback>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: "#332f36",
//   },
//   header: {
//     marginBottom: 16,
//     fontWeight: "bold",
//     color: "#fff",
//     fontSize: 24,
//     paddingTop: 40,
//   },
//   listContainer: {
//     paddingBottom: 16,
//   },
//   courseRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 12,
//   },
//   courseContainer: {
//     flex: 1,
//     marginHorizontal: 4,
//   },
//   courseCard: {
//     borderRadius: 20,
//     elevation: 2,
//     backgroundColor: "#5b5768",
//   },
//   cardContent: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 16,
//   },
//   courseInfo: {
//     flex: 1,
//   },
//   courseTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#fff",
//   },
//   courseCode: {
//     fontSize: 14,
//     color: "#ddd",
//   },
//   attendanceContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   attendanceText: {
//     position: "absolute",
//     fontSize: 14,
//     fontWeight: "bold",
//     color: "#fff",
//   },
//   modalOverlay: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//   },
//   modalContent: {
//     width: "80%",
//     backgroundColor: "#5b5768",
//     borderRadius: 16,
//     padding: 16,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 8,
//     color: "#fff",
//   },
//   modalText: {
//     fontSize: 16,
//     marginBottom: 8,
//     color: "#fff",
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginTop: 16,
//     marginBottom: 8,
//     color: "#fff",
//   },
// });





// // Layout 3

// import React, { useEffect, useState } from "react";
// import { FlatList, StyleSheet, TouchableOpacity, View, Modal, TouchableWithoutFeedback } from "react-native";
// import { Card, Text, useTheme } from "react-native-paper";
// import * as SecureStore from "expo-secure-store";
// import { useNavigation, useIsFocused } from "@react-navigation/native";
// import { CoursesScreenNavigationProp } from "../../types/types";
// import AttendancePieChart from "../../components/AttendancePieChart";

// interface Course {
//   code: string;
//   title: string;
//   type: "theory" | "lab";
//   credits: number;
//   slots: string[];
//   venue: string;
//   faculty: string;
//   nbr: string;
//   attendance?: number;
//   labCourse?: Course;
// }

// interface Attendance {
//   attended: number;
//   course_type: string;
//   percentage: number;
//   slot: string;
//   total: number;
// }

// export default function CoursesPage() {
//   const theme = useTheme();
//   const [courses, setCourses] = useState<Course[]>([]);
//   const [attendance, setAttendance] = useState<Attendance[]>([]);
//   const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
//   const [modalVisible, setModalVisible] = useState(false);

//   useEffect(() => {
//     async function loadCourses() {
//       const fetchedCourses = await SecureStore.getItemAsync("courses");
//       const fetchedAttendance = await SecureStore.getItemAsync("attendance");

//       if (fetchedCourses) {
//         const parsedCourses = JSON.parse(fetchedCourses);
//         const groupedCourses = parsedCourses
//           .filter((course: Course) => course.type === "theory")
//           .map((course: Course) => {
//             const labCourse = parsedCourses.find(
//               (c: Course) =>
//                 c.type === "lab" &&
//                 (c.code === course.code ||
//                   (c.code.slice(0, 7) === course.code.slice(0, 7) &&
//                     (c.code.endsWith("L") || c.code.endsWith("P"))))
//             );
//             return { ...course, labCourse };
//           });
//         setCourses(groupedCourses);
//       }
//       if (fetchedAttendance) {
//         setAttendance(JSON.parse(fetchedAttendance));
//       }
//     }
//     loadCourses();
//   }, []);

//   useEffect(() => {
//     if (courses.length > 0 && attendance.length > 0) {
//       const updatedCourses = courses.map((course) => {
//         const matchingAttendance = attendance.find((a) =>
//           a.slot.startsWith(course.slots[0])
//         );
//         return {
//           ...course,
//           attendance: matchingAttendance?.percentage || 0,
//         };
//       });
//       if (JSON.stringify(updatedCourses) !== JSON.stringify(courses)) {
//         setCourses(updatedCourses);
//       }
//     }
//   }, [courses, attendance]);

//   const renderCourseItem = ({ item }: { item: Course }) => (
//     <View style={styles.courseContainer}>
//       {/* Common Course Title */}
//       <Text style={styles.commonTitle}>{item.title}</Text>

//       {/* Theory and Lab Courses */}
//       <View style={styles.courseRow}>
//         {/* Theory Course */}
//         <TouchableOpacity
//           onPress={() => {
//             setSelectedCourse(item);
//             setModalVisible(true);
//           }}
//           style={styles.courseSegment}
//         >
//           <Card style={styles.courseCard}>
//             <Card.Content style={styles.cardContent}>
//               <Text style={styles.courseType}>Theory</Text>
//               <View style={styles.attendanceContainer}>
//                 <AttendancePieChart attendance={item.attendance || 0} radius={42} />
//               </View>
//             </Card.Content>
//           </Card>
//         </TouchableOpacity>

//         {/* Lab Course */}
//         {item.labCourse && (
//           <TouchableOpacity
//             onPress={() => {
//               setSelectedCourse(item.labCourse || null);
//               setModalVisible(true);
//             }}
//             style={styles.courseSegment}
//           >
//             <Card style={styles.courseCard}>
//               <Card.Content style={styles.cardContent}>
//                 <Text style={styles.courseType}>Lab</Text>
//                 <View style={styles.attendanceContainer}>
//                   <AttendancePieChart attendance={item.labCourse.attendance || 0} radius={30} />
//                 </View>
//               </Card.Content>
//             </Card>
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <Text variant="headlineMedium" style={styles.header}>
//         Courses
//       </Text>
//       <FlatList
//         data={courses}
//         keyExtractor={(item) => item.code}
//         renderItem={renderCourseItem}
//         contentContainerStyle={styles.listContainer}
//       />

//       <Modal
//         visible={modalVisible}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
//           <View style={styles.modalOverlay}>
//             <View style={styles.modalContent}>
//               {selectedCourse && (
//                 <>
//                   <Text style={styles.modalTitle}>{selectedCourse.title}</Text>
//                   <Text style={styles.modalText}>Code: {selectedCourse.code}</Text>
//                   <Text style={styles.modalText}>Faculty: {selectedCourse.faculty}</Text>
//                   <Text style={styles.modalText}>Venue: {selectedCourse.venue}</Text>
//                   <Text style={styles.modalText}>Attendance: {selectedCourse.attendance}%</Text>
//                   <Text style={styles.sectionTitle}>Marks</Text>
//                   {selectedCourse.type === "theory" ? (
//                     <>
//                       <Text style={styles.modalText}>DA1: -</Text>
//                       <Text style={styles.modalText}>DA2: -</Text>
//                       <Text style={styles.modalText}>DA3: -</Text>
//                       <Text style={styles.modalText}>CAT-1: -</Text>
//                       <Text style={styles.modalText}>CAT-2: -</Text>
//                       <Text style={styles.modalText}>FAT: -</Text>
//                     </>
//                   ) : (
//                     <>
//                       <Text style={styles.modalText}>PAT: -</Text>
//                       <Text style={styles.modalText}>MAT: -</Text>
//                       <Text style={styles.modalText}>FAT: -</Text>
//                       <Text style={styles.modalText}>Lab Assignments: -</Text>
//                     </>
//                   )}
//                 </>
//               )}
//             </View>
//           </View>
//         </TouchableWithoutFeedback>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: "#332f36",
//   },
//   header: {
//     marginBottom: 16,
//     fontWeight: "bold",
//     color: "#fff",
//     fontSize: 24,
//     paddingTop: 40,
//   },
//   listContainer: {
//     paddingBottom: 16,
//   },
//   courseContainer: {
//     marginBottom: 16,
//   },
//   commonTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#fff",
//     marginBottom: 8,
//   },
//   courseRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   courseSegment: {
//     flex: 1,
//     marginHorizontal: 4,
//   },
//   courseCard: {
//     borderRadius: 20,
//     elevation: 2,
//     backgroundColor: "#5b5768",
//   },
//   cardContent: {
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 16,
//   },
//   courseType: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#fff",
//     marginBottom: 8,
//   },
//   attendanceContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   modalOverlay: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//   },
//   modalContent: {
//     width: "80%",
//     backgroundColor: "#5b5768",
//     borderRadius: 16,
//     padding: 16,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 8,
//     color: "#fff",
//   },
//   modalText: {
//     fontSize: 16,
//     marginBottom: 8,
//     color: "#fff",
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginTop: 16,
//     marginBottom: 8,
//     color: "#fff",
//   },
// });





// // Layout 4

// import React, { useEffect, useState } from "react";
// import { FlatList, StyleSheet, TouchableOpacity, View, Modal, TouchableWithoutFeedback } from "react-native";
// import { Card, Text, useTheme } from "react-native-paper";
// import * as SecureStore from "expo-secure-store";
// import { useNavigation, useIsFocused } from "@react-navigation/native";
// import { CoursesScreenNavigationProp } from "../../types/types";
// import AttendancePieChart from "../../components/AttendancePieChart";

// interface Course {
//   code: string;
//   title: string;
//   type: "theory" | "lab";
//   credits: number;
//   slots: string[];
//   venue: string;
//   faculty: string;
//   nbr: string;
//   attendance?: number;
//   labCourse?: Course;
// }

// interface Attendance {
//   attended: number;
//   course_type: string;
//   percentage: number;
//   slot: string;
//   total: number;
// }

// export default function CoursesPage() {
//   const theme = useTheme();
//   const [courses, setCourses] = useState<Course[]>([]);
//   const [attendance, setAttendance] = useState<Attendance[]>([]);
//   const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
//   const [modalVisible, setModalVisible] = useState(false);

//   useEffect(() => {
//     async function loadCourses() {
//       const fetchedCourses = await SecureStore.getItemAsync("courses");
//       const fetchedAttendance = await SecureStore.getItemAsync("attendance");

//       if (fetchedCourses) {
//         const parsedCourses = JSON.parse(fetchedCourses);
//         const groupedCourses = parsedCourses
//           .filter((course: Course) => course.type === "theory")
//           .map((course: Course) => {
//             const labCourse = parsedCourses.find(
//               (c: Course) =>
//                 c.type === "lab" &&
//                 (c.code === course.code ||
//                   (c.code.slice(0, 7) === course.code.slice(0, 7) &&
//                     (c.code.endsWith("L") || c.code.endsWith("P"))))
//             );
//             return { ...course, labCourse };
//           });
//         setCourses(groupedCourses);
//       }
//       if (fetchedAttendance) {
//         setAttendance(JSON.parse(fetchedAttendance));
//       }
//     }
//     loadCourses();
//   }, []);

//   useEffect(() => {
//     if (courses.length > 0 && attendance.length > 0) {
//       const updatedCourses = courses.map((course) => {
//         const matchingAttendance = attendance.find((a) =>
//           a.slot.startsWith(course.slots[0])
//         );
//         return {
//           ...course,
//           attendance: matchingAttendance?.percentage || 0,
//         };
//       });
//       if (JSON.stringify(updatedCourses) !== JSON.stringify(courses)) {
//         setCourses(updatedCourses);
//       }
//     }
//   }, [courses, attendance]);

//   const renderCourseItem = ({ item }: { item: Course }) => {
//     if (item.labCourse) {
//       return (
//         <View style={styles.courseContainer}>
//           {/* Common Course Title */}
//           <Text style={styles.commonTitle}>{item.title}</Text>

//           {/* Theory and Lab Courses */}
//           <View style={styles.courseRow}>
//             {/* Theory Course */}
//             <TouchableOpacity
//               onPress={() => {
//                 setSelectedCourse(item);
//                 setModalVisible(true);
//               }}
//               style={styles.courseSegment}
//             >
//               <Card style={styles.courseCard}>
//                 <Card.Content style={styles.cardContent}>
//                   <Text style={styles.courseType}>Theory</Text>
//                   <Text style={styles.courseCode}>{item.code}</Text>
//                   <View style={styles.attendanceContainer}>
//                     <AttendancePieChart attendance={item.attendance || 0} radius={42} />
//                   </View>
//                 </Card.Content>
//               </Card>
//             </TouchableOpacity>

//             {/* Lab Course */}
//             <TouchableOpacity
//               onPress={() => {
//                 setSelectedCourse(item.labCourse || null);
//                 setModalVisible(true);
//               }}
//               style={styles.courseSegment}
//             >
//               <Card style={styles.courseCard}>
//                 <Card.Content style={styles.cardContent}>
//                   <Text style={styles.courseType}>Lab</Text>
//                   <Text style={styles.courseCode}>{item.labCourse.code}</Text>
//                   <View style={styles.attendanceContainer}>
//                     <AttendancePieChart attendance={item.labCourse.attendance || 0} radius={42} />
//                   </View>
//                 </Card.Content>
//               </Card>
//             </TouchableOpacity>
//           </View>
//         </View>
//       );
//     } else {
//       return (
//         <View style={styles.courseContainer}>
//           <Text style={styles.commonTitle}>{item.title}</Text>

//           <TouchableOpacity
//             onPress={() => {
//               setSelectedCourse(item);
//               setModalVisible(true);
//             }}
//           >
//             <Card style={styles.courseCard}>
//               <Card.Content style={styles.cardContent}>
//                 <View style={styles.halfContainer}>
//                   <View style={styles.leftHalf}>
//                     <Text style={styles.courseCode}>{item.code}</Text>
//                   </View>

//                   <View style={styles.rightHalf}>
//                     <View style={styles.attendanceContainer}>
//                       <AttendancePieChart attendance={item.attendance || 0} radius={42} />
//                     </View>
//                   </View>
//                 </View>
//               </Card.Content>
//             </Card>
//           </TouchableOpacity>
//         </View>
//       );
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text variant="headlineMedium" style={styles.header}>
//         Courses
//       </Text>
//       <FlatList
//         data={courses}
//         keyExtractor={(item) => item.code}
//         renderItem={renderCourseItem}
//         contentContainerStyle={styles.listContainer}
//       />

//       <Modal
//         visible={modalVisible}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
//           <View style={styles.modalOverlay}>
//             <View style={styles.modalContent}>
//               {selectedCourse && (
//                 <>
//                   <Text style={styles.modalTitle}>{selectedCourse.title}</Text>
//                   <Text style={styles.modalText}>Code: {selectedCourse.code}</Text>
//                   <Text style={styles.modalText}>Faculty: {selectedCourse.faculty}</Text>
//                   <Text style={styles.modalText}>Venue: {selectedCourse.venue}</Text>
//                   <Text style={styles.modalText}>Attendance: {selectedCourse.attendance}%</Text>
//                   <Text style={styles.sectionTitle}>Marks</Text>
//                   {selectedCourse.type === "theory" ? (
//                     <>
//                       <Text style={styles.modalText}>DA1: -</Text>
//                       <Text style={styles.modalText}>DA2: -</Text>
//                       <Text style={styles.modalText}>DA3: -</Text>
//                       <Text style={styles.modalText}>CAT-1: -</Text>
//                       <Text style={styles.modalText}>CAT-2: -</Text>
//                       <Text style={styles.modalText}>FAT: -</Text>
//                     </>
//                   ) : (
//                     <>
//                       <Text style={styles.modalText}>PAT: -</Text>
//                       <Text style={styles.modalText}>MAT: -</Text>
//                       <Text style={styles.modalText}>FAT: -</Text>
//                       <Text style={styles.modalText}>Lab Assignments: -</Text>
//                     </>
//                   )}
//                 </>
//               )}
//             </View>
//           </View>
//         </TouchableWithoutFeedback>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: "#332f36",
//   },
//   header: {
//     marginBottom: 16,
//     fontWeight: "bold",
//     color: "#fff",
//     fontSize: 24,
//     paddingTop: 40,
//   },
//   listContainer: {
//     paddingBottom: 16,
//   },
//   courseContainer: {
//     marginBottom: 16,
//   },
//   commonTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#fff",
//     marginBottom: 8,
//   },
//   courseRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   courseSegment: {
//     flex: 1,
//     marginHorizontal: 4,
//   },
//   courseCard: {
//     borderRadius: 20,
//     elevation: 2,
//     backgroundColor: "#5b5768",
//   },
//   cardContent: {
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 16,
//   },
//   courseType: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#fff",
//     marginBottom: 4,
//   },
//   courseCode: {
//     fontSize: 14,
//     color: "#ddd",
//     marginBottom: 8,
//   },
//   courseCodeContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   attendanceContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   modalOverlay: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//   },
//   modalContent: {
//     width: "80%",
//     backgroundColor: "#5b5768",
//     borderRadius: 16,
//     padding: 16,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 8,
//     color: "#fff",
//   },
//   modalText: {
//     fontSize: 16,
//     marginBottom: 8,
//     color: "#fff",
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginTop: 16,
//     marginBottom: 8,
//     color: "#fff",
//   },
//   halfContainer: {
//     flexDirection: "row",
//     width: "100%",
//   },
//   leftHalf: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   rightHalf: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   }
// });
