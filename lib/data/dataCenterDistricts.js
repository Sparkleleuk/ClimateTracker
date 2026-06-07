/**
 * Data center district map.
 * Hardcoded map of states and congressional districts with significant
 * data center presence relevant to AI policy analysis.
 *
 * market_size: 'major' | 'significant' | 'minor'
 * water_stress: 'high' | 'medium' | 'low'
 * grid_stress:  'high' | 'medium' | 'low'
 */

const DATA_CENTER_MAP = [
  {
    state:            'Virginia',
    district:         'statewide',
    marketSize:       'major',
    notes:            'Largest data center market in the world (Loudoun County). Home to AWS, Microsoft Azure, Google, Meta hyperscale campuses.',
    primaryOperators: ['Amazon Web Services', 'Microsoft', 'Google', 'Meta', 'Equinix', 'Digital Realty'],
    waterStress:      'medium',
    gridStress:       'high',
  },
  {
    state:            'Texas',
    district:         'statewide',
    marketSize:       'major',
    notes:            'Major hub in Dallas, Austin, and San Antonio. ERCOT grid stress from AI load growth.',
    primaryOperators: ['Amazon', 'Microsoft', 'Google', 'Oracle', 'Aligned Data Centers'],
    waterStress:      'high',
    gridStress:       'high',
  },
  {
    state:            'Iowa',
    district:         'statewide',
    marketSize:       'significant',
    notes:            'Major Google and Microsoft campuses. Uses wind energy. Water concerns in farming regions.',
    primaryOperators: ['Google', 'Microsoft', 'Meta'],
    waterStress:      'medium',
    gridStress:       'low',
  },
  {
    state:            'Georgia',
    district:         'statewide',
    marketSize:       'significant',
    notes:            'Growing market around Atlanta. Major AWS, Google, and Microsoft presence.',
    primaryOperators: ['Amazon Web Services', 'Google', 'Microsoft', 'QTS Realty'],
    waterStress:      'medium',
    gridStress:       'medium',
  },
  {
    state:            'Nevada',
    district:         'statewide',
    marketSize:       'significant',
    notes:            'Las Vegas and Reno growing rapidly. High water stress in Mojave Desert context.',
    primaryOperators: ['Switch', 'Amazon', 'Google', 'Apple'],
    waterStress:      'high',
    gridStress:       'medium',
  },
  {
    state:            'Ohio',
    district:         'statewide',
    marketSize:       'significant',
    notes:            'Columbus emerging as major hub. Amazon and Microsoft significant presence.',
    primaryOperators: ['Amazon Web Services', 'Microsoft', 'Google', 'Equinix'],
    waterStress:      'low',
    gridStress:       'medium',
  },
  {
    state:            'Arizona',
    district:         'statewide',
    marketSize:       'significant',
    notes:            'Phoenix is one of the fastest-growing data center markets. Extreme water stress in desert climate.',
    primaryOperators: ['Microsoft', 'Google', 'Meta', 'CyrusOne', 'Iron Mountain'],
    waterStress:      'high',
    gridStress:       'medium',
  },
  {
    state:            'North Carolina',
    district:         'statewide',
    marketSize:       'significant',
    notes:            'Research Triangle and Charlotte growing. Apple, Google, Microsoft campuses.',
    primaryOperators: ['Apple', 'Google', 'Microsoft', 'Amazon'],
    waterStress:      'low',
    gridStress:       'medium',
  },
  {
    state:            'Illinois',
    district:         'statewide',
    marketSize:       'significant',
    notes:            'Chicago is the Midwest financial and data hub. Major colocation market.',
    primaryOperators: ['Equinix', 'Digital Realty', 'CyrusOne', 'Google'],
    waterStress:      'low',
    gridStress:       'medium',
  },
  {
    state:            'New Jersey',
    district:         'statewide',
    marketSize:       'significant',
    notes:            'Northern NJ is a major financial data center hub serving NYC market.',
    primaryOperators: ['Equinix', 'Digital Realty', 'CyrusOne', 'Verizon'],
    waterStress:      'low',
    gridStress:       'high',
  },
  {
    state:            'Oregon',
    district:         'statewide',
    marketSize:       'significant',
    notes:            'The Dalles gorge is a major Google/Amazon campus area with hydropower access.',
    primaryOperators: ['Google', 'Amazon', 'Apple', 'Facebook/Meta'],
    waterStress:      'medium',
    gridStress:       'low',
  },
  {
    state:            'Washington',
    district:         'statewide',
    marketSize:       'significant',
    notes:            'Microsoft HQ state. Major Azure and AWS infrastructure. Eastern WA growing.',
    primaryOperators: ['Microsoft', 'Amazon', 'Google'],
    waterStress:      'medium',
    gridStress:       'medium',
  },
  {
    state:            'Montana',
    district:         'statewide',
    marketSize:       'minor',
    notes:            'Emerging market given cheap power. Limited current footprint.',
    primaryOperators: [],
    waterStress:      'low',
    gridStress:       'low',
  },
]

/**
 * Get data center district info for a candidate's state and district.
 *
 * @param {string} state - Full state name
 * @param {string|null} district - Congressional district number or null for statewide
 * @returns {Object|null}
 */
export function getDataCenterInfo(state, district) {
  const entry = DATA_CENTER_MAP.find(d => d.state === state)
  if (!entry) return null

  // District-specific override would go here; currently all entries are statewide
  return entry
}

export { DATA_CENTER_MAP }
