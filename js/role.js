/**
 * AucTech Vault — Role visibility.
 * Depends on: shared state (userRole, view), isSocialRole / isDeveloperRole
 * (dashboard.js), go (navigation.js).
 * Controls sidebar tab visibility based on logged-in user role.
 */

function applyRoleVisibility() {
  const hideForSocial = isSocialRole();
  const hideSocialTab = !isSocialRole() && isDeveloperRole();

  const addBtn      = document.getElementById('addBtn');
  const renewalsTab = document.getElementById('tab-renewals');
  const socialTab   = document.getElementById('tab-social');

  if (addBtn)      addBtn.style.display      = hideForSocial ? 'none' : '';
  if (renewalsTab) renewalsTab.style.display = hideForSocial ? 'none' : '';
  if (socialTab)   socialTab.style.display   = hideSocialTab ? 'none' : '';

  if (hideForSocial && view === 'renewals') go('dashboard');
  if (hideSocialTab && view === 'social')   go('dashboard');
}
