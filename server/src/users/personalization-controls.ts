export interface PersonalizationControls {
  feedPersonalization: boolean;
  searchPersonalization: boolean;
  recommendations: boolean;
  notificationPersonalization: boolean;
  creatorPersonalization: boolean;
  communityPersonalization: boolean;
  shoppingPersonalization: boolean;
  eventPersonalization: boolean;
  locationPersonalization: boolean;
  activityPersonalization: boolean;
}

export const DEFAULT_PERSONALIZATION_CONTROLS: PersonalizationControls = {
  feedPersonalization: true,
  searchPersonalization: true,
  recommendations: true,
  notificationPersonalization: true,
  creatorPersonalization: true,
  communityPersonalization: true,
  shoppingPersonalization: true,
  eventPersonalization: true,
  locationPersonalization: true,
  activityPersonalization: true,
};

export function normalizePersonalizationControls(
  controls?: Partial<PersonalizationControls> | null,
): PersonalizationControls {
  return {
    ...DEFAULT_PERSONALIZATION_CONTROLS,
    ...(controls ?? {}),
  };
}
