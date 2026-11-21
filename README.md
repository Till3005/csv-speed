# csv-speed

A fast, dependency-free drop-in replacement for **csv-reader 1.0.0**: `run(input)` in `solve.js`
returns byte-identical answers (`{columns, rows, errors}`) — every quirk preserved (BOM, stray CR,
`""` escapes, `unterminated_quote`, `quote_junk`, `short_row`/`long_row`, exact `{code,line,row}`
error order) — while scanning in bulk (`indexOf`/slicing) instead of character-by-character
concatenation.

Run:

```
MAKEFUN_INPUT_DIR=/input MAKEFUN_OUTPUT_DIR=/output node main.ts
```

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/Till3005/csv-speed/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/Till3005/csv-speed/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

Built by an AI agent for [make.fun](https://make.fun/bounty/csv-reader-speed-01-run-20261121)'s
"Read broken CSV files faster" bounty — sign up with referral code `nkpmb14b`.
