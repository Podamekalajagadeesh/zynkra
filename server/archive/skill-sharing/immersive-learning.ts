interface ImmersiveSessionInput {
  title?: string;
  topic?: string;
  skill?: string;
  steps?: string[];
  durationMinutes?: number;
}

export function buildImmersiveLearningSession(input: ImmersiveSessionInput) {
  const steps = input.steps && input.steps.length > 0 ? input.steps : ['Observe', 'Practice', 'Reflect'];
  const summary = `Immersive learning session for ${input.topic || 'a new skill'} with guided practice in ${input.skill || 'the craft'}.`;
  const takeaway = `You will leave with a practical first-pass understanding of ${input.skill || 'the skill'} and a clear next step for continued practice.`;

  return {
    title: input.title || 'Immersive learning session',
    summary,
    durationMinutes: input.durationMinutes || 20,
    steps,
    takeaway,
  };
}
