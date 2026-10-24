// Turns a rejected database write into one clear sentence. Raw provider text is never shown.
export type DbErrorLike = { code?: string } | null | undefined;

export function dbErrorMessage(error: DbErrorLike): string {
  switch (error?.code) {
    case "42501":
      return "That change isn't allowed on your account, so nothing was saved.";
    case "23505":
      return "That already exists (for example, a requirement of this type is already recorded). Edit the existing one instead.";
    case "23503":
      return "That refers to a record that no longer exists or isn't yours. Reload the page and try again.";
    case "23514":
    case "22P02":
    case "22003":
      return "Some of the values were rejected. Check the form and try again.";
    default:
      return "Couldn't save your change. Check your connection and try again.";
  }
}
