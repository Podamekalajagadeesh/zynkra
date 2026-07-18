export class AnalyzeBiasDto {
  feedContent: any[];
  interactionContext: {
    userId: string;
    timeframe: string;
    contentTypes: string[];
  };
}