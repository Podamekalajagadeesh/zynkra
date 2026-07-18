export interface MemoryProjectSummaryInput {
  title: string;
  topic: string;
  description: string;
  memoryCount: number;
  contributorNames: string[];
}

export interface MemoryProjectSummary {
  title: string;
  summary: string;
  memoryCount: number;
  contributorNames: string[];
}

export function buildMemoryProjectSummary(input: MemoryProjectSummaryInput): MemoryProjectSummary {
  const contributors = input.contributorNames.length > 0 ? input.contributorNames.join(', ') : 'community contributors';
  const summary = [
    `Collaborative memory project focused on ${input.topic}.`,
    input.description,
    `Shared with ${contributors} across ${input.memoryCount} memories.`,
  ].join(' ');

  return {
    title: input.title,
    summary,
    memoryCount: input.memoryCount,
    contributorNames: input.contributorNames,
  };
}
