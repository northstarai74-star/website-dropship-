/* Replace these five values once with the verified business details. */
window.NEEDVERSE_BUSINESS = Object.freeze({
  businessName: 'BUSINESS_NAME',
  supportEmail: 'SUPPORT_EMAIL',
  supportPhone: 'SUPPORT_PHONE',
  businessAddress: 'BUSINESS_ADDRESS',
  gstin: 'GSTIN_IF_ANY'
});

(() => {
  const details = window.NEEDVERSE_BUSINESS;
  document.querySelectorAll('[data-business]').forEach((node) => {
    const key = node.dataset.business;
    if (Object.prototype.hasOwnProperty.call(details, key)) node.textContent = details[key];
  });
  document.querySelectorAll('[data-business-email]').forEach((node) => {
    node.href = `mailto:${details.supportEmail}`;
    if (!node.textContent.trim()) node.textContent = details.supportEmail;
  });
  document.querySelectorAll('[data-business-phone]').forEach((node) => {
    node.href = `tel:${details.supportPhone}`;
    if (!node.textContent.trim()) node.textContent = details.supportPhone;
  });
})();
