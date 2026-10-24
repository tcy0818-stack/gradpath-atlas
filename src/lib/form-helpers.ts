import type { FormState } from "@/lib/auth/actions";

// Shared by the Server Actions: read a string field, and build the FormState a rejected or successful save returns.
export const text = (fd: FormData, k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string) : "");
export const echo = (fd: FormData) => Object.fromEntries([...fd.entries()].filter((e): e is [string, string] => typeof e[1] === "string"));
export const bad = (message: string, fd?: FormData): FormState => ({ status: "error", message, values: fd ? echo(fd) : undefined });
export const saved = (message = "Saved."): FormState => ({ status: "success", message });
