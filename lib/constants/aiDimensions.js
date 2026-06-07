export const AI_DIMENSIONS = {
  datacenters_energy: {
    label: 'Data Center Energy',
    weight: 0.25,
    description: 'Requires renewable energy for data centers',
  },
  water_usage: {
    label: 'Water Usage Policy',
    weight: 0.10,
    description: 'Supports water usage limits for data centers',
  },
  grid_impact: {
    label: 'Grid Impact',
    weight: 0.10,
    description: 'Supports grid modernization for AI infrastructure',
  },
  ai_safety: {
    label: 'AI Safety & Oversight',
    weight: 0.25,
    description: 'Supports federal AI oversight and safety testing',
  },
  algorithmic_accountability: {
    label: 'Algorithmic Accountability',
    weight: 0.15,
    description: 'Supports transparency and accountability for automated decisions',
  },
  ai_elections: {
    label: 'AI in Elections',
    weight: 0.10,
    description: 'Supports disclosure requirements for AI-generated political content',
  },
  ai_economic: {
    label: 'AI Economic Policy',
    weight: 0.05,
    description: 'Supports worker protections and creator rights in AI economy',
  },
}

export const AI_SCORE_RUBRIC = {
  modifiers: {
    big_tech_pac_donations_high:     -10,
    big_tech_pac_donations_moderate:  -5,
    ai_safety_bill_cosponsor:        +10,
    senate_ai_caucus_member:          +5,
    commerce_committee_member:        +5,
    made_ai_regulation_campaign_issue: +5,
  },
}
