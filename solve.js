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

  while (true) {
    while (pos < n) {
      const c = text.charCodeAt(pos);
      if (c === 10) {
        pos += 1;
        line += 1;
      } else if (c === 13 && text.charCodeAt(pos + 1) === 10) {
        pos += 2;
        line += 1;
      } else {
        break;
      }
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
        pos = seg;
        let closed = false;

        while (pos < n) {
          const c = text.charCodeAt(pos);
          if (c === 34) {
            value += text.slice(seg, pos);
            if (text.charCodeAt(pos + 1) === 34) {
              value += '"';
              pos += 2;
              seg = pos;
            } else {
              pos += 1;
              seg = pos;
              closed = true;
              break;
            }
          } else if (c === 13) {
            value += text.slice(seg, pos);
            value += '\n';
            line += 1;
            pos += text.charCodeAt(pos + 1) === 10 ? 2 : 1;
            seg = pos;
          } else {
            if (c === 10) line += 1;
            pos += 1;
          }
        }

        if (!closed) {
          pos = open + 1;
          line = openLine;
          errors.push({ code: 'unterminated_quote', line: recordLine, row: recordRow });
          value = '"';
        } else if (pos >= n) {
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

      if (ended === -1) {
        const prefix = value.length;
        let seg = pos;
        while (pos < n) {
          const c = text.charCodeAt(pos);
          if (c === 44) {
            value += text.slice(seg, pos);
            pos += 1;
            ended = 0;
            break;
          }
          if (c === 10) {
            value += text.slice(seg, pos);
            pos += 1;
            line += 1;
            ended = 2;
            break;
          }
          if (c === 13) {
            value += text.slice(seg, pos);
            if (text.charCodeAt(pos + 1) === 10) {
              pos += 2;
              line += 1;
              ended = 2;
              break;
            }
            errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
            pos += 1;
            seg = pos;
            continue;
          }
          pos += 1;
        }
        if (ended === -1) {
          value += text.slice(seg, pos);
          ended = 3;
        }
        if (junk && value.length > prefix) {
          errors.push({ code: 'quote_junk', line: recordLine, row: recordRow });
        }
      }

      fields.push(value);
      if (ended !== 0) break;
    }

    if (fields.length === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }

  return { columns: header ? (columns ?? []) : null, rows, errors };
}
