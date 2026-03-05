import type { LocalFileItem, PolicyDecision, PolicyDecisionType } from './types';

interface Rule {
  pattern: RegExp;
  decision: PolicyDecisionType;
  reason: string;
  riskScore: number;
}

// Patterns are matched against the file path (relative) or name
const RULES: Rule[] = [
  // DENY — private keys / credentials
  { pattern: /\.(pem|key|p12|pfx|crt|cer|der)$/i, decision: 'DENY', reason: 'Certificate or private key file', riskScore: 100 },
  { pattern: /^(id_rsa|id_ed25519|id_ecdsa|id_dsa)(\.pub)?$/, decision: 'DENY', reason: 'SSH private key file', riskScore: 100 },
  { pattern: /(^|\/)known_hosts$/, decision: 'DENY', reason: 'SSH known_hosts file', riskScore: 90 },
  { pattern: /(^|\/)authorized_keys$/, decision: 'DENY', reason: 'SSH authorized_keys file', riskScore: 90 },
  { pattern: /private[_-]?key/i, decision: 'DENY', reason: 'Filename contains "private_key"', riskScore: 100 },
  { pattern: /\.keystore$|\.jks$/i, decision: 'DENY', reason: 'Java keystore file', riskScore: 95 },

  // WARN — potentially sensitive / noisy
  { pattern: /(^|\/)\.env(\.|$)/, decision: 'WARN', reason: '.env file may contain secrets', riskScore: 70 },
  { pattern: /(^|\/)\.env$/, decision: 'WARN', reason: '.env file may contain secrets', riskScore: 70 },
  { pattern: /(^|\/)node_modules\//, decision: 'WARN', reason: 'node_modules is usually large and not needed on server', riskScore: 40 },
  { pattern: /(^|\/)\.(venv|venv)\//, decision: 'WARN', reason: 'Python virtual environment', riskScore: 40 },
  { pattern: /(^|\/)venv\//, decision: 'WARN', reason: 'Python virtual environment', riskScore: 40 },
  { pattern: /(^|\/)__pycache__\//, decision: 'WARN', reason: 'Python cache directory', riskScore: 20 },
  { pattern: /\.log$/, decision: 'WARN', reason: 'Log files can be large', riskScore: 25 },
  { pattern: /(^|\/)(dist|build)\//, decision: 'WARN', reason: 'Build output directory — consider building on server', riskScore: 30 },
  { pattern: /(^|\/)\.DS_Store$/, decision: 'WARN', reason: 'macOS metadata file', riskScore: 10 },
  { pattern: /Thumbs\.db$/i, decision: 'WARN', reason: 'Windows thumbnail cache', riskScore: 10 },
  { pattern: /(^|\/)\.git\//, decision: 'WARN', reason: '.git directory contains full history', riskScore: 35 },
  { pattern: /\.sqlite$|\.db$/i, decision: 'WARN', reason: 'Database file may contain sensitive data', riskScore: 60 },
];

export function analyzeFiles(files: LocalFileItem[]): PolicyDecision[] {
  return files.map((file) => {
    const testPath = file.path.startsWith('/') ? file.path.slice(1) : file.path;

    for (const rule of RULES) {
      if (rule.pattern.test(testPath) || rule.pattern.test(file.name)) {
        return {
          file,
          decision: rule.decision,
          reason: rule.reason,
          riskScore: rule.riskScore,
          excluded: rule.decision === 'DENY',
        };
      }
    }

    return {
      file,
      decision: 'ALLOW',
      reason: 'No policy violations',
      riskScore: 0,
      excluded: false,
    };
  });
}

export function totalUploadSize(decisions: PolicyDecision[]): number {
  return decisions
    .filter((d) => !d.excluded)
    .reduce((sum, d) => sum + (d.file.rawFile?.size ?? d.file.size), 0);
}
