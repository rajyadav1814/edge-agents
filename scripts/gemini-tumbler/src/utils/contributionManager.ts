/**
 * Manages anonymous contributions to improve the model
 */

import { AnonymousContribution, ContributionFeedback } from "../types/index.ts";
import { generateAnonymousId, hashData } from "./crypto.ts";

export class ContributionManager {
  private contributions: Map<string, AnonymousContribution> = new Map();
  private storageEnabled: boolean;
  private storageLocation?: string;
  private contributionEndpoint?: string;

  constructor(options: {
    storageEnabled?: boolean;
    storageLocation?: string;
    contributionEndpoint?: string;
  }) {
    this.storageEnabled = options.storageEnabled ?? false;
    this.storageLocation = options.storageLocation;
    this.contributionEndpoint = options.contributionEndpoint;
  }

  /**
   * Store a contribution anonymously
   * @param contribution The contribution to store
   * @returns The ID of the stored contribution
   */
  async storeContribution(contribution: Omit<AnonymousContribution, "id">): Promise<string> {
    // Generate a unique ID for this contribution
    const id = crypto.randomUUID();
    
    // Create the full contribution object
    const fullContribution: AnonymousContribution = {
      ...contribution,
      id
    };
    
    // Store in memory
    this.contributions.set(id, fullContribution);
    
    // If storage is enabled, store to disk
    if (this.storageEnabled && this.storageLocation) {
      await this.persistContribution(fullContribution);
    }
    
    // If contribution endpoint is configured, send there
    if (this.contributionEndpoint) {
      await this.sendContributionToEndpoint(fullContribution);
    }
    
    return id;
  }

  /**
   * Add feedback to a contribution
   * @param id The ID of the contribution
   * @param feedback The feedback to add
   * @returns Whether the feedback was successfully added
   */
  async addFeedback(id: string, feedback: ContributionFeedback): Promise<boolean> {
    // Check if contribution exists
    if (!this.contributions.has(id)) {
      return false;
    }
    
    // Get the contribution
    const contribution = this.contributions.get(id)!;
    
    // Add feedback
    if (!contribution.feedback) {
      contribution.feedback = [feedback];
    } else {
      contribution.feedback.push(feedback);
    }
    
    // Update in memory
    this.contributions.set(id, contribution);
    
    // If storage is enabled, update on disk
    if (this.storageEnabled && this.storageLocation) {
      await this.persistContribution(contribution);
    }
    
    // If contribution endpoint is configured, send updated feedback
    if (this.contributionEndpoint) {
      await this.sendFeedbackToEndpoint(id, feedback);
    }
    
    return true;
  }

  /**
   * Get a contribution by ID
   * @param id The ID of the contribution
   * @returns The contribution, or undefined if not found
   */
  getContribution(id: string): AnonymousContribution | undefined {
    return this.contributions.get(id);
  }

  /**
   * Get all contributions
   * @returns All contributions
   */
  getAllContributions(): AnonymousContribution[] {
    return Array.from(this.contributions.values());
  }

  /**
   * Generate a new anonymous ID for a user
   * @returns A new anonymous ID
   */
  generateAnonymousUserId(): string {
    return generateAnonymousId();
  }

  /**
   * Persist a contribution to disk
   * @param contribution The contribution to persist
   */
  private async persistContribution(contribution: AnonymousContribution): Promise<void> {
    try {
      if (!this.storageLocation) return;
      
      // Create directory if it doesn't exist
      try {
        await Deno.mkdir(this.storageLocation, { recursive: true });
      } catch (e) {
        // Directory might already exist, ignore
      }
      
      // Write to file
      const filePath = `${this.storageLocation}/${contribution.id}.json`;
      await Deno.writeTextFile(filePath, JSON.stringify(contribution, null, 2));
    } catch (error) {
      console.error("Failed to persist contribution:", error);
    }
  }

  /**
   * Send a contribution to the configured endpoint
   * @param contribution The contribution to send
   */
  private async sendContributionToEndpoint(contribution: AnonymousContribution): Promise<void> {
    if (!this.contributionEndpoint) return;
    
    try {
      // Hash the prompt and response to ensure privacy
      const hashedContribution = {
        ...contribution,
        prompt: await hashData(contribution.prompt),
        response: await hashData(contribution.response)
      };
      
      try {
        // Send to endpoint
        const response = await fetch(this.contributionEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(hashedContribution)
        });
        
        if (!response.ok) {
          console.log(`Note: Contribution endpoint returned ${response.status} - continuing without contribution`);
        }
      } catch (fetchError) {
        console.log(`Note: Contribution endpoint not available - continuing without contribution`);
      }
    } catch (error) {
      console.log(`Note: Unable to process contribution - continuing normally`);
    }
  }

  /**
   * Send feedback to the configured endpoint
   * @param id The ID of the contribution
   * @param feedback The feedback to send
   */
  private async sendFeedbackToEndpoint(id: string, feedback: ContributionFeedback): Promise<void> {
    if (!this.contributionEndpoint) return;
    
    try {
      try {
        // Send to endpoint
        const response = await fetch(`${this.contributionEndpoint}/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id,
            feedback
          })
        });
        
        if (!response.ok) {
          console.log(`Note: Feedback endpoint returned ${response.status} - continuing without feedback`);
        }
      } catch (fetchError) {
        console.log(`Note: Feedback endpoint not available - continuing without feedback`);
      }
    } catch (error) {
      console.log(`Note: Unable to process feedback - continuing normally`);
    }
  }
}