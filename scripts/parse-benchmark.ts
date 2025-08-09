#!/usr/bin/env -S pnpm tsx

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
  version: string;
};

// Pasted from each browser log emitted in the shell after running `pnpm run benchmark`
const lastBenchmarkVersion = packageJson.version.replace(/-alpha\.\d+$/, '');
const benchmarkOutput = {
  Chromium: {
    '2 chunks of 8MiB': [
      {
        'Task name': 'penumbra.encrypt',
        'Latency avg (ns)': '840387500 ± 1.27%',
        'Latency med (ns)': '837500000 ± 3500000',
        'Throughput avg (ops/s)': '1 ± 1.25%',
        'Throughput med (ops/s)': '1 ± 0',
        Samples: 8,
      },
      {
        'Task name': 'encrypt-web-streams.encrypt',
        'Latency avg (ns)': '830025000 ± 1.21%',
        'Latency med (ns)': '827600000 ± 7750000',
        'Throughput avg (ops/s)': '1 ± 1.20%',
        'Throughput med (ops/s)': '1 ± 0',
        Samples: 8,
      },
      {
        'Task name': 'crypto.subtle.encrypt',
        'Latency avg (ns)': '213637500 ± 0.41%',
        'Latency med (ns)': '213750000 ± 650000',
        'Throughput avg (ops/s)': '5 ± 0.41%',
        'Throughput med (ops/s)': '5 ± 0',
        Samples: 8,
      },
    ],
    '100 chunks of 64KiB': [
      {
        'Task name': 'penumbra.encrypt',
        'Latency avg (ns)': '316537500 ± 1.70%',
        'Latency med (ns)': '316100000 ± 4600000',
        'Throughput avg (ops/s)': '3 ± 1.69%',
        'Throughput med (ops/s)': '3 ± 0',
        Samples: 8,
      },
      {
        'Task name': 'encrypt-web-streams.encrypt',
        'Latency avg (ns)': '308625000 ± 1.02%',
        'Latency med (ns)': '307050000 ± 1600000',
        'Throughput avg (ops/s)': '3 ± 1.00%',
        'Throughput med (ops/s)': '3 ± 0',
        Samples: 8,
      },
      {
        'Task name': 'crypto.subtle.encrypt',
        'Latency avg (ns)': '78684615 ± 1.01%',
        'Latency med (ns)': '78200000 ± 300000',
        'Throughput avg (ops/s)': '13 ± 1.00%',
        'Throughput med (ops/s)': '13 ± 0',
        Samples: 13,
      },
    ],
    '1000 chunks of 1KiB': [
      {
        'Task name': 'penumbra.encrypt',
        'Latency avg (ns)': '82838462 ± 2.70%',
        'Latency med (ns)': '82400000 ± 2400000',
        'Throughput avg (ops/s)': '12 ± 2.61%',
        'Throughput med (ops/s)': '12 ± 0',
        Samples: 13,
      },
      {
        'Task name': 'encrypt-web-streams.encrypt',
        'Latency avg (ns)': '53452632 ± 1.62%',
        'Latency med (ns)': '52600000 ± 900000',
        'Throughput avg (ops/s)': '19 ± 1.57%',
        'Throughput med (ops/s)': '19 ± 0',
        Samples: 19,
      },
      {
        'Task name': 'crypto.subtle.encrypt',
        'Latency avg (ns)': '26715789 ± 3.57%',
        'Latency med (ns)': '25300000 ± 550000',
        'Throughput avg (ops/s)': '38 ± 3.14%',
        'Throughput med (ops/s)': '40 ± 1',
        Samples: 38,
      },
    ],
  },
  Firefox: {
    '2 chunks of 8MiB': [
      {
        'Task name': 'penumbra.encrypt',
        'Latency avg (ns)': '3403250000 ± 3.14%',
        'Latency med (ns)': '3345000000 ± 32500000',
        'Throughput avg (ops/s)': '0 ± 3.02%',
        'Throughput med (ops/s)': '0 ± 0',
        Samples: 8,
      },
      {
        'Task name': 'encrypt-web-streams.encrypt',
        'Latency avg (ns)': '3323000000 ± 1.62%',
        'Latency med (ns)': '3296000000 ± 14500000',
        'Throughput avg (ops/s)': '0 ± 1.59%',
        'Throughput med (ops/s)': '0 ± 0',
        Samples: 8,
      },
      {
        'Task name': 'crypto.subtle.encrypt',
        'Latency avg (ns)': '51500000 ± 1.99%',
        'Latency med (ns)': '52000000 ± 1000000',
        'Throughput avg (ops/s)': '19 ± 2.04%',
        'Throughput med (ops/s)': '19 ± 0',
        Samples: 20,
      },
    ],
    '100 chunks of 64KiB': [
      {
        'Task name': 'penumbra.encrypt',
        'Latency avg (ns)': '1352250000 ± 3.11%',
        'Latency med (ns)': '1330000000 ± 11000000',
        'Throughput avg (ops/s)': '1 ± 3.00%',
        'Throughput med (ops/s)': '1 ± 0',
        Samples: 8,
      },
      {
        'Task name': 'encrypt-web-streams.encrypt',
        'Latency avg (ns)': '1304375000 ± 1.59%',
        'Latency med (ns)': '1297000000 ± 10500000',
        'Throughput avg (ops/s)': '1 ± 1.56%',
        'Throughput med (ops/s)': '1 ± 0',
        Samples: 8,
      },
      {
        'Task name': 'crypto.subtle.encrypt',
        'Latency avg (ns)': '20020000 ± 2.44%',
        'Latency med (ns)': '20000000 ± 1000000',
        'Throughput avg (ops/s)': '50 ± 2.48%',
        'Throughput med (ops/s)': '50 ± 3',
        Samples: 50,
      },
    ],
    '1000 chunks of 1KiB': [
      {
        'Task name': 'penumbra.encrypt',
        'Latency avg (ns)': '344375000 ± 3.65%',
        'Latency med (ns)': '336500000 ± 2500000',
        'Throughput avg (ops/s)': '3 ± 3.48%',
        'Throughput med (ops/s)': '3 ± 0',
        Samples: 8,
      },
      {
        'Task name': 'encrypt-web-streams.encrypt',
        'Latency avg (ns)': '237500000 ± 10.45%',
        'Latency med (ns)': '225500000 ± 2500000',
        'Throughput avg (ops/s)': '4 ± 8.38%',
        'Throughput med (ops/s)': '4 ± 0',
        Samples: 8,
      },
      {
        'Task name': 'crypto.subtle.encrypt',
        'Latency avg (ns)': '27054054 ± 44.15%',
        'Latency med (ns)': '18000000 ± 1000000',
        'Throughput avg (ops/s)': '51 ± 8.22%',
        'Throughput med (ops/s)': '56 ± 3',
        Samples: 37,
      },
    ],
  },
  Webkit: {
    '2 chunks of 8MiB': [
      {
        'Task name': 'penumbra.encrypt',
        'Latency avg (ns)': '314250000 ± 5.41%',
        'Latency med (ns)': '309500000 ± 7000000',
        'Throughput avg (ops/s)': '3 ± 5.12%',
        'Throughput med (ops/s)': '3 ± 0',
        Samples: 8,
      },
      {
        'Task name': 'encrypt-web-streams.encrypt',
        'Latency avg (ns)': '245125000 ± 1.05%',
        'Latency med (ns)': '244000000 ± 1000000',
        'Throughput avg (ops/s)': '4 ± 1.04%',
        'Throughput med (ops/s)': '4 ± 0',
        Samples: 8,
      },
      {
        'Task name': 'crypto.subtle.encrypt',
        'Latency avg (ns)': '28194444 ± 2.12%',
        'Latency med (ns)': '28000000 ± 1000000',
        'Throughput avg (ops/s)': '36 ± 1.96%',
        'Throughput med (ops/s)': '36 ± 1',
        Samples: 36,
      },
    ],
    '100 chunks of 64KiB': [
      {
        'Task name': 'penumbra.encrypt',
        'Latency avg (ns)': '108700000 ± 5.06%',
        'Latency med (ns)': '108000000 ± 3500000',
        'Throughput avg (ops/s)': '9 ± 4.82%',
        'Throughput med (ops/s)': '9 ± 0',
        Samples: 10,
      },
      {
        'Task name': 'encrypt-web-streams.encrypt',
        'Latency avg (ns)': '94454545 ± 0.74%',
        'Latency med (ns)': '94000000 ± 0.00',
        'Throughput avg (ops/s)': '11 ± 0.73%',
        'Throughput med (ops/s)': '11 ± 0',
        Samples: 11,
      },
      {
        'Task name': 'crypto.subtle.encrypt',
        'Latency avg (ns)': '16354839 ± 4.37%',
        'Latency med (ns)': '16000000 ± 1000000',
        'Throughput avg (ops/s)': '62 ± 3.29%',
        'Throughput med (ops/s)': '63 ± 4',
        Samples: 62,
      },
    ],
    '1000 chunks of 1KiB': [
      {
        'Task name': 'penumbra.encrypt',
        'Latency avg (ns)': '1001875000 ± 19.29%',
        'Latency med (ns)': '907500000 ± 28000000',
        'Throughput avg (ops/s)': '1 ± 13.75%',
        'Throughput med (ops/s)': '1 ± 0',
        Samples: 8,
      },
      {
        'Task name': 'encrypt-web-streams.encrypt',
        'Latency avg (ns)': '17118644 ± 0.94%',
        'Latency med (ns)': '17000000 ± 0.00',
        'Throughput avg (ops/s)': '58 ± 0.93%',
        'Throughput med (ops/s)': '59 ± 0',
        Samples: 59,
      },
      {
        'Task name': 'crypto.subtle.encrypt',
        'Latency avg (ns)': '35928571 ± 12.22%',
        'Latency med (ns)': '33500000 ± 1500000',
        'Throughput avg (ops/s)': '29 ± 7.08%',
        'Throughput med (ops/s)': '30 ± 1',
        Samples: 28,
      },
    ],
  },
} as const;

