import { Text, View, StyleSheet } from "react-native";
import React, { useEffect, useState } from 'react';
import { ThemedText } from "@/components/ThemedText";
import FetchUserData from "@/utils/fetchUserData";
import Button from "@/components/Button";

export default function Index() {
  const [userData, setUserData] = useState<any>(null);
  const [fetching, setFetching] = useState(false);


  return (
    <View style={styles.container}>

      {fetching ? (
        <FetchUserData
          onDataFetched={(data) => {
            setUserData(data);
            setFetching(false);
          }}
        />
      ) : null}

      <ThemedText style={styles.text}>The Student data goes here </ThemedText>

      <Button theme="primary" label="Fetch User Data" onPress={() => setFetching(true)} />

      {userData && (<ThemedText> UserData obtained is: </ThemedText>)}

      <Text>fetching: {fetching} </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
});

