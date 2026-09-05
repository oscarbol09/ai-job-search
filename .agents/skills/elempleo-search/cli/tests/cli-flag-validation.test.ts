import { describe, test, expect } from "bun:test";
import { runCLI } from "./helpers";

function parsedStderr(stderr: string): { error?: string; code?: string } {
  try {
    return JSON.parse(stderr);
  } catch {
    return {};
  }
}

describe("Elempleo CLI flag validation (all failures short-circuit before any fetch)", () => {
  test("missing --query exits 1 with NO_QUERY", async () => {
    const result = await runCLI(["search"]);
    expect(result.exitCode).not.toBe(0);
    expect(parsedStderr(result.stderr).code).toBe("NO_QUERY");
  });

  test("non-numeric --page exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "python", "--page", "abc"]);
    expect(result.exitCode).not.toBe(0);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ARG");
    expect(err.error).toMatch(/page/);
  });

  test("fractional --page exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "python", "--page", "1.5"]);
    expect(result.exitCode).not.toBe(0);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ARG");
    expect(err.error).toMatch(/page/);
  });

  test("--page 0 exits 1 with BAD_ARG (1-indexed portal)", async () => {
    const result = await runCLI(["search", "-q", "python", "--page", "0"]);
    expect(result.exitCode).not.toBe(0);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ARG");
  });

  test("non-numeric --limit exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "python", "--limit", "xyz"]);
    expect(result.exitCode).not.toBe(0);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ARG");
    expect(err.error).toMatch(/limit/);
  });

  test("fractional --limit exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "python", "--limit", "2.5"]);
    expect(result.exitCode).not.toBe(0);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ARG");
  });

  test("negative --limit exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "python", "--limit", "-1"]);
    expect(result.exitCode).not.toBe(0);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ARG");
  });

  test("non-numeric --jobage exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "python", "--jobage", "fast"]);
    expect(result.exitCode).not.toBe(0);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ARG");
    expect(err.error).toMatch(/jobage/);
  });

  test("fractional --jobage exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "python", "--jobage", "3.5"]);
    expect(result.exitCode).not.toBe(0);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ARG");
  });

  test("invalid --format exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "python", "--format", "yaml"]);
    expect(result.exitCode).not.toBe(0);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ARG");
  });

  test("unknown double-dash flag exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "python", "--bogus"]);
    expect(result.exitCode).not.toBe(0);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ARG");
    expect(err.error).toMatch(/bogus/);
  });

  test("unknown single-dash flag exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "python", "-x"]);
    expect(result.exitCode).not.toBe(0);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ARG");
    expect(err.error).toMatch(/x/);
  });

  test("detail without a url exits 1 with NO_ID", async () => {
    const result = await runCLI(["detail"]);
    expect(result.exitCode).not.toBe(0);
    expect(parsedStderr(result.stderr).code).toBe("NO_ID");
  });

  test("detail with bare numeric id exits 1 with BAD_ID (slug required)", async () => {
    const result = await runCLI(["detail", "1886762593"]);
    expect(result.exitCode).not.toBe(0);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ID");
    expect(err.error).toMatch(/slug/);
  });

  test("unknown command exits 1 with BAD_CMD", async () => {
    const result = await runCLI(["frobnicate"]);
    expect(result.exitCode).not.toBe(0);
    expect(parsedStderr(result.stderr).code).toBe("BAD_CMD");
  });
});
