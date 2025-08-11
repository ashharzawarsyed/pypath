import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import CustomAlert from "@/components/CustomAlert";
import Input from "@/components/Input";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { verticalScale } from "@/utils/styling";
import { router } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
// Update this import to match the actual exported member from authContext, for example:

const Register = () => {
  const nameRef = useRef("");
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const { register: registerUser } = useAuth();
  
  const handleSubmit = async () => {
    if (!emailRef.current || !passwordRef.current) {
      setShowAlert(true);
      return;
    }
    setIsLoading(true);
    const res = await registerUser(
      emailRef.current,
      passwordRef.current,
      nameRef.current
    );
    console.log("Register response:", res);
    if (!res.success) {
      Alert.alert("Registration Failed", res.msg);
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <BackButton iconSize={28} />
        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight={800}>
            Lets
          </Typo>
          <Typo size={30} fontWeight={800}>
            Get Started
          </Typo>
        </View>

        {/* {form} */}
        <View style={styles.form}>
          <Typo size={16} color={colors.textLight}>
            Register now to track all your expenses
          </Typo>

          {/* {Input Component} */}
          <Input
            placeholder="Enter your name"
            onChangeText={(e) => (nameRef.current = e)}
            icon={
              <Icons.UserIcon
                size={verticalScale(20)}
                color={colors.neutral400}
                weight="fill"
              />
            }
          />
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

          <Button loading={isLoading} onPress={handleSubmit}>
            <Typo fontWeight={"700"} color={colors.black}>
              Register
            </Typo>
          </Button>
        </View>
        {/* {footer} */}
        <View style={styles.footer}>
          <Typo size={15}>Already have an account?</Typo>
          <Pressable onPress={() => router.navigate("/(auth)/login")}>
            <Typo size={15} fontWeight={"700"} color={colors.primary}>
              Login
            </Typo>
          </Pressable>
        </View>
      </View>

      <CustomAlert
        visible={showAlert}
        title="Required Fields"
        message="Please fill in all fields to continue"
        onClose={() => setShowAlert(false)}
        type="error"
      />
    </ScreenWrapper>
  );
};

export default Register;

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
