import { StackNavigationProp } from "@react-navigation/stack";

export interface Course {
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

export type RootStackParamList = {
  Courses: undefined;
  CourseDetails: { course: Course };
};

export type CoursesScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Courses"
>;

export type CourseDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CourseDetails"
>;