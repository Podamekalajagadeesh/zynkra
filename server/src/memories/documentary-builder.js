function summarizeContent(content) {
  const cleaned = content.replace(/\s+/g, ' ').trim();
  return cleaned.length > 140 ? `${cleaned.slice(0, 137)}...` : cleaned;
}

function buildDocumentarySummary(payload) {
  const memories = payload.memories ?? [];
  const participantNames = (payload.participantNames ?? []).filter(Boolean);
  const eventName = payload.eventName ?? 'shared memory event';
  const title = payload.title ?? `${eventName} documentary`;

  const highlights = memories
    .map((memory) => summarizeContent(memory.content ?? 'Shared memory fragment'))
    .filter(Boolean)
    .slice(0, 4);

  const summary = [
    `A full-sensory documentary for ${eventName} compiled from ${memories.length} memories.`,
    participantNames.length > 0 ? `Participants: ${participantNames.join(', ')}.` : 'Multiple perspectives were woven into the narrative.',
    `Highlights: ${highlights.join(' | ')}`,
  ].join(' ');

  return {
    title,
    eventName,
    summary,
    participantNames,
    memoryCount: memories.length,
    highlights,
  };
}

module.exports = { buildDocumentarySummary };
