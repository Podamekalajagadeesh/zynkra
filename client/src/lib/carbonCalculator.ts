// Carbon footprint calculation utilities for content creation
// These calculations are based on industry standard estimates for digital content emissions

// Carbon emission factors (in grams of CO2e per GB of data transferred)
const EMISSION_FACTORS = {
  // Cloud storage emissions
  storage: 1.5, // 1.5g CO2e per GB stored per year
  
  // Data transfer emissions (varies by region, average global estimate)
  dataTransfer: 2.0, // 2.0g CO2e per GB transferred
  
  // Content processing emissions (encoding, transcoding, etc.)
  processing: {
    video: 0.8, // 0.8g CO2e per minute of video processed
    image: 0.02, // 0.02g CO2e per image processed
    audio: 0.05, // 0.05g CO2e per minute of audio processed
    text: 0.001, // 0.001g CO2e per KB of text processed
  },
  
  // Streaming emissions (per view)
  streaming: {
    '720p': 0.35, // 0.35g CO2e per view of 720p video (assumes 5min view)
    '1080p': 0.7, // 0.7g CO2e per view of 1080p video
    '4k': 1.8, // 1.8g CO2e per view of 4K video
    '8k': 3.6, // 3.6g CO2e per view of 8K video
    image: 0.015, // 0.015g CO2e per image view
    audio: 0.03, // 0.03g CO2e per minute of audio streamed
  }
};

// Platform's sustainability efforts offsets (percentage of emissions reduced through renewables)
const PLATFORM_OFFSET_RATE = 0.4; // 40% of emissions are currently offset by platform renewables
const PLATFORM_TARGET_OFFSET_RATE = 0.7; // Target to reach 70% by 2030

interface ContentMetadata {
  type: 'video' | 'image' | 'audio' | 'text';
  sizeInBytes: number;
  durationInSeconds?: number;
  resolution?: string;
  textLengthInKB?: number;
}

interface CarbonFootprint {
  processingEmissions: number;
  transferEmissions: number;
  storageEmissions: number;
  totalEmissions: number;
  platformOffset: number;
  netEmissions: number;
  emissionsSaved: number; // Compared to average platform content
  sustainabilityScore: number; // 0-100, higher is better
  recommendations: string[];
}

// Calculate carbon footprint for a piece of content
export function calculateCarbonFootprint(metadata: ContentMetadata): CarbonFootprint {
  const sizeInGB = metadata.sizeInBytes / (1024 * 1024 * 1024);
  let processingEmissions = 0;
  let transferEmissions = sizeInGB * EMISSION_FACTORS.dataTransfer;
  let storageEmissions = sizeInGB * EMISSION_FACTORS.storage; // Annual storage emissions
  
  // Calculate processing emissions based on content type
  if (metadata.type === 'video' && metadata.durationInSeconds) {
    const durationInMinutes = metadata.durationInSeconds / 60;
    processingEmissions = durationInMinutes * EMISSION_FACTORS.processing.video;
  } else if (metadata.type === 'image') {
    processingEmissions = EMISSION_FACTORS.processing.image;
  } else if (metadata.type === 'audio' && metadata.durationInSeconds) {
    const durationInMinutes = metadata.durationInSeconds / 60;
    processingEmissions = durationInMinutes * EMISSION_FACTORS.processing.audio;
  } else if (metadata.type === 'text' && metadata.textLengthInKB) {
    processingEmissions = metadata.textLengthInKB * EMISSION_FACTORS.processing.text;
  }
  
  const totalEmissions = processingEmissions + transferEmissions + storageEmissions;
  const platformOffset = totalEmissions * PLATFORM_OFFSET_RATE;
  const netEmissions = totalEmissions - platformOffset;
  
  // Generate recommendations to reduce emissions
  const recommendations: string[] = [];
  let emissionsSaved = 0;
  let sustainabilityScore = 100;
  
  // Resolution-based recommendations for videos
  if (metadata.type === 'video') {
    if (metadata.resolution === '8k') {
      recommendations.push('Consider using 4K resolution instead of 8K to reduce emissions by ~50%');
      emissionsSaved += 1.8; // Approximate savings
      sustainabilityScore -= 30;
    } else if (metadata.resolution === '4k') {
      recommendations.push('1080p resolution would reduce this content\'s emissions by ~61%');
      emissionsSaved += 1.1;
      sustainabilityScore -= 15;
    } else if (metadata.resolution === '1080p') {
      recommendations.push('720p is a great sustainable choice for most social media content');
      sustainabilityScore += 5;
    }
  }
  
  // Duration recommendations
  if (metadata.durationInSeconds && metadata.durationInSeconds > 60) {
    recommendations.push('Shorter videos (<60s) have significantly lower carbon footprints');
    sustainabilityScore -= 10;
  }
  
  // Compression recommendation for large files
  if (sizeInGB > 0.1) { // Files larger than 100MB
    recommendations.push('Optimize file compression to reduce data transfer and storage emissions');
    sustainabilityScore -= 5;
  }
  
  // General tips
  recommendations.push('Learn more about our platform\'s transition to 100% renewable energy');
  
  // Ensure score stays within 0-100
  sustainabilityScore = Math.max(0, Math.min(100, sustainabilityScore));
  
  return {
    processingEmissions,
    transferEmissions,
    storageEmissions,
    totalEmissions,
    platformOffset,
    netEmissions,
    emissionsSaved,
    sustainabilityScore,
    recommendations
  };
}

// Get platform-wide sustainability metrics
export function getPlatformSustainabilityMetrics() {
  return {
    currentOffsetRate: PLATFORM_OFFSET_RATE * 100,
    targetOffsetRate: PLATFORM_TARGET_OFFSET_RATE * 100,
    totalEmissionsOffsetToDate: 1250000, // 1,250 tonnes of CO2e offset to date
    renewableEnergyPercentage: 55, // 55% of platform energy from renewables
    yearlyEmissions: 2800000, // 2,800 tonnes of CO2e annual emissions
    treesPlanted: 45000, // Number of trees planted through platform initiatives
    usersCarbonSaved: 150000, // Total emissions saved by users making sustainable choices
  };
}

// Format carbon emissions for display
export function formatCarbonEmissions(grams: number): string {
  if (grams < 1) {
    return `${(grams * 1000).toFixed(1)} mg CO2e`;
  } else if (grams < 1000) {
    return `${grams.toFixed(2)}g CO2e`;
  } else {
    return `${(grams / 1000).toFixed(2)}kg CO2e`;
  }
}