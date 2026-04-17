/**
 * Free tests configuration
 * These tests are available to all users without premium subscription
 * 
 * Currently includes the first 2 TS EAMCET 2024 papers:
 * 1. TS EAMCET 7 May 2024 Shift 1 Paper (test_id: 49)
 * 2. TS EAMCET 7 May 2024 Shift 2 Paper (test_id: 50)
 */

export const FREE_TEST_IDS = [52, 53] as const;

/**
 * Check if a test is free (doesn't require premium)
 * @param testId - The test ID to check
 * @returns true if the test is free, false otherwise
 */
export function isFreeTest(testId: string | number): boolean {
  const id = typeof testId === 'string' ? parseInt(testId, 10) : testId;
  return FREE_TEST_IDS.includes(id as any);
}

/**
 * Get all free test IDs
 * @returns Array of free test IDs
 */
export function getFreeTestIds(): number[] {
  return [...FREE_TEST_IDS];
}

