import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { CustomAlertProps } from "@/types";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import Typo from "./Typo";

const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
  type = "error",
}: CustomAlertProps) => {
  const getAlertColor = () => {
    switch (type) {
      case "error":
        return "#696868ff";
      case "success":
        return "#22c55e";
      case "warning":
        return "#f59e0b";
      default:
        return "#ef4444";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <View
            style={[styles.alertHeader, { backgroundColor: getAlertColor() }]}
          >
            <Typo size={18} fontWeight="700" color="white">
              {title}
            </Typo>
          </View>

          {message && (
            <View style={styles.alertBody}>
              <Typo
                size={14}
                color={colors.textLight}
                style={{ textAlign: "center" }}
              >
                {message}
              </Typo>
            </View>
          )}

          <TouchableOpacity style={styles.okButton} onPress={onClose}>
            <Typo size={16} fontWeight="600" color={getAlertColor()}>
              OK
            </Typo>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
  },
  alertContainer: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._17,
    overflow: "hidden",
    width: "100%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alertHeader: {
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._20,
    alignItems: "center",
  },
  alertBody: {
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._20,
  },
  okButton: {
    paddingVertical: spacingY._15,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.neutral600,
  },
});
