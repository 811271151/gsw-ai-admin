import { View } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";

export default function LoginScreen() {
	return (
		<Container>
			<View className="p-6">
				<SignIn />
			</View>
		</Container>
	);
}
