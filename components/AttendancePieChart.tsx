import React, { useState, useRef, useEffect } from 'react';
import { Circle, Svg } from "react-native-svg";
import {StyleSheet, Text} from 'react-native';
interface AttendanceProps {
    attendance: number;
    radius: number;
}
const AttendancePieChart: React.FC<AttendanceProps> = ({attendance, radius}) => {
    return (
        <Svg width={60} height={60} viewBox="0 0 100 100">
            {/* Background Circle */}
            <Circle cx="50" cy="50" r="44" stroke='#5b5768' strokeWidth="10" fill="none" />
            {/* Progress Circle */}
            <Circle
                cx="50"
                cy="50"
                r={radius.toString()}
                stroke='#b1a8c3'
                strokeWidth="12"
                fill="none"
                strokeDasharray={Math.PI * 2 * radius}
                strokeDashoffset={(1 - attendance / 100) * Math.PI * 2 * radius}
                strokeLinecap="round"
                transform='rotate(-90 50 50)'
            />
            <Text style={styles.attendanceText}>{attendance}%</Text>
        </Svg>
    )
}

const styles = StyleSheet.create({
    attendanceText: {
        position: "absolute",
        alignSelf: 'center',
        textAlign: "center",
        marginTop: 18,
        fontSize: 16,
        color: '#fff',
        fontWeight: "bold",
    }
})

export default AttendancePieChart;