/**
 * Nombre corto para mostrar en espacios chicos (headers, badges): primer
 * nombre + primer apellido. Prioriza `firstName`/`lastName` cuando existen
 * (registros nuevos, que ya piden esos campos por separado); si no, hace un
 * mejor esfuerzo dividiendo el `name` combinado de cuentas más viejas.
 */
export function shortName(user?: { name?: string; firstName?: string; lastName?: string } | null): string {
  if (user?.firstName && user?.lastName) {
    const first = user.firstName.trim().split(/\s+/)[0] ?? '';
    const last  = user.lastName.trim().split(/\s+/)[0] ?? '';
    return [first, last].filter(Boolean).join(' ');
  }

  const parts = (user?.name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return parts.join(' ');
  // Sin el desglose real, se asume la convención más común en Ecuador:
  // dos nombres + dos apellidos — el primer apellido queda antepenúltimo.
  return `${parts[0]} ${parts[parts.length - 2]}`;
}
