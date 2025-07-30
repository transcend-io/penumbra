# Benchmark Results

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
