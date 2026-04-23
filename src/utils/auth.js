export function isAdminUser(user) {
  if (!user) return false;

  const roleFromMeta = user.app_metadata?.role || user.user_metadata?.role;
  if (roleFromMeta === 'admin') return true;

  const adminEmails = ['ville.j.lehtola@gmail.com'];
  return adminEmails.includes(user.email || '');
}
