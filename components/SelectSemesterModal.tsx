import React, { useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native";
import { Modal, Portal, Button, List, Dialog } from "react-native-paper";

interface Semester {
  id: string;
  name: string;
}

// Define props for the SelectSemesterModal component
interface SelectSemesterModalProps {
  visible: boolean;
  onDismiss: () => void;
  semesters: Semester[];
  onSelect: (semesterId: string) => void;
}

const SelectSemesterModal: React.FC<SelectSemesterModalProps> = ({ visible, onDismiss, semesters, onSelect }) => {
  const [selectedSemester, setSelectedSemester] = useState('');

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} style={styles.contentContainerStyle} >
        <Dialog.Title>Select a Semester</Dialog.Title>
        <View>
          {semesters.map((semester) => (
            <List.Item
              key={semester.id}
              title={semester.name}
              onPress={() => setSelectedSemester(semester.id)}
              style={{
                backgroundColor: selectedSemester === semester.id ? "#6200ee" : "white",
                marginVertical: 4,
                borderRadius: 5,
              }}
              titleStyle={{
                color: selectedSemester === semester.id ? "white" : "black",
              }}
            />
          ))}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 20 }}>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button
            mode="contained"
            onPress={() => {
              if (selectedSemester) {
                onSelect(selectedSemester);
                onDismiss();
              }
            }}
            disabled={!selectedSemester}
          >
            Select
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};


const styles = StyleSheet.create({
  contentContainerStyle: {
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SelectSemesterModal;
