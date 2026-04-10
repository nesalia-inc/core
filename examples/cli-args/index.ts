/**
 * CLI Argument Parsing Example
 *
 * This example demonstrates how to use @deessejs/fp for:
 * - Parsing optional flags with Maybe
 * - Validating required arguments with Result
 * - Type-safe argument parsing
 * - Building CLI configuration
 */

import { some, none, fromNullable, ok, err, toResult } from "@deessejs/fp";

// ============================================================================
// Types
// ============================================================================

type CliConfig = {
  // Required arguments
  input: string;
  output: string;

  // Optional flags
  verbose: boolean;
  force: boolean;
  dryRun: boolean;
  config?: string;
  threads?: number;
};

type ParseError = {
  arg: string;
  message: string;
};

// ============================================================================
// Example 1: Parse optional flags with Maybe
// ============================================================================

const parseOptionalFlag = (args: string[], flag: string): boolean => {
  console.log(`  Checking flag: ${flag}`);

  return fromNullable(args.includes(flag))
    .map((present) => present)
    .getOrElse(false);
};

const parseOptionalValue = (args: string[], flag: string): Maybe<string> => {
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) {
    return none();
  }
  return some(args[index + 1]);
};

// ============================================================================
// Example 2: Parse required arguments with Result
// ============================================================================

const parseRequiredArg = (args: string[], flag: string): Result<string, ParseError> => {
  console.log(`  Parsing required: ${flag}`);

  const index = args.indexOf(flag);
  if (index === -1) {
    return err({
      arg: flag,
      message: `Missing required argument: ${flag}`,
    });
  }

  if (index === args.length - 1) {
    return err({
      arg: flag,
      message: `Missing value for argument: ${flag}`,
    });
  }

  return ok(args[index + 1]);
};

const parseRequiredInt = (args: string[], flag: string): Result<number, ParseError> => {
  return parseRequiredArg(args, flag).flatMap((value) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      return err({
        arg: flag,
        message: `Invalid number for ${flag}: ${value}`,
      });
    }
    return ok(parsed);
  });
};

// ============================================================================
// Example 3: Complete CLI parser
// ============================================================================

const parseCliArgs = (args: string[]): Result<CliConfig, ParseError> => {
  console.log("\n=== Parsing CLI Arguments ===");
  console.log(`  Raw args: ${args.join(" ")}`);

  // Parse required arguments
  const inputResult = parseRequiredArg(args, "--input");
  if (inputResult.isErr()) {
    return err(inputResult.error);
  }

  const outputResult = parseRequiredArg(args, "--output");
  if (outputResult.isErr()) {
    return err(outputResult.error);
  }

  // Parse optional flags
  const verbose = args.includes("--verbose");
  const force = args.includes("--force");
  const dryRun = args.includes("--dry-run");

  // Parse optional values
  const config = parseOptionalValue(args, "--config").toUndefined();
  const threadsResult = parseOptionalValue(args, "--threads")
    .map((value) => parseInt(value, 10))
    .toResult({
      arg: "--threads",
      message: "Invalid threads value",
    });

  if (threadsResult.isErr()) {
    return err(threadsResult.error);
  }

  return ok({
    input: inputResult.value,
    output: outputResult.value,
    verbose,
    force,
    dryRun,
    config,
    threads: threadsResult.value,
  });
}

// ============================================================================
// Example 4: Parse subcommands
// ============================================================================

type SubCommand = "build" | "test" | "deploy";

type ParsedCommand = {
  command: SubCommand;
  args: string[];
  options: Record<string, string | boolean>;
};

