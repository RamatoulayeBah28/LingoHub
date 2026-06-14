import { validatePasswordChange } from "./Profile";

describe("validatePasswordChange", () => {
  it("returns an error when passwords do not match", () => {
    const result = validatePasswordChange("abc123", "xyz999");
    expect(result).toBe("Passwords are not matching!");
  });

  it("returns an error when password is too short", () => {
    const result = validatePasswordChange("ab123", "ab123");
    expect(result).toBe("Password must be 6 characters long!");
  });
  it("returns null when valid passwords", () => {
    const result = validatePasswordChange("abc123", "abc123");
    expect(result).toBe(null);
  });
});
