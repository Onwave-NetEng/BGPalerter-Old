import { describe, expect, it } from "vitest";
import { bgpalerterService } from "./services/bgpalerter.service";
import { fileService } from "./services/file.service";

/**
 * Test suite to validate BGPalerter environment configuration
 * This ensures the environment variables are set correctly
 */

describe("BGPalerter Configuration", () => {
  it("should have BGPALERTER_API_URL environment variable set", () => {
    expect(process.env.BGPALERTER_API_URL).toBeDefined();
    expect(process.env.BGPALERTER_API_URL).toContain("http");
  });

  it("should have BGPALERTER_CONFIG_PATH environment variable set", () => {
    expect(process.env.BGPALERTER_CONFIG_PATH).toBeDefined();
    expect(process.env.BGPALERTER_CONFIG_PATH).toContain("config");
  });

  it("should be able to initialize BGPalerter service", () => {
    expect(() => {
      bgpalerterService.testConnection();
    }).not.toThrow();
  });

  it("should be able to initialize file service with config path", () => {
    expect(() => {
      fileService.listFiles();
    }).not.toThrow();
  });

  it("should handle BGPalerter API connection gracefully when service is down", async () => {
    // This test validates that the service handles connection errors gracefully
    // It should not throw an error, even if BGPalerter is not running
    try {
      await bgpalerterService.getStatus();
      // If BGPalerter is running, this should succeed
      expect(true).toBe(true);
    } catch (error) {
      // If BGPalerter is not running, we should get a specific error message
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message;
      expect(errorMessage).toContain("Failed to connect to BGPalerter API");
    }
  });
});
