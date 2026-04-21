export const TIERS = {
  TIER_1: {
    id: 1,
    name: 'Full Analysis',
    description: 'Competitive races — full Claude analysis across all 6 dimensions',
    maxTokensOutput: 1200,
    useBatchAPI: false,
  },
  TIER_2: {
    id: 2,
    name: 'Lightweight Analysis',
    description: 'All other declared candidates — compressed Claude analysis',
    maxTokensOutput: 300,
    useBatchAPI: true,
  },
  TIER_3: {
    id: 3,
    name: 'Algorithmic Score',
    description: 'Non-competitive incumbents — score derived from voting record only',
    maxTokensOutput: 0,
    useBatchAPI: false,
  }
}
