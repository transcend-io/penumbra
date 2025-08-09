# Benchmark

_Last benchmarked at 8.0.0 on darwin arm64 with 12 cores_

## 2 chunks of 8MiB

| Implementation                | Chromium | Webkit     | Firefox  |
| ----------------------------- | -------- | ---------- | -------- |
| `penumbra.encrypt`            | 840.39ms | 3,403.25ms | 314.25ms |
| `encrypt-web-streams.encrypt` | 830.03ms | 3,323ms    | 245.13ms |
| `crypto.subtle.encrypt`       | 213.64ms | 51.5ms     | 28.19ms  |

## 100 chunks of 64KiB

| Implementation                | Chromium | Webkit     | Firefox |
| ----------------------------- | -------- | ---------- | ------- |
| `penumbra.encrypt`            | 316.54ms | 1,352.25ms | 108.7ms |
| `encrypt-web-streams.encrypt` | 308.63ms | 1,304.38ms | 94.45ms |
| `crypto.subtle.encrypt`       | 78.68ms  | 20.02ms    | 16.35ms |

## 1000 chunks of 1KiB

| Implementation                | Chromium | Webkit   | Firefox    |
| ----------------------------- | -------- | -------- | ---------- |
| `penumbra.encrypt`            | 82.84ms  | 344.38ms | 1,001.88ms |
| `encrypt-web-streams.encrypt` | 53.45ms  | 237.5ms  | 17.12ms    |
| `crypto.subtle.encrypt`       | 26.72ms  | 27.05ms  | 35.93ms    |
