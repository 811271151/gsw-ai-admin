import { expoClient } from "@better-auth/expo/client";
import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import {
	getItem,
	getItemAsync,
	setItem,
	setItemAsync,
} from "expo-secure-store";

import { ENV } from "../src/env";

// expoClient 只用到这四个方法；它会协调对同一份存储的异步访问，所以复用同一个对象
const secureStorage = { getItem, getItemAsync, setItem, setItemAsync };

export const authClient = createAuthClient({
	baseURL: ENV.EXPO_PUBLIC_SERVER_URL,
	plugins: [
		expoClient({
			scheme: Constants.expoConfig?.scheme as string,
			storage: secureStorage,
			storagePrefix: Constants.expoConfig?.scheme as string,
		}),
		usernameClient(),
	],
});
