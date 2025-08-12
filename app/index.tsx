import Loading from "@/components/Loading";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

const Index = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Image
          style={styles.logo}
          resizeMode="contain"
          source={require("../assets/images/welcome.png")}
        />
      </View>
    );
  }

  return <Loading size="large" />;
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.neutral900,
  },
  logo: {
    height: "20%",
    aspectRatio: 1,
  },
});
