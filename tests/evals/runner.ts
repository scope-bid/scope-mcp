#!/usr/bin/env tsx
/**
 * Five-case MCP eval harness.
 *
 * Default mode (no flag): replays pre-baked mock tool calls + response
 * from tests/evals/mocks/<fixture>.json and asserts. Deterministic, no
 * network, no API key required. This is what CI runs.
 *
 * --live mode: calls the live Anthropic API with MCP tools attached and
 * the matter context injected as the user message. Requires
 * ANTHROPIC_API_KEY in env. Non-deterministic by nature.
 *
 * Exit 0 on all pass, 1 on any fail. Writes
 * tests/evals/eval-results.json with structured per-fixture results.
 *
 * Voice canon: ASCII hyphens only.
 */

import * as fs from "node:fs";
import * as path from "node:path";

type ExpectedToolCall = {
  tool: string;
  must_precede?: string[];
  min_quotes_in_result?: number;
  result_must_contain?: string;
  args_must_contain?: Record<string, unknown>;
  result_quotes_count?: number;
};

type Fixture = {
  name: string;
  input: {
    user_message: string;
    matter_context?: Record<string, unknown>;
    prior_dispatch_result?: Record<string, unknown>;
    mocked_tool_response?: Record<string, unknown>;
  };
  expected_tool_calls?: ExpectedToolCall[];
  forbidden_tool_calls?: string[];
  response_must_open_with_field?: string;
  response_must_close_with_field?: string;
  response_must_contain?: string[];
  response_must_contain_all?: string[];
  response_must_contain_one_of?: string[];
  response_must_not_contain?: string[];
  forbidden_fabrications?: string;
};

type RecordedCall = {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
};

type RunResult = {
  tool_calls: RecordedCall[];
  response_text: string;
};

const ROOT = path.resolve(__dirname);
const FIXTURE_DIR = path.join(ROOT, "fixtures");
const MOCK_DIR = path.join(ROOT, "mocks");
const RESULTS_PATH = path.join(ROOT, "eval-results.json");

const LIVE = process.argv.includes("--live");

function loadFixtures(): Fixture[] {
  return fs
    .readdirSync(FIXTURE_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const raw = fs.readFileSync(path.join(FIXTURE_DIR, f), "utf-8");
      return JSON.parse(raw) as Fixture;
    });
}

function loadMock(fixtureName: string): RunResult {
  const filename = fs
    .readdirSync(MOCK_DIR)
    .find((f) => f.includes(fixtureName));
  if (!filename) {
    throw new Error(`No mock file found for fixture ${fixtureName}`);
  }
  const raw = fs.readFileSync(path.join(MOCK_DIR, filename), "utf-8");
  return JSON.parse(raw) as RunResult;
}

async function runLive(_fixture: Fixture): Promise<RunResult> {
  // Live mode: call Anthropic API with MCP tools attached and the
  // mocked tool response (or the live MCP gateway if no inline mock).
  // Implementation deferred to a follow-up - the default mock-based
  // harness is the CI surface that catches regressions today.
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY required for --live mode.");
  }
  throw new Error(
    "--live mode is a stub. Wire @anthropic-ai/sdk with the appropriate MCP tool bindings before enabling.",
  );
}

type AssertionFailure = { fixture: string; check: string; detail: string };

