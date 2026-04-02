import React from "react";
import { View } from "react-native";

const PagerViewCompat = React.forwardRef<any, any>(
  ({ children, style }, _ref) => {
    return <View style={style}>{children}</View>;
  },
);

PagerViewCompat.displayName = "PagerViewCompat";

export default PagerViewCompat;
