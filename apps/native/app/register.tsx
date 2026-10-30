import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { Container } from "@/components/container";
import { SignUp } from "@/components/sign-up";

// bottomOffset 是键盘到聚焦输入框的距离；提交按钮在最后一个输入框下方，留出按钮和错误文案的高度才不会被键盘挡住
const SUBMIT_BUTTON_CLEARANCE = 96;

export default function RegisterScreen() {
	return (
		<Container isScrollable={false}>
			<KeyboardAwareScrollView
				bottomOffset={SUBMIT_BUTTON_CLEARANCE}
				contentInsetAdjustmentBehavior="automatic"
				keyboardShouldPersistTaps="handled"
			>
				<View className="p-6">
					<SignUp />
				</View>
			</KeyboardAwareScrollView>
		</Container>
	);
}
