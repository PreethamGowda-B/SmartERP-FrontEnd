const DEFAULT_SUPPORT_POLICY = Object.freeze({
  channels: Object.freeze(['email']),
  firstResponseBusinessHours: 18,
});

function formatSupportResponseTarget(policy) {
  const hours = Number(policy?.firstResponseBusinessHours);
  if (!Number.isFinite(hours) || hours <= 0) return 'Response target unavailable';
  if (hours % 9 === 0) {
    const days = hours / 9;
    return `within ${days} business day${days === 1 ? '' : 's'}`;
  }
  return `within ${hours} business hour${hours === 1 ? '' : 's'}`;
}

function getAvailableSupportChannels(policy) {
  const channels = Array.isArray(policy?.channels) ? policy.channels : DEFAULT_SUPPORT_POLICY.channels;
  return channels.filter((channel) => channel === 'email' || channel === 'whatsapp');
}

module.exports = { DEFAULT_SUPPORT_POLICY, formatSupportResponseTarget, getAvailableSupportChannels };
