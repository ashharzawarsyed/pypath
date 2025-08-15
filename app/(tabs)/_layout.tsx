import CustomTabs from "@/components/CustomTabs";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" }, // Hide the default tab bar completely
      }}
      tabBar={(props) => <CustomTabs {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
};

export default TabLayout;

const styles = StyleSheet.create({});
