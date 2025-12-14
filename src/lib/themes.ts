export const LABEL_TO_THEME: Record<string, string> = {
  'Staff Interaction': 'Staff and Service Quality',
  'Communication and Explanation': 'Staff and Service Quality',
  'Treatment Outcomes': 'Treatment and Procedures',
  'Dentist Quality': 'Treatment and Procedures',
  'Regular Check-up': 'Treatment and Procedures',
  'Specific Procedures': 'Specific Procedures',
  'Appointment and Scheduling': 'Appointment Management',
  'Pain Management': 'Emergency and Pain Management',
  'Anxiety Management and Patient Comfort': 'Dental Anxiety Management',
  'Overall Experience': 'Patient Experience',
  'NHS and Private Care': 'NHS and Private Care',
  'Cost and Value': 'NHS and Private Care',
  'Facility and Safety': 'Facilities and Equipment',
  Accessibility: 'Facilities and Equipment',
  'Pediatric Dentistry': 'Children and Family Dentistry',
};

export const THEMES = Array.from(new Set(Object.values(LABEL_TO_THEME)));

export type ThemeName = (typeof THEMES)[number];

export interface ThemeResult {
  predictedThemes: ThemeName[];
  themeProbabilities: Record<string, number>;
  threshold?: number;
}

export interface ThemeAggregates {
  coverage: Record<string, number>;
  intensity: Record<string, number>;
  coverageCounts: Record<string, number>;
  probabilitySums: Record<string, number>;
}

export function createEmptyThemeMap(): Record<string, number> {
  const map: Record<string, number> = {};
  THEMES.forEach((theme) => {
    map[theme] = 0;
  });
  return map;
}

export function processClassifierResponse(result: {
  predicted_labels?: string[];
  all_probabilities?: Record<string, number>;
  threshold?: number;
}): ThemeResult {
  const themeProbabilities = createEmptyThemeMap();

  Object.entries(result.all_probabilities || {}).forEach(([label, prob]) => {
    const theme = LABEL_TO_THEME[label];
    if (!theme) return;
    themeProbabilities[theme] = Math.max(themeProbabilities[theme], prob || 0);
  });

  const predictedThemes = Array.from(
    new Set(
      (result.predicted_labels || [])
        .map((label) => LABEL_TO_THEME[label])
        .filter((theme): theme is ThemeName => Boolean(theme)),
    ),
  );

  return { predictedThemes, themeProbabilities, threshold: result.threshold };
}

export function aggregatePracticeThemes(results: ThemeResult[]): ThemeAggregates {
  const coverageCounts = createEmptyThemeMap();
  const probabilitySums = createEmptyThemeMap();

  results.forEach((res) => {
    res.predictedThemes.forEach((theme) => {
      coverageCounts[theme] = (coverageCounts[theme] || 0) + 1;
    });
    Object.entries(res.themeProbabilities).forEach(([theme, prob]) => {
      probabilitySums[theme] = (probabilitySums[theme] || 0) + Number(prob || 0);
    });
  });

  const totalReviews = results.length || 1;
  const coverage: Record<string, number> = {};
  const intensity: Record<string, number> = {};

  THEMES.forEach((theme) => {
    coverage[theme] = (coverageCounts[theme] || 0) / totalReviews;
    intensity[theme] = (probabilitySums[theme] || 0) / totalReviews;
  });

  return { coverage, intensity, coverageCounts, probabilitySums };
}
