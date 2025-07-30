# Benchmark Results

🚧 Browser logs on Chromium:

```js
[
  {
    'Task name': 'aes_gcm_stream_wasm',
    'Latency avg (ns)': '86281 ± 7.70%',
    'Latency med (ns)': '1.0000e+5 ± 0.00',
    'Throughput avg (ops/s)': '9942 ± 1.01%',
    'Throughput med (ops/s)': '10000 ± 0',
    Samples: 1159,
  },
  {
    'Task name':
      'crypto.subtle (cannot stream; use separately encrypted chunks)',
    'Latency avg (ns)': '38235 ± 15.22%',
    'Latency med (ns)': '0.00 ± 0.00',
    'Throughput avg (ops/s)': '20730 ± 1.42%',
    'Throughput med (ops/s)': '26154 ± 0',
    Samples: 2618,
  },
  {
    'Task name': 'penumbra',
    'Latency avg (ns)': '657895 ± 33.29%',
    'Latency med (ns)': '400000 ± 1.0000e+5',
    'Throughput avg (ops/s)': '2206 ± 4.20%',
    'Throughput med (ops/s)': '2500 ± 500',
    Samples: 152,
  },
];
```

🚧 Browser logs on Firefox:

```js
[
  {
    'Task name': 'aes_gcm_stream_wasm',
    'Latency avg (ns)': '625000 ± 14.76%',
    'Latency med (ns)': '1000000 ± 0.00',
    'Throughput avg (ops/s)': '1233 ± 4.06%',
    'Throughput med (ops/s)': '1000 ± 0',
    Samples: 160,
  },
  {
    'Task name':
      'crypto.subtle (cannot stream; use separately encrypted chunks)',
    'Latency avg (ns)': '51020 ± 20.27%',
    'Latency med (ns)': '0.00 ± 0.00',
    'Throughput avg (ops/s)': '18679 ± 0.96%',
    'Throughput med (ops/s)': '19600 ± 0',
    Samples: 1960,
  },
  {
    'Task name': 'penumbra',
    'Latency avg (ns)': '1265823 ± 11.23%',
    'Latency med (ns)': '1000000 ± 0.00',
    'Throughput avg (ops/s)': '822 ± 6.47%',
    'Throughput med (ops/s)': '1000 ± 0',
    Samples: 79,
  },
];
```

🚧 Browser logs on Webkit:

```js
[
  {
    'Task name': 'aes_gcm_stream_wasm',
    'Latency avg (ns)': '53879 ± 19.67%',
    'Latency med (ns)': '0.00 ± 0.00',
    'Throughput avg (ops/s)': '17632 ± 1.01%',
    'Throughput med (ops/s)': '18560 ± 0',
    Samples: 1856,
  },
  {
    'Task name':
      'crypto.subtle (cannot stream; use separately encrypted chunks)',
    'Latency avg (ns)': '61774 ± 20.06%',
    'Latency med (ns)': '0.00 ± 0.00',
    'Throughput avg (ops/s)': '15286 ± 1.14%',
    'Throughput med (ops/s)': '16188 ± 0',
    Samples: 1635,
  },
  {
    'Task name': 'penumbra',
    'Latency avg (ns)': '19453125 ± 7.40%',
    'Latency med (ns)': '20000000 ± 4000000',
    'Throughput avg (ops/s)': '59 ± 13.22%',
    'Throughput med (ops/s)': '50 ± 8',
    Samples: 64,
  },
];
```