const tables: Record<
  keyof (typeof benchmarkOutput)[keyof typeof benchmarkOutput],
  [
    ['Implementation', ...(keyof typeof benchmarkOutput)[]],
    ...(string | number | null)[][],
  ]
> = {
  '2 chunks of 8MiB': [['Implementation', 'Chromium', 'Webkit', 'Firefox']],
  '100 chunks of 64KiB': [['Implementation', 'Chromium', 'Webkit', 'Firefox']],
  '1000 chunks of 1KiB': [['Implementation', 'Chromium', 'Webkit', 'Firefox']],
};

// Reformat data to `tables` format
let browserIndex = 0;
for (const browser of Object.keys(
  benchmarkOutput,
) as (keyof typeof benchmarkOutput)[]) {
  browserIndex++;
  for (const task of Object.keys(
    benchmarkOutput[browser],
  ) as (keyof (typeof benchmarkOutput)[typeof browser])[]) {
    let taskIndex = 1;
    for (const result of benchmarkOutput[browser][task]) {
      const latencyAvgNs = Number.parseInt(
        result['Latency avg (ns)'].split('±')[0]?.trim() ?? '',
      );
      const latencyAvgMs = latencyAvgNs / 1_000_000;

      if (tables[task][taskIndex] === undefined) {
        tables[task].push([result['Task name'], null, null, null]);
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      tables[task][taskIndex]![browserIndex] = latencyAvgMs;

      taskIndex++;
    }
    taskIndex = 0;
  }
}

// fs.writeFileSync('benchmark.json', JSON.stringify(tables, null, 2));
// console.log('Wrote ./benchmark.json');

// Write to markdown
let markdown = `# Benchmark\n\n`;
markdown += `_Last benchmarked at ${lastBenchmarkVersion} on ${os.platform()} ${os.arch()} with ${os.cpus().length.toString()} cores_\n\n`;

for (const task of Object.keys(tables) as (keyof typeof tables)[]) {
  markdown += `## ${task}\n\n`;

  const header = tables[task][0];
  markdown += `| ${header.join(' | ')} |\n`;
  markdown += `| --- | --- | --- | --- |\n`;
  for (const row of tables[task].slice(1)) {
    markdown += `| ${row
      .map((cell, index) =>
        index === 0
          ? `\`${String(cell)}\``
          : (cell as number).toLocaleString(undefined, {
              style: 'unit',
              maximumFractionDigits: 2,
              unit: 'millisecond',
              unitDisplay: 'narrow',
            }),
      )
      .join(' | ')} |\n`;
  }
  markdown += '\n';
}

fs.writeFileSync('benchmark.md', markdown);
execSync('pnpm prettier --write benchmark.md');
console.log('Wrote ./benchmark.md');
