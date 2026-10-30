import { View } from "react-native";

import { Container } from "@/components/container";
import { SignUp } from "@/components/sign-up";

export default function RegisterScreen() {
	return (
		<Container>
			<View className="p-6">
				<SignUp />
			</View>
		</Container>
	);
}
