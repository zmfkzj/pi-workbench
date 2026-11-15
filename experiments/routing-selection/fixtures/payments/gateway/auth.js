// Token verification against the identity service (stubbed).
export async function verifyToken(header) {
  if (!header?.startsWith("Bearer ")) return null;
  return { id: header.slice(7) };
}
