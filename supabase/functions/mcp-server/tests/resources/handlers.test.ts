import { assertEquals, assertExists } from 'https://deno.land/std/testing/asserts.ts';

// Mock weather data for testing
const mockWeatherData = {
  temperature: 22.5,
  conditions: "Partly Cloudy",
  humidity: 65,
  wind_speed: 10.2,
  timestamp: "2025-03-09T04:00:00.000Z",
};

// Simple handler function for testing
async function getWeatherResourceHandler(uri: string): Promise<ResourceResponse> {
  // Parse the URI to extract the city
  const match = uri.match(/^weather:\/\/([^/]+)\/current$/);
  
  if (!match) {
    throw new Error(`Invalid URI format: ${uri}`);
  }
  
  const city = decodeURIComponent(match[1]);
  
  // In a real implementation, this would call a weather API
  // For testing, we'll just return mock data
  return {
    contents: [
      {
        uri: uri,
        mimeType: "application/json",
        text: JSON.stringify(mockWeatherData, null, 2),
      },
    ],
  };
}

// Resource response interface
interface ResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}

interface ResourceResponse {
  contents: ResourceContent[];
}

Deno.test("Weather Resource Handler - Success", async () => {
  const uri = "weather://San Francisco/current";
  
  const response = await getWeatherResourceHandler(uri);
  
  assertExists(response);
  assertExists(response.contents);
  assertEquals(response.contents.length, 1);
  assertEquals(response.contents[0].uri, uri);
  assertEquals(response.contents[0].mimeType, "application/json");
  
  // Parse the JSON string to verify the data
  const data = JSON.parse(response.contents[0].text);
  assertEquals(data.temperature, 22.5);
  assertEquals(data.conditions, "Partly Cloudy");
  assertEquals(data.humidity, 65);
  assertEquals(data.wind_speed, 10.2);
});

Deno.test("Weather Resource Handler - Invalid URI", async () => {
  const uri = "weather://San Francisco/invalid";
  
  try {
    await getWeatherResourceHandler(uri);
    // If we reach here, the test should fail
    assertEquals(true, false, "Expected an error but none was thrown");
  } catch (error: unknown) {
    if (error instanceof Error) {
      assertEquals(error.message, `Invalid URI format: ${uri}`);
    } else {
      throw error; // Re-throw if it's not an Error instance
    }
  }
});