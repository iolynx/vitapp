import { View, StyleSheet } from "react-native";
import { useTheme, Card, Text, TextInput, Button } from "react-native-paper";
import React, { useEffect, useState } from 'react';
import FetchUserData from "@/utils/fetchUserData";



export default function Index() {
  const [userData, setUserData] = useState<any>(null);
  const [fetching, setFetching] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSecure, setIsSecure] = useState(true);

  const theme = useTheme();

  const handleLogin = () => {
    setFetching(true);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.secondaryContainer }]}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Sign In to VTOP
          </Text>

          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={isSecure}
            right={
              <TextInput.Icon
                icon={isSecure ? "eye-off" : "eye"}
                onPress={() => setIsSecure(!isSecure)}
              />
            }
            style={styles.input}
          />

          <Button mode="contained" onPress={handleLogin} style={styles.button}>
            Login
          </Button>

        </Card.Content>
      </Card>

      {fetching ? (
        <FetchUserData
          username={username}
          password={password}
          onDataFetched={(data) => {
            setUserData(data);
            setFetching(false);
          }}
        />
      ) : null}

    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    paddingVertical: 20,
    borderRadius: 15,
    elevation: 5,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
});

