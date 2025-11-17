
export const COLOR_TOKENS = {
  payer: '#4C8DF6',      // Blue for BCBS, ANTHEM
  code_group: '#6C6F7F', // Grey for code groups
  modifier: '#F4A25B',   // Orange for modifier 25
  action_add: '#4BA37B', // Green for ADD actions
  action_remove: '#E85D75', // Red for REMOVE/DENY actions
  provider: '#8159D8'    // Purple for provider groups
};

export const getTokenColor = (type: string, value?: string): string => {
  switch (type) {
    case 'payer':
      return COLOR_TOKENS.payer;
    case 'code_group':
      return COLOR_TOKENS.code_group;
    case 'modifier':
      return COLOR_TOKENS.modifier;
    case 'action':
      // Determine color based on action text
      if (value && (value.toLowerCase().includes('add') || value.toLowerCase().includes('mod'))) {
        return COLOR_TOKENS.action_add;
      } else if (value && (value.toLowerCase().includes('remove') || value.toLowerCase().includes('deny'))) {
        return COLOR_TOKENS.action_remove;
      }
      return COLOR_TOKENS.action_add;
    case 'provider':
      return COLOR_TOKENS.provider;
    default:
      return COLOR_TOKENS.code_group;
  }
};
