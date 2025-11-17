
export interface TaggedData {
  payerGroups: string[];
  providerGroups: string[];
  actions: string[];
  codeGroups: string[];
  chartIds: string[];
  sections: string[];
  triggers: string[];
  dates: string[];
}

export const parseTagsFromDescription = (description: string): TaggedData => {
  const result: TaggedData = {
    payerGroups: [],
    providerGroups: [],
    actions: [],
    codeGroups: [],
    chartIds: [],
    sections: [],
    triggers: [],
    dates: []
  };

  // Extract payer groups (@BCBS, @ANTHEM, @ALL)
  const payerMatches = description.match(/@(BCBS|ANTHEM|ALL|UHC|AETNA|CIGNA)/g);
  if (payerMatches) {
    result.payerGroups = payerMatches.map(match => match.replace('@', ''));
  }

  // Extract provider groups (@PHYSICIAN_MD_DO, @SPLIT_SHARED_FS)
  const providerMatches = description.match(/@(PHYSICIAN_MD_DO|SPLIT_SHARED_FS|NP_PA|RESIDENT)/g);
  if (providerMatches) {
    result.providerGroups = providerMatches.map(match => match.replace('@', ''));
  }

  // Extract actions (@ADD, @REMOVE, @COND_ADD)
  const actionMatches = description.match(/@(ADD|REMOVE|COND_ADD|LINK|UNLINK)\(?[^)]*\)?/g);
  if (actionMatches) {
    result.actions = actionMatches.map(match => match.replace('@', ''));
  }

  // Extract chart IDs (#UROL-001, #ENDO-045)
  const chartMatches = description.match(/#([A-Z]{3,4}-\d{3})/g);
  if (chartMatches) {
    result.chartIds = chartMatches.map(match => match.replace('#', ''));
  }

  // Extract sections (ASSESSMENT_PLAN, PROCEDURE_SECTION)
  const sectionMatches = description.match(/(ASSESSMENT_PLAN|PROCEDURE_SECTION|HPI|ROS|PFSH)/g);
  if (sectionMatches) {
    result.sections = [...new Set(sectionMatches)];
  }

  // Extract date ranges
  const dateMatches = description.match(/\d{4}-\d{2}-\d{2}/g);
  if (dateMatches) {
    result.dates = [...new Set(dateMatches)];
  }

  return result;
};

export const getTagBadgeColor = (tagType: keyof TaggedData): string => {
  switch (tagType) {
    case 'payerGroups':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'providerGroups':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'actions':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'codeGroups':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
