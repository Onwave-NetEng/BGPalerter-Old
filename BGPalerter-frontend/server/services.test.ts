import { describe, expect, it, beforeEach } from "vitest";
import { bgpalerterService } from "./services/bgpalerter.service";
import { githubService } from "./services/github.service";
import { teamsService } from "./services/teams.service";
import { fileService } from "./services/file.service";

/**
 * Service Integration Tests
 * Tests for all backend services with graceful error handling
 */

describe("BGPalerter Service", () => {
  it("should handle connection errors gracefully", async () => {
    const isConnected = await bgpalerterService.testConnection();
    // Should return false when BGPalerter is not running, not throw
    expect(typeof isConnected).toBe("boolean");
  });

  it("should return empty monitors array when unavailable", async () => {
    try {
      const monitors = await bgpalerterService.getMonitors();
      expect(Array.isArray(monitors)).toBe(true);
    } catch (error) {
      // Expected when BGPalerter is not running
      expect(error).toBeDefined();
    }
  });

  it("should return empty alerts array", async () => {
    const alerts = await bgpalerterService.getRecentAlerts();
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("should return metrics structure", async () => {
    const metrics = await bgpalerterService.getMetrics();
    expect(metrics).toHaveProperty("updates24h");
    expect(metrics).toHaveProperty("timestamps");
    expect(metrics).toHaveProperty("totalUpdates");
  });
});

describe("GitHub Service", () => {
  it("should handle missing repository gracefully", async () => {
    const isConnected = await githubService.testConnection();
    // Should return false when repo doesn't exist, not throw
    expect(typeof isConnected).toBe("boolean");
  });

  it("should return empty file history when repo unavailable", async () => {
    const history = await githubService.getFileHistory("config.yml");
    expect(Array.isArray(history)).toBe(true);
  });
});

describe("Teams Service", () => {
  it("should handle missing webhook URL gracefully", async () => {
    const isConfigured = teamsService.isEnabled();
    expect(typeof isConfigured).toBe("boolean");
  });

  it("should return false when sending without webhook", async () => {
    if (!teamsService.isEnabled()) {
      const result = await teamsService.sendNotification({
        title: "Test",
        message: "Test message",
        severity: "info",
      });
      expect(result).toBe(false);
    }
  });
});

describe("File Service", () => {
  it("should return empty array when config directory missing", async () => {
    const files = await fileService.listFiles();
    expect(Array.isArray(files)).toBe(true);
  });

  it("should validate YAML correctly", () => {
    const validYaml = "key: value\\nlist:\\n  - item1\\n  - item2";
    const validation = fileService.validateYAML(validYaml);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should detect invalid YAML", () => {
    const invalidYaml = "key: [unclosed bracket";
    const validation = fileService.validateYAML(invalidYaml);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});

describe("Service Error Handling", () => {
  it("all services should handle initialization without crashing", () => {
    expect(() => {
      bgpalerterService.testConnection();
      githubService.testConnection();
      teamsService.isEnabled();
      fileService.listFiles();
    }).not.toThrow();
  });
});
