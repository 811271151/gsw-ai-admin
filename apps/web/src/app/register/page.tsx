import { redirect } from "next/navigation";

import SignUpForm from "@/components/sign-up-form";
import { getServerSession } from "@/lib/server-session";

export default async function RegisterPage() {
	if (await getServerSession()) {
		redirect("/dashboard");
	}

	return <SignUpForm />;
}
