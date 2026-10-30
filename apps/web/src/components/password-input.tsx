"use client";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@gsw-ai-admin/ui/components/input-group";
import { Eye, EyeOff } from "lucide-react";
import { useCallback, useState } from "react";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

export default function PasswordInput(props: PasswordInputProps) {
	const [visible, setVisible] = useState(false);
	const toggleVisible = useCallback(
		() => setVisible((current) => !current),
		[]
	);

	return (
		<InputGroup>
			<InputGroupInput {...props} type={visible ? "text" : "password"} />
			<InputGroupAddon align="inline-end">
				<InputGroupButton
					aria-label={visible ? "隐藏密码" : "显示密码"}
					aria-pressed={visible}
					onClick={toggleVisible}
					size="icon-xs"
				>
					{visible ? <EyeOff /> : <Eye />}
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
}
