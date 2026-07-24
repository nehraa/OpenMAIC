export function buildClassroomUrl(classroomId: string, publicBase: string): string {
  const id = classroomId.trim();
  const configuredBase = publicBase.trim();
  if (!id || !configuredBase) return '#';

  const base = configuredBase.replace(/\/+$/, '');
  const classroomBase = base.endsWith('/classroom') ? base : `${base}/classroom`;
  return `${classroomBase}/${encodeURIComponent(id)}`;
}
