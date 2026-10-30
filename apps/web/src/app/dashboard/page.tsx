import { redirect } from "next/navigation";

import { getDisplayName } from "@/lib/display-name";
import { getServerSession } from "@/lib/server-session";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
	const session = await getServerSession();

	if (!session) {
		redirect("/login?redirect=%2Fdashboard");
	}

	return (
		<div>
			<h1>仪表板</h1>
			<p>欢迎，{getDisplayName(session.user)}</p>
			<Dashboard />
		</div>
	);
}
