import { redirect } from "next/navigation";

import SignInForm from "@/components/sign-in-form";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { getServerSession } from "@/lib/server-session";

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ redirect?: string | string[] }>;
}) {
	const { redirect: redirectParam } = await searchParams;
	const redirectTo = getSafeRedirect(
		Array.isArray(redirectParam) ? redirectParam[0] : redirectParam
	);

	if (await getServerSession()) {
		redirect(redirectTo);
	}

	return <SignInForm redirectTo={redirectTo} />;
}
