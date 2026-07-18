function buildArchiveLibrarySummary(input) {
  return {
    title: input.title || 'Preserved memory archive',
    summary: `A public archive entry about ${input.description || 'shared cultural knowledge'} preserved for future generations.`,
    materialType: input.materialType || 'story',
    language: input.language || 'Unknown',
  };
}

module.exports = { buildArchiveLibrarySummary };
