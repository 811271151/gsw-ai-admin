"use client";

import { Input } from "@gsw-ai-admin/ui/components/input";
import { Label } from "@gsw-ai-admin/ui/components/label";
import { useCallback } from "react";

import PasswordInput from "./password-input";

interface FormFieldProps {
	autoComplete?: string;
	errors: readonly unknown[];
	label: string;
	name: string;
	onBlur: () => void;
	onChange: (value: string) => void;
	showErrors: boolean;
	type?: "email" | "password" | "text";
	value: string;
}

// TanStack Form 配合 Zod 时 errors 里是 issue 对象，手写校验时可能是字符串
const messageOf = (error: unknown): string | undefined => {
	if (typeof error === "string") {
		return error;
	}
	if (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		typeof error.message === "string"
	) {
		return error.message;
	}
	return undefined;
};

const toMessages = (errors: readonly unknown[]): string[] => [
	...new Set(
		errors
			.map(messageOf)
			.filter((message): message is string => Boolean(message))
	),
];

export default function FormField({
	autoComplete,
	errors,
	label,
	name,
	onBlur,
	onChange,
	showErrors,
	type = "text",
	value,
}: FormFieldProps) {
	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) =>
			onChange(event.target.value),
		[onChange]
	);
	const messages = showErrors ? toMessages(errors) : [];
	const hasErrors = messages.length > 0;
	const errorId = `${name}-error`;
	const inputProps = {
		"aria-describedby": hasErrors ? errorId : undefined,
		"aria-invalid": hasErrors,
		autoComplete,
		id: name,
		name,
		onBlur,
		onChange: handleChange,
		value,
	};

	return (
		<div className="space-y-2">
			<Label htmlFor={name}>{label}</Label>
			{type === "password" ? (
				<PasswordInput {...inputProps} />
			) : (
				<Input {...inputProps} type={type} />
			)}
			{hasErrors ? (
				<div id={errorId}>
					{messages.map((message) => (
						<p className="text-destructive text-xs" key={message}>
							{message}
						</p>
					))}
				</div>
			) : null}
		</div>
	);
}
