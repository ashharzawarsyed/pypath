import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface TimelineConnectorProps {
  fromY: number;
  toY: number;
  fromX: number;
  toX: number;
  delay?: number;
  isCompleted?: boolean;
}

const TimelineConnector = ({
  fromY,
  toY,
  fromX,
  toX,
  delay = 0,
  isCompleted = false,
}: TimelineConnectorProps) => {
  const strokeDashoffset = useSharedValue(200);
  const pathOpacity = useSharedValue(0);

  useEffect(() => {
    console.log("TimelineConnector props:", { fromX, fromY, toX, toY });

    // Animate path drawing
    pathOpacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    strokeDashoffset.value = withDelay(
      delay + 200,
      withTiming(0, { duration: 1500 })
    );
  }, [delay, fromX, fromY, toX, toY]);

  // Simple curved path - more reliable than complex S-curves
  const generatePath = () => {
    const midY = (fromY + toY) / 2;
    const curveOffset = Math.abs(toX - fromX) * 0.5;

    // Simple quadratic curve
    const controlX = fromX + (toX - fromX) / 2 + curveOffset;
    const controlY = midY;

    return `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`;
  };

  const animatedPathProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
    opacity: pathOpacity.value,
  }));

  const animatedCircleProps = useAnimatedProps(() => ({
    opacity: pathOpacity.value,
  }));

  // Don't render if coordinates are invalid
  if (!fromX || !fromY || !toX || !toY || fromY >= toY) {
    console.log("Invalid coordinates, not rendering connector");
    return null;
  }

  const pathColor = isCompleted ? "#000000" : "#666666";
  const svgHeight = Math.max(toY - fromY + 100, 200);

  console.log("Rendering TimelineConnector with height:", svgHeight);

  return (
    <View
      style={{
        position: "absolute",
        top: fromY - 50,
        left: 0,
        right: 0,
        height: svgHeight,
        zIndex: 999, // Very high z-index
        pointerEvents: "none",
      }}
    >
      <Svg
        width="100%"
        height={svgHeight}
        style={{
          position: "absolute",
          backgroundColor: "rgba(255, 0, 0, 0.1)", // Debug background - remove after testing
        }}
      >
        {/* Simple visible path for testing */}
        <AnimatedPath
          d={generatePath()}
          stroke={pathColor}
          strokeWidth={4}
          strokeDasharray="10 5"
          strokeLinecap="round"
          fill="none"
          animatedProps={animatedPathProps}
        />

        {/* Visible dots */}
        <AnimatedCircle
          cx={fromX}
          cy={50} // Relative to SVG top
          r={6}
          fill={pathColor}
          animatedProps={animatedCircleProps}
        />

        <AnimatedCircle
          cx={toX}
          cy={toY - fromY + 50} // Relative to SVG top
          r={6}
          fill={pathColor}
          animatedProps={animatedCircleProps}
        />
      </Svg>
    </View>
  );
};

export default TimelineConnector;
