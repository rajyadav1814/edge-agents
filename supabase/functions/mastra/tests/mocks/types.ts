/**
 * Type definitions for test mocks
 */

/**
 * Weather output type for testing
 */
export interface WeatherOutput {
  temperature: number;
  condition: string;
  location: string;
  humidity?: number;
  windSpeed?: number;
  unit?: string;
}