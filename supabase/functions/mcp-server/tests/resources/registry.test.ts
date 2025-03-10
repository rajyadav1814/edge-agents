import { assertEquals, assertExists } from 'https://deno.land/std/testing/asserts.ts';

// Simple ResourceRegistry class for testing
class ResourceRegistry {
  private resources: Map<string, ResourceInfo>;
  private resourceTemplates: Map<string, ResourceTemplateInfo>;
  
  constructor() {
    this.resources = new Map();
    this.resourceTemplates = new Map();
  }
  
  registerResource(resource: ResourceInfo) {
    this.resources.set(resource.uri, resource);
  }
  
  registerResourceTemplate(template: ResourceTemplateInfo) {
    this.resourceTemplates.set(template.uriTemplate, template);
  }
  
  getResource(uri: string): ResourceInfo | undefined {
    return this.resources.get(uri);
  }
  
  getResourceTemplate(uriTemplate: string): ResourceTemplateInfo | undefined {
    return this.resourceTemplates.get(uriTemplate);
  }
  
  getAllResources(): ResourceInfo[] {
    return Array.from(this.resources.values());
  }
  
  getAllResourceTemplates(): ResourceTemplateInfo[] {
    return Array.from(this.resourceTemplates.values());
  }
}

// Resource info interface
interface ResourceInfo {
  uri: string;
  name: string;
  mimeType?: string;
  description?: string;
}

// Resource template info interface
interface ResourceTemplateInfo {
  uriTemplate: string;
  name: string;
  mimeType?: string;
  description?: string;
}

Deno.test("ResourceRegistry - Register Resource", () => {
  const registry = new ResourceRegistry();
  
  const resource: ResourceInfo = {
    uri: "weather://San Francisco/current",
    name: "Current weather in San Francisco",
    mimeType: "application/json",
    description: "Real-time weather data for San Francisco",
  };
  
  registry.registerResource(resource);
  const retrievedResource = registry.getResource("weather://San Francisco/current");
  
  assertExists(retrievedResource);
  assertEquals(retrievedResource.uri, "weather://San Francisco/current");
  assertEquals(retrievedResource.name, "Current weather in San Francisco");
});

Deno.test("ResourceRegistry - Register Resource Template", () => {
  const registry = new ResourceRegistry();
  
  const template: ResourceTemplateInfo = {
    uriTemplate: "weather://{city}/current",
    name: "Current weather for a city",
    mimeType: "application/json",
    description: "Real-time weather data for a specified city",
  };
  
  registry.registerResourceTemplate(template);
  const retrievedTemplate = registry.getResourceTemplate("weather://{city}/current");
  
  assertExists(retrievedTemplate);
  assertEquals(retrievedTemplate.uriTemplate, "weather://{city}/current");
  assertEquals(retrievedTemplate.name, "Current weather for a city");
});

Deno.test("ResourceRegistry - Get All Resources", () => {
  const registry = new ResourceRegistry();
  
  const resource1: ResourceInfo = {
    uri: "weather://San Francisco/current",
    name: "Current weather in San Francisco",
  };
  
  const resource2: ResourceInfo = {
    uri: "weather://New York/current",
    name: "Current weather in New York",
  };
  
  registry.registerResource(resource1);
  registry.registerResource(resource2);
  
  const allResources = registry.getAllResources();
  assertEquals(allResources.length, 2);
  assertEquals(
    allResources.map(r => r.uri).sort(),
    ["weather://New York/current", "weather://San Francisco/current"]
  );
});

Deno.test("ResourceRegistry - Get All Resource Templates", () => {
  const registry = new ResourceRegistry();
  
  const template1: ResourceTemplateInfo = {
    uriTemplate: "weather://{city}/current",
    name: "Current weather for a city",
  };
  
  const template2: ResourceTemplateInfo = {
    uriTemplate: "weather://{city}/forecast/{days}",
    name: "Weather forecast for a city",
  };
  
  registry.registerResourceTemplate(template1);
  registry.registerResourceTemplate(template2);
  
  const allTemplates = registry.getAllResourceTemplates();
  assertEquals(allTemplates.length, 2);
  assertEquals(
    allTemplates.map(t => t.uriTemplate).sort(),
    ["weather://{city}/current", "weather://{city}/forecast/{days}"]
  );
});