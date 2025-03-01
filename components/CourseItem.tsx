import React from "react";
import { View, StyleSheet } from "react-native";
import { Surface, Text, useTheme } from "react-native-paper";
import { Circle, Svg } from "react-native-svg";


interface Course {
  code: string;
  title: string;
  type: "theory" | "lab";
  credits: number;
  slots: string[];
  venue: string;
  faculty: string;
  nbr: string;
  //attendance: number;
};

interface CourseItemProps {
  item: Course;
}


const CourseItem: React.FC<CourseItemProps> = ({ item }) => {

  const theme = useTheme();
  // const attendance = item.attendance;
  const attendance = 75;

  return (
    <Surface elevation={2} style={styles.course}>

      {/* Left Part (Title + Code) */}
      <View style={styles.leftPart}>
        <Text variant="headlineSmall">{item.title}</Text>
        <Text>{item.code}</Text>
      </View>

      {/* Right Part (Circular Attendance Progress) */}
      <View style={styles.rightPart}>
        <Text style={styles.attendanceText}>{attendance}%</Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  course: {
    flexDirection: "row", // Arrange left & right parts in a row
    alignItems: "center",
    justifyContent: "space-between", // Push content apart
    padding: 16,
    marginVertical: 8,
    borderRadius: 10,
  },
  leftPart: {
    flex: 1, // Takes available space
  },
  rightPart: {
    width: 60, // Ensure space for circle
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  attendanceText: {
    position: "absolute",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    top: 13,
    left: 9
  },
});

export default CourseItem;