function checkExpectedToolCalls(
  fixture: Fixture,
  result: RunResult,
  failures: AssertionFailure[],
) {
  const expected = fixture.expected_tool_calls ?? [];
  const calledNames = result.tool_calls.map((c) => c.tool);
  for (const exp of expected) {
    const idx = calledNames.indexOf(exp.tool);
    if (idx === -1) {
      failures.push({
        fixture: fixture.name,
        check: "expected_tool_calls",
        detail: `expected tool ${exp.tool} was never called`,
      });
      continue;
    }
    if (exp.must_precede) {
      for (const after of exp.must_precede) {
        const afterIdx = calledNames.indexOf(after);
        if (afterIdx !== -1 && afterIdx < idx) {
          failures.push({
            fixture: fixture.name,
            check: "must_precede",
            detail: `${exp.tool} must precede ${after} but came after`,
          });
        }
      }
    }
    if (exp.min_quotes_in_result !== undefined) {
      const call = result.tool_calls[idx];
      const quoted = (call.result as { vendors_quoted?: unknown[] })
        .vendors_quoted;
      const count = Array.isArray(quoted) ? quoted.length : 0;
      if (count < exp.min_quotes_in_result) {
        failures.push({
          fixture: fixture.name,
          check: "min_quotes_in_result",
          detail: `${exp.tool} returned ${count} quotes, expected at least ${exp.min_quotes_in_result}`,
        });
      }
    }
    if (exp.result_must_contain) {
      const call = result.tool_calls[idx];
      const serialized = JSON.stringify(call.result);
      if (!serialized.includes(exp.result_must_contain.replace(/\s+/g, ""))) {
        // looser check on key:value substring
        const looseTarget = exp.result_must_contain.replace(/\s/g, "");
        const looseSerialized = serialized.replace(/\s/g, "");
        if (!looseSerialized.includes(looseTarget)) {
          failures.push({
            fixture: fixture.name,
            check: "result_must_contain",
            detail: `${exp.tool} result missing "${exp.result_must_contain}"`,
          });
        }
      }
    }
    if (exp.args_must_contain) {
      const call = result.tool_calls[idx];
      for (const [k, v] of Object.entries(exp.args_must_contain)) {
        if (
          JSON.stringify(call.args[k]) !== JSON.stringify(v)
        ) {
          failures.push({
            fixture: fixture.name,
            check: "args_must_contain",
            detail: `${exp.tool} arg ${k} was ${JSON.stringify(call.args[k])}, expected ${JSON.stringify(v)}`,
          });
        }
      }
    }
    if (exp.result_quotes_count !== undefined) {
      const call = result.tool_calls[idx];
      const quoted = (call.result as { vendors_quoted?: unknown[] })
        .vendors_quoted;
      const count = Array.isArray(quoted) ? quoted.length : 0;
      if (count !== exp.result_quotes_count) {
        failures.push({
          fixture: fixture.name,
          check: "result_quotes_count",
          detail: `${exp.tool} returned ${count} quotes, expected exactly ${exp.result_quotes_count}`,
        });
      }
    }
  }
}

function checkForbiddenToolCalls(
  fixture: Fixture,
  result: RunResult,
  failures: AssertionFailure[],
) {
  const forbidden = fixture.forbidden_tool_calls ?? [];
  const calledNames = result.tool_calls.map((c) => c.tool);
  for (const name of forbidden) {
    if (calledNames.includes(name)) {
      failures.push({
        fixture: fixture.name,
        check: "forbidden_tool_calls",
        detail: `forbidden tool ${name} was called`,
      });
    }
  }
}

function checkOpenCloseFields(
  fixture: Fixture,
  result: RunResult,
  failures: AssertionFailure[],
) {
  if (fixture.response_must_open_with_field) {
    const fieldName = fixture.response_must_open_with_field;
    const candidate = result.tool_calls
      .map((c) => (c.result as Record<string, unknown>)[fieldName])
      .find((v) => typeof v === "string") as string | undefined;
    if (!candidate) {
      failures.push({
        fixture: fixture.name,
        check: "response_must_open_with_field",
        detail: `no tool result exposed field ${fieldName}`,
      });
    } else if (!result.response_text.trimStart().startsWith(candidate)) {
      failures.push({
        fixture: fixture.name,
        check: "response_must_open_with_field",
        detail: `response did not open with ${fieldName} value "${candidate}"`,
      });
    }
  }
  if (fixture.response_must_close_with_field) {
    const fieldName = fixture.response_must_close_with_field;
    const candidate = result.tool_calls
      .map((c) => (c.result as Record<string, unknown>)[fieldName])
      .find((v) => typeof v === "string") as string | undefined;
    if (!candidate) {
      failures.push({
        fixture: fixture.name,
        check: "response_must_close_with_field",
        detail: `no tool result exposed field ${fieldName}`,
      });
    } else if (!result.response_text.trimEnd().endsWith(candidate)) {
      failures.push({
        fixture: fixture.name,
        check: "response_must_close_with_field",
        detail: `response did not close with ${fieldName} value "${candidate}"`,
      });
    }
  }
}

function checkContains(
  fixture: Fixture,
  result: RunResult,
  failures: AssertionFailure[],
) {
  const text = result.response_text;
  if (fixture.response_must_contain) {
    for (const needle of fixture.response_must_contain) {
      if (!text.includes(needle)) {
        failures.push({
          fixture: fixture.name,
          check: "response_must_contain",
          detail: `missing required substring "${needle}"`,
        });
      }
    }
  }
  if (fixture.response_must_contain_all) {
    for (const needle of fixture.response_must_contain_all) {
      if (!text.includes(needle)) {
        failures.push({
          fixture: fixture.name,
          check: "response_must_contain_all",
          detail: `missing required substring "${needle}"`,
        });
      }
    }
  }
  if (fixture.response_must_contain_one_of) {
    const any = fixture.response_must_contain_one_of.some((n) =>
      text.includes(n),
    );
    if (!any) {
      failures.push({
        fixture: fixture.name,
        check: "response_must_contain_one_of",
        detail: `none of [${fixture.response_must_contain_one_of.join(", ")}] found`,
      });
    }
  }
  if (fixture.response_must_not_contain) {
    for (const needle of fixture.response_must_not_contain) {
      if (text.toLowerCase().includes(needle.toLowerCase())) {
        failures.push({
          fixture: fixture.name,
          check: "response_must_not_contain",
          detail: `forbidden substring "${needle}" found in response`,
        });
      }
    }
  }
}

