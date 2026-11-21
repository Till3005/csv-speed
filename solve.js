// csv-reader 1.0.0 drop-in: byte-identical {columns, rows, errors} for every input.
// Strategy: no per-character scanning of the bulk text. Fields end at ',', LF, CRLF
// or EOF, found with native indexOf(','). Line-break positions are kept as scalars
// (nextLF / nextCR: first LF/CR at or after pos, or n when none), lazily recomputed
// with indexOf when consumed — total scan work stays one text pass per break kind.

export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const n = text.length;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;

  let pos = n > 0 && text.charCodeAt(0) === 0xfeff ? 1 : 0;
  let line = 1;
  let recordLine = 1;
  let recordRow = null;
  // first line break at or after pos; -1 = unknown, n = none
  let nextLF = -1;
  let nextCR = -1;

  while (true) {
    // lines with no characters are no records
    for (;;) {
      if (pos >= n) break;
      if (nextLF < pos) {
        const f = text.indexOf('\n', pos);
        nextLF = f === -1 ? n : f;
      }
      if (nextLF === pos) {
        pos++;
        line++;
        continue;
      }
      if (nextCR < pos) {
        const f = text.indexOf('\r', pos);
        nextCR = f === -1 ? n : f;
      }
      if (nextCR === pos && text.charCodeAt(pos + 1) === 10) {
        pos += 2;
        line++;
        nextLF = -1;
        nextCR = -1;
        continue;
      }
      break;
    }
    if (pos >= n) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let quoted = false;
    let ended;

    for (;;) {
      quoted = text.charCodeAt(pos) === 34;
      let value = '';
      let junk = false;
      ended = -1;

      if (quoted) {
        const open = pos;
        const openLine = line;
        let seg = pos + 1;
        let q = text.indexOf('"', seg);
        while (q !== -1 && text.charCodeAt(q + 1) === 34) {
          // doubled quote: segment [seg, q), then one literal quote
          if (nextCR < seg) {
            const f = text.indexOf('\r', seg);
            nextCR = f === -1 ? n : f;
          }
          if (nextCR < q) {
            // CRs inside the segment: each CR or CRLF reads as one LF
            let start = seg;
            for (let i = seg; i < q; i++) {
              const c = text.charCodeAt(i);
              if (c === 13) {
                if (i > start) value += text.slice(start, i);
                value += '\n';
                line++;
                if (text.charCodeAt(i + 1) === 10) i++;
                start = i + 1;
              } else if (c === 10) {
                line++;
              }
            }
            if (start < q) value += text.slice(start, q);
            nextLF = -1;
            nextCR = -1;
          } else {
            // no CRs in the segment: LFs are literal, just counted
            if (nextLF < seg) {
              const f = text.indexOf('\n', seg);
              nextLF = f === -1 ? n : f;
            }
            if (nextLF < q) {
              let cnt = 0;
              let i = nextLF;
              while (i < q) {
                cnt++;
                const j = text.indexOf('\n', i + 1);
                i = j === -1 ? n : j;
              }
              line += cnt;
              nextLF = i;
            }
            value += text.slice(seg, q);
          }
          value += '"';
          seg = q + 2;
          q = text.indexOf('"', seg);
        }

        if (q === -1) {
          // the quote never closes: literal character, the rest is re-read unquoted
          pos = open + 1;
          line = openLine;
          errors.push({ code: 'unterminated_quote', line: recordLine, row: recordRow });
          value = '"';
          const f = text.indexOf('\n', pos);
          nextLF = f === -1 ? n : f;
          const g = text.indexOf('\r', pos);
          nextCR = g === -1 ? n : g;
        } else {
          // closed at q: final segment [seg, q)
          if (nextCR < seg) {
            const f = text.indexOf('\r', seg);
            nextCR = f === -1 ? n : f;
          }
          if (nextCR < q) {
            let start = seg;
            for (let i = seg; i < q; i++) {
              const c = text.charCodeAt(i);
              if (c === 13) {
                if (i > start) value += text.slice(start, i);
                value += '\n';
                line++;
                if (text.charCodeAt(i + 1) === 10) i++;
                start = i + 1;
              } else if (c === 10) {
                line++;
              }
            }
            if (start < q) value += text.slice(start, q);
            nextLF = -1;
            nextCR = -1;
          } else {
            if (nextLF < seg) {
              const f = text.indexOf('\n', seg);
              nextLF = f === -1 ? n : f;
            }
            if (nextLF < q) {
              let cnt = 0;
              let i = nextLF;
              while (i < q) {
                cnt++;
                const j = text.indexOf('\n', i + 1);
                i = j === -1 ? n : j;
              }
              line += cnt;
              nextLF = i;
            }
            value += text.slice(seg, q);
          }
          pos = q + 1;
          if (pos >= n) {
            ended = 3;
          } else {
            const c = text.charCodeAt(pos);
            if (c === 44) {
              pos += 1;
              ended = 0;
            } else if (c === 10) {
              pos += 1;
              line += 1;
              ended = 2;
            } else if (c === 13 && text.charCodeAt(pos + 1) === 10) {
              pos += 2;
              line += 1;
              ended = 2;
            } else {
              junk = true;
            }
          }
        }
      }

      if (ended === -1) {
        const prefix = value.length;
        let seg = pos;
        for (;;) {
          let cEnd = text.indexOf(',', pos);
          if (cEnd === -1) cEnd = n;
          if (nextLF < pos) {
            const f = text.indexOf('\n', pos);
            nextLF = f === -1 ? n : f;
          }
          if (nextCR < pos) {
            const f = text.indexOf('\r', pos);
            nextCR = f === -1 ? n : f;
          }
          if (cEnd < nextLF && cEnd < nextCR) {
            value += text.slice(seg, cEnd);
            pos = cEnd + 1;
            ended = 0;
            break;
          }
          if (nextLF < nextCR) {
            value += text.slice(seg, nextLF);
            pos = nextLF + 1;
            line++;
            ended = 2;
            break;
          }
          if (nextCR < n) {
            value += text.slice(seg, nextCR);
            if (text.charCodeAt(nextCR + 1) === 10) {
              pos = nextCR + 2;
              line++;
              ended = 2;
            } else {
              errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
              seg = nextCR + 1;
              pos = nextCR + 1;
              continue;
            }
            break;
          }
          value += text.slice(seg, n);
          pos = n;
          ended = 3;
          break;
        }
        if (junk && value.length > prefix) {
          errors.push({ code: 'quote_junk', line: recordLine, row: recordRow });
        }
      }

      fields.push(value);
      if (ended !== 0) break;
    }

    // a line that held only stray CRs is left with no characters: no record
    if (fields.length === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      do {
        fields.push('');
      } while (fields.length < width);
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }

  return { columns: header ? (columns ?? []) : null, rows, errors };
}
