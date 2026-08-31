export const totalFeatureCount = 3836;
const featureRegistryData = require('./index.json') as {
  systems?: Record<string, { slug?: string }>;
};

export const featureRegistrySummary = featureRegistryData;

export const featureSystemSlugs = Object.values(featureRegistryData.systems || {}).map((system: any) => system.slug);