const parseSubCommand = (args: string[]): Result<ParsedCommand, ParseError> => {
  console.log("\n=== Parsing Subcommand ===");

  const commands: SubCommand[] = ["build", "test", "deploy"];
  const command = args[0] as SubCommand;

  if (!commands.includes(command)) {
    return err({
      arg: "command",
      message: `Unknown command: ${command}. Must be one of: ${commands.join(", ")}`,
    });
  }

  // Parse options
  const options: Record<string, string | boolean> = {};
  const remainingArgs = args.slice(1);

  for (let i = 0; i < remainingArgs.length; i++) {
    const arg = remainingArgs[i];

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const nextArg = remainingArgs[i + 1];

      if (nextArg && !nextArg.startsWith("--")) {
        options[key] = nextArg;
        i++; // Skip next arg
      } else {
        options[key] = true;
      }
    }
  }

  console.log(`  Command: ${command}`);
  console.log(`  Options:`, Object.keys(options));

  return ok({
    command,
    args: remainingArgs.filter((a) => !a.startsWith("--")),
    options,
  });
};

// ============================================================================
// Example 5: Validate conflicting flags
// ============================================================================

const parseWithValidation = (args: string[]): Result<CliConfig, ParseError> => {
  console.log("\n=== Parse with Validation ===");

  const configResult = parseCliArgs(args);
  if (configResult.isErr()) {
    return err(configResult.error);
  }

  const config = configResult.value;

  // Check for conflicting flags
  if (config.force && config.dryRun) {
    return err({
      arg: "--force/--dry-run",
      message: "Cannot use --force and --dry-run together",
    });
  }

  // Validate threads range
  if (config.threads !== undefined && (config.threads < 1 || config.threads > 16)) {
    return err({
      arg: "--threads",
      message: "Threads must be between 1 and 16",
    });
  }

  console.log("✓ Configuration validated");

  return ok(config);
};

// ============================================================================
// Example 6: Build help text
// ============================================================================

const showHelp = (parsed: Result<CliConfig, ParseError>) => {
  console.log("\n=== CLI Tool Help ===\n");

  console.log("Usage: cli-tool [options]\n");

  console.log("Required:");
  console.log("  --input <file>     Input file path");
  console.log("  --output <file>    Output file path\n");

  console.log("Optional:");
  console.log("  --verbose          Enable verbose output");
  console.log("  --force            Force overwrite");
  console.log("  --dry-run          Simulate without changes");
  console.log("  --config <file>    Config file path");
  console.log("  --threads <num>    Number of threads (1-16)\n");

  console.log("Examples:");
  console.log("  cli-tool --input in.txt --output out.txt");
  console.log("  cli-tool --input in.txt --output out.txt --verbose --threads 4");
  console.log("  cli-tool --input in.txt --output out.txt --dry-run\n");

  if (parsed.isErr()) {
    console.log(`Error: ${parsed.error.message}\n`);
    process.exit(1);
  }
};

// ============================================================================
// Run all examples
// ============================================================================

const main = () => {
  // Simulate command line arguments
  const processArgs = process.argv.slice(2);

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   CLI Argument Parsing with @deessejs/fp               ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  // Show help if no args or --help
  if (processArgs.length === 0 || processArgs.includes("--help")) {
    showHelp(err({ arg: "help", message: "" }));
    return;
  }

  // Check for subcommands
  const subcommands = ["build", "test", "deploy"];
  if (subcommands.includes(processArgs[0])) {
    const result = parseSubCommand(processArgs);
    if (result.isOk()) {
      console.log(`\n✓ Parsed command: ${result.value.command}`);
      console.log(`  Args: ${result.value.args.join(", ")}`);
      console.log(`  Options:`, result.value.options);
    } else {
      console.log(`\n✗ ${result.error.message}`);
    }
    return;
  }

  // Parse regular arguments
  const result = parseWithValidation(processArgs);

  if (result.isOk()) {
    const config = result.value;
    console.log("\n✓ Configuration:");
    console.log(`  Input: ${config.input}`);
    console.log(`  Output: ${config.output}`);
    console.log(`  Verbose: ${config.verbose}`);
    console.log(`  Force: ${config.force}`);
    console.log(`  Dry Run: ${config.dryRun}`);
    console.log(`  Config: ${config.config || "none"}`);
    console.log(`  Threads: ${config.threads || "default"}`);
  } else {
    console.log(`\n✗ Parse error: ${result.error.message}`);
    process.exit(1);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║   CLI parsing completed                                   ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
};

main();
