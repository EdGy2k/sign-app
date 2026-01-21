export function escapeSubject(subject: string): string {
  return subject
    .replace(/\r\n/g, " ")
    .replace(/[\r\n]/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
