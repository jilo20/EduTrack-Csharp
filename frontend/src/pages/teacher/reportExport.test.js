// OWNER: Lopez, Mary Vincent — WBS 8.8 CSV interoperability and formula handling.
import assert from 'node:assert/strict';
import test from 'node:test';
import { csvCell, makeCsv } from './reportExport.js';

test('CSV preserves commas, quotation marks, and embedded newlines', () => {
  assert.equal(csvCell('Lopez, "Mary"\nVincent'), '"Lopez, ""Mary""\nVincent"');
});

test('spreadsheet formula prefixes are treated as text', () => {
  for (const value of ['=SUM(1,2)', '+1+2', '-1+2', '@SUM(1)', ' \t=HYPERLINK("test")']) {
    assert.ok(csvCell(value).startsWith('"\''));
  }
});

test('CSV preserves zero scores, empty pending scores, Unicode, and CRLF records', () => {
  const csv = makeCsv(['Name', 'Score'], [['José', 0], ['Ana', null]]);
  assert.equal(csv, '\uFEFF"Name","Score"\r\n"José","0"\r\n"Ana",""');
});
