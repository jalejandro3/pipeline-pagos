import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// CI provides the variables directly; locally they come from the root .env.
// process.loadEnvFile would write to the real process.env, not to the copy
// Jest gives each test file, so the parsed values are assigned explicitly.
if (existsSync('.env')) {
  const variables = parseEnv(readFileSync('.env', 'utf8'));

  for (const [key, value] of Object.entries(variables)) {
    process.env[key] ??= value;
  }
}