function checkFabrication(
  fixture: Fixture,
  result: RunResult,
  failures: AssertionFailure[],
) {
  if (fixture.forbidden_fabrications !== "vendor_names_not_in_tool_output") {
    return;
  }
  // Build the set of vendor names that DID appear in tool output.
  const allowedNames = new Set<string>();
  for (const call of result.tool_calls) {
    const quoted = (call.result as { vendors_quoted?: { name?: string }[] })
      .vendors_quoted;
    if (Array.isArray(quoted)) {
      for (const v of quoted) {
        if (v?.name) allowedNames.add(v.name);
      }
    }
  }
  // Heuristic vendor-name shape: 2-5 Capitalized words, optionally
  // ending in "Inc", "LLC", "Reporting", "Legal", "Services", etc.
  const candidateRegex =
    /\b(?:[A-Z][a-z]+(?:[\s-][A-Z][a-z]+){1,4})(?:\s(?:Inc|LLC|Corp|Reporting|Legal|Services|Group|Network|Partners))?\b/g;
  const knownPhrases = new Set([
    "Cedars-Sinai Medical Center",
    "Cedars-Sinai",
    "Sarah Chen",
    "Acme Logistics LLC",
    "Excluded Defendant Corp",
    "Vendor A",
    "Vendor B",
    "Vendor C",
    "Mendez",
    "Reyes",
    "Oakland",
    "Cheyenne",
    "Wyoming",
    "Dispatching Scope",
  ]);
  const found = new Set<string>();
  for (const m of result.response_text.matchAll(candidateRegex)) {
    found.add(m[0]);
  }
  for (const candidate of found) {
    // Skip allowed vendor names (came from tool output)
    if (allowedNames.has(candidate)) continue;
    // Skip known matter-context strings
    if (knownPhrases.has(candidate)) continue;
    // Skip generic capitalized words that aren't vendor-shaped
    if (!/Reporting|Legal|Services|Group|Network|Partners|Inc|LLC|Corp/.test(candidate)) {
      continue;
    }
    failures.push({
      fixture: fixture.name,
      check: "forbidden_fabrications",
      detail: `possible fabricated vendor name "${candidate}" not present in tool output`,
    });
  }
}

async function runFixture(fixture: Fixture): Promise<AssertionFailure[]> {
  const failures: AssertionFailure[] = [];
  let result: RunResult;
  try {
    result = LIVE ? await runLive(fixture) : loadMock(fixture.name);
  } catch (err) {
    failures.push({
      fixture: fixture.name,
      check: "harness",
      detail: `error loading result: ${(err as Error).message}`,
    });
    return failures;
  }
  checkExpectedToolCalls(fixture, result, failures);
  checkForbiddenToolCalls(fixture, result, failures);
  checkOpenCloseFields(fixture, result, failures);
  checkContains(fixture, result, failures);
  checkFabrication(fixture, result, failures);
  return failures;
}

async function main() {
  const fixtures = loadFixtures();
  console.log(
    `Running ${fixtures.length} eval fixtures in ${LIVE ? "LIVE" : "MOCK"} mode\n`,
  );

  const summary: {
    fixture: string;
    passed: boolean;
    failures: AssertionFailure[];
  }[] = [];

  for (const fixture of fixtures) {
    const failures = await runFixture(fixture);
    const passed = failures.length === 0;
    summary.push({ fixture: fixture.name, passed, failures });
    if (passed) {
      console.log(`PASS  ${fixture.name}`);
    } else {
      console.log(`FAIL  ${fixture.name}`);
      for (const f of failures) {
        console.log(`        - [${f.check}] ${f.detail}`);
      }
    }
  }

  fs.writeFileSync(
    RESULTS_PATH,
    JSON.stringify(
      {
        mode: LIVE ? "live" : "mock",
        ran_at: new Date().toISOString(),
        total: summary.length,
        passed: summary.filter((s) => s.passed).length,
        failed: summary.filter((s) => !s.passed).length,
        results: summary,
      },
      null,
      2,
    ),
  );

  const failed = summary.filter((s) => !s.passed).length;
  console.log(
    `\n${summary.length - failed}/${summary.length} passed. Results: ${RESULTS_PATH}`,
  );
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("runner crashed:", err);
  process.exit(1);
});
