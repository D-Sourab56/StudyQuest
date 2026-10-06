export function getSubjectInitial(
  subjectName: string
): string {
  const cleanName =
    subjectName.trim();

  if (!cleanName) {
    return "?";
  }

  return cleanName
    .charAt(0)
    .toUpperCase();
}