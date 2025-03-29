/**
 * Anonymizer module for user data obfuscation
 * Provides functions to anonymize user identifiers, IP addresses, and geolocation data
 */

/**
 * Configuration options for the anonymizer
 */
export interface AnonymizerConfig {
  /** Whether to enable anonymization */
  enabled: boolean;
  /** Salt used for hashing (should be stored securely) */
  salt?: string;
  /** Fields to anonymize */
  fields: {
    userId: boolean;
    ipAddress: boolean;
    geolocation: boolean;
    userAgent: boolean;
  };
  /** Endpoint for the next function in the chain */
  nextFunctionEndpoint?: string;
}

/**
 * User data to be anonymized
 */
export interface UserData {
  userId?: string;
  ipAddress?: string;
  geolocation?: {
    latitude?: number;
    longitude?: number;
    country?: string;
    region?: string;
  };
  userAgent?: string;
  [key: string]: any; // Allow additional properties
}

/**
 * Anonymized user data
 */
export interface AnonymizedData {
  userIdHash?: string;
  ipHash?: string;
  geoHash?: string | null;
  userAgentHash?: string | null;
  timestamp: number;
  [key: string]: any; // Allow additional properties
}

/**
 * Creates a SHA-256 hash of the input string with optional salt
 * @param input String to hash
 * @param salt Optional salt to add to the hash
 * @returns Hex-encoded hash
 */
export async function createHash(input: string, salt?: string): Promise<string> {
  if (!input) return "";
  
  const data = new TextEncoder().encode(salt ? `${input}:${salt}` : input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Anonymizes user data based on configuration
 * @param userData User data to anonymize
 * @param config Anonymizer configuration
 * @returns Anonymized data
 */
export async function anonymizeUserData(
  userData: UserData,
  config: AnonymizerConfig
): Promise<AnonymizedData> {
  if (!config.enabled) {
    return {
      ...userData,
      timestamp: Date.now(),
    } as AnonymizedData;
  }

  const anonymizedData: AnonymizedData = {
    timestamp: Date.now(),
  };

  // Anonymize user ID if enabled and present
  if (config.fields.userId && userData.userId) {
    anonymizedData.userIdHash = await createHash(userData.userId, config.salt);
  }

  // Anonymize IP address if enabled and present
  if (config.fields.ipAddress && userData.ipAddress) {
    anonymizedData.ipHash = await createHash(userData.ipAddress, config.salt);
  }

  // Anonymize geolocation if enabled and present
  if (config.fields.geolocation && userData.geolocation) {
    const geoString = JSON.stringify(userData.geolocation);
    anonymizedData.geoHash = await createHash(geoString, config.salt);
  } else if (config.fields.geolocation) {
    anonymizedData.geoHash = null;
  }

  // Anonymize user agent if enabled and present
  if (config.fields.userAgent && userData.userAgent) {
    anonymizedData.userAgentHash = await createHash(userData.userAgent, config.salt);
  }

  // Copy any additional properties that weren't anonymized
  Object.keys(userData).forEach(key => {
    if (!['userId', 'ipAddress', 'geolocation', 'userAgent'].includes(key)) {
      anonymizedData[key] = userData[key];
    }
  });

  return anonymizedData;
}

/**
 * Forwards anonymized data to the next function in the chain
 * @param anonymizedData Anonymized user data
 * @param endpoint Endpoint URL for the next function
 * @param token Authorization token
 * @returns Response from the next function
 */
export async function forwardToNextFunction(
  anonymizedData: AnonymizedData,
  endpoint: string,
  token?: string
): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(anonymizedData),
  });
}