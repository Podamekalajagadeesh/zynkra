import featureRegistryData from './index.json';

export const totalFeatureCount = 3836;

export const featureRegistrySummary = featureRegistryData;

export const featureSystemSlugs = Object.values(featureRegistryData.systems || {}).map((system: any) => system.slug);