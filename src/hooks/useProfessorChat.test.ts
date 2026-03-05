import { describe, it, expect } from "vitest";

// Pattern constants mirrored from useProfessorChat.ts for unit testing
const EXPERTISE_LEVEL_PATTERN = /USER LEVEL SET:\s*\[?(Novice|Intermediate|Expert)\]?/i;
const CALIBRATION_REQUEST_PATTERN = /CALIBRATION_REQUEST:\s*(\{.*?\})/;
const DIAGNOSTIC_EVENT_PATTERN = /DIAGNOSTIC_EVENT:\s*(\{[\s\S]*\})$/;
const SYSTEM_EVENT_PATTERN = /SYSTEM_EVENT:\s*(\{[\s\S]*?\})(?:\s|$)/;

describe("useProfessorChat — response tag parsing", () => {
  describe("EXPERTISE_LEVEL_PATTERN", () => {
    it("matches Novice level tag", () => {
      expect("Some response USER LEVEL SET: Novice more text".match(EXPERTISE_LEVEL_PATTERN)?.[1]).toBe("Novice");
    });
    it("matches Intermediate level tag with brackets", () => {
      expect("USER LEVEL SET: [Intermediate]".match(EXPERTISE_LEVEL_PATTERN)?.[1]).toBe("Intermediate");
    });
    it("matches Expert level tag case-insensitively", () => {
      expect("user level set: expert".match(EXPERTISE_LEVEL_PATTERN)?.[1]).toBe("expert");
    });
    it("does not match invalid levels", () => {
      expect("USER LEVEL SET: Beginner".match(EXPERTISE_LEVEL_PATTERN)).toBeNull();
    });
  });

  describe("CALIBRATION_REQUEST_PATTERN", () => {
    it("matches a calibration request with JSON", () => {
      const input = 'Some text CALIBRATION_REQUEST: {"topic":"Finance"} more';
      const match = input.match(CALIBRATION_REQUEST_PATTERN);
      expect(match?.[1]).toBe('{"topic":"Finance"}');
    });
    it("does not match when tag is absent", () => {
      expect("No calibration here".match(CALIBRATION_REQUEST_PATTERN)).toBeNull();
    });
  });

  describe("DIAGNOSTIC_EVENT_PATTERN", () => {
    it("matches a diagnostic event at end of string", () => {
      const input = 'Here is your quiz DIAGNOSTIC_EVENT: {"questions":[]}';
      const match = input.match(DIAGNOSTIC_EVENT_PATTERN);
      expect(match?.[1]).toContain('"questions"');
    });
    it("does not match if tag is not at end", () => {
      const input = 'DIAGNOSTIC_EVENT: {"questions":[]} trailing text';
      expect(input.match(DIAGNOSTIC_EVENT_PATTERN)).toBeNull();
    });
  });

  describe("SYSTEM_EVENT_PATTERN", () => {
    it("matches a persona_shift system event", () => {
      const input = 'SYSTEM_EVENT: {"type":"persona_shift","persona":"Socratic"} end';
      const match = input.match(SYSTEM_EVENT_PATTERN);
      expect(match?.[1]).toContain('"persona_shift"');
    });
    it("does not match when tag is absent", () => {
      expect("No system event here".match(SYSTEM_EVENT_PATTERN)).toBeNull();
    });
  });

  describe("tag stripping", () => {
    it("strips EXPERTISE_LEVEL_PATTERN from content", () => {
      const content = "Great answer! USER LEVEL SET: Intermediate";
      const stripped = content.replace(EXPERTISE_LEVEL_PATTERN, "").trim();
      expect(stripped).toBe("Great answer!");
    });
    it("strips CALIBRATION_REQUEST_PATTERN from content", () => {
      const content = 'Text here CALIBRATION_REQUEST: {"topic":"Accounting"} rest';
      const stripped = content.replace(CALIBRATION_REQUEST_PATTERN, "").trim();
      expect(stripped).toBe("Text here  rest");
    });
  });
});
