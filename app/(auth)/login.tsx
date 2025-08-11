import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import CustomAlert from "@/components/CustomAlert";
import Input from "@/components/Input";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

const Login = () => {
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  const router = useRouter();
  const { login: loginUser } = useAuth();

  const handleSubmit = async () => {
    if (!emailRef.current || !passwordRef.current) {
      setAlertTitle("Required Fields");
      setAlertMessage("Please fill in all fields to continue");
      setShowAlert(true);
      return;
    }
    setIsLoading(true);
    const res = await loginUser(emailRef.current, passwordRef.current);
    setIsLoading(false);
    if (!res.success) {
      setAlertTitle("Login Failed");
      setAlertMessage(res.msg || "An error occurred during login");
      setShowAlert(true);
      return;
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <BackButton iconSize={28} />
        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight={800}>
            Hey
          </Typo>
          <Typo size={30} fontWeight={800}>
            Welcome Back
          </Typo>
        </View>

        {/* {form} */}
        <View style={styles.form}>
          <Typo size={16} color={colors.textLight}>
            Login now to track all your expenses
          </Typo>

          {/* {Input Component} */}
          <Input
            placeholder="Enter your email"
            onChangeText={(e) => (emailRef.current = e)}
            icon={
              <Icons.AtIcon
                size={verticalScale(20)}
                color={colors.neutral400}
                weight="fill"
              />
            }
          />
          <Input
            placeholder="Enter your password"
            secureTextEntry
            onChangeText={(e) => (passwordRef.current = e)}
            icon={
              <Icons.LockIcon
                size={verticalScale(20)}
                color={colors.neutral400}
                weight="fill"
              />
            }
          />
          <Typo size={14} color={colors.text} style={{ alignSelf: "flex-end" }}>
            Forgot Password?
          </Typo>

          <Button loading={isLoading} onPress={handleSubmit}>
            <Typo fontWeight={"700"} color={colors.black}>
              Login
            </Typo>
          </Button>
        </View>
        {/* {footer} */}
        <View style={styles.footer}>
          <Typo size={15}>Dont have an account?</Typo>
          <Pressable onPress={() => router.navigate("/(auth)/register")}>
            <Typo size={15} fontWeight={"700"} color={colors.primary}>
              Sign Up
            </Typo>
          </Pressable>
        </View>
      </View>

      <CustomAlert
        visible={showAlert}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setShowAlert(false)}
        type="error"
      />
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20,
  },

  welcomeText: {
    fontSize: verticalScale(24),
    fontWeight: "600",
    color: colors.text,
  },
  form: {
    gap: spacingY._20,
  },
  forgotPassword: {
    textAlign: "center",
    color: colors.text,
    fontWeight: "500",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    textAlign: "center",
    color: colors.text,
    fontSize: verticalScale(15),
  },
});
