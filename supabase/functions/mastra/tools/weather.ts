/**
 * Weather tool for the Mastra AI agent
 * 
 * This module provides weather information functionality.
 */

import { z } from "zod";
import { config } from "../config/index.ts";
import { Tool, ToolExecuteParams } from "../types/index.ts";

/**
 * Input schema for the weather tool
 */
const weatherInputSchema = z.object({
  location: z.string().min(1, "Location is required"),
});

/**
 * Type for weather tool input
 */
type WeatherInput = z.infer<typeof weatherInputSchema>;

/**
 * Type for weather tool output
 */
interface WeatherOutput {
  temperature: number;
  condition: string;
  location: string;
  humidity?: number;
  windSpeed?: number;
  unit?: string;
}

/**
 * Implementation of the weather tool
 */
export const weatherTool: Tool = {
  id: "get-weather",
  description: "Get the current weather for a location",
  
  /**
   * Execute the weather tool
   * 
   * @param params Tool execution parameters
   * @returns Weather information for the specified location
   */
  execute: async (params: ToolExecuteParams): Promise<WeatherOutput> => {
    try {
      // Validate input
      const input = weatherInputSchema.parse(params.context) as WeatherInput;
      const { location } = input;
      
      // Get API key from environment variables
      const apiKey = config.api.weatherApiKey;
      
      // Check if API key is configured
      if (!apiKey) {
        console.error("Weather API key is not configured");
        // Return mock data for demonstration purposes
        return getMockWeatherData(location);
      }
      
      // In a real implementation, we would make an API call to a weather service
      // For example:
      // const response = await fetch(
      //   `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}`
      // );
      // const data = await response.json();
      // return transformWeatherData(data);
      
      // For now, return mock data
      return getMockWeatherData(location);
    } catch (error: unknown) {
      console.error("Error in weather tool:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get weather: ${errorMessage}`);
    }
  }
};

/**
 * Get mock weather data for demonstration purposes
 * 
 * @param location The location to get weather for
 * @returns Mock weather data
 */
function getMockWeatherData(location: string): WeatherOutput {
  // Generate random weather data for demonstration
  const conditions = ["Sunny", "Cloudy", "Rainy", "Partly Cloudy", "Clear", "Stormy"];
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
  const randomTemp = Math.floor(Math.random() * 30) + 10; // 10-40°C
  const randomHumidity = Math.floor(Math.random() * 60) + 30; // 30-90%
  const randomWindSpeed = Math.floor(Math.random() * 20) + 1; // 1-20 km/h
  
  return {
    temperature: randomTemp,
    condition: randomCondition,
    location: location,
    humidity: randomHumidity,
    windSpeed: randomWindSpeed,
    unit: "celsius"
  };
}

export default weatherTool;