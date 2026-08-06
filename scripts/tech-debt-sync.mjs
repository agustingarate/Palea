#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const trackerPath = 'docs/exec-plans/tech-debt-tracker.md';
const absoluteTrackerPath = resolve(trackerPath);
const args = new Set(process.argv.slice(2));

function fail(message) {
  console.error(`tech-debt: ${message}`);
  process.exitCode = 1;
}

function parseRow(line) {
  const cells = line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());

  if (cells.length !== 3 || !/^TD-\d{3,}$/.test(cells[0])) {
    return null;
  }

  const [id, item, trigger] = cells;
  if (!item || !trigger) return null;
  return { id, item, trigger };
}

function readTracker() {
  try {
    return readFileSync(absoluteTrackerPath, 'utf8');
  } catch {
    fail(`no se pudo leer ${trackerPath}`);
    return '';
  }
}

function getChangedLines() {
  if (args.has('--all')) return readTracker().split('\n');

  try {
    const diff = execFileSync(
      'git',
      ['diff', 'HEAD', '--unified=0', '--', trackerPath],
      { encoding: 'utf8' },
    );
    return diff
      .split('\n')
      .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
      .map((line) => line.slice(1));
  } catch {
    fail('no se pudo obtener el diff de Git');
    return [];
  }
}

const tracker = readTracker();
const allRows = tracker.split('\n').map(parseRow).filter(Boolean);
const changedRows = getChangedLines().map(parseRow).filter(Boolean);
const malformedAddedRows = getChangedLines().filter((line) => {
  const trimmed = line.trim();
  const isHeader = /^\|\s*ID\s*\|/i.test(trimmed);
  const isSeparator = /^\|\s*-+\s*\|/.test(trimmed);
  return (
    trimmed.startsWith('|') && !isHeader && !isSeparator && !parseRow(trimmed)
  );
});

const uniqueRows = [
  ...new Map(changedRows.map((row) => [row.id, row])).values(),
];

if (args.has('--json')) {
  console.log(
    JSON.stringify(
      { tracker: trackerPath, rows: uniqueRows, malformedAddedRows },
      null,
      2,
    ),
  );
} else {
  console.log(`Technical debt tracker: ${trackerPath}`);
  console.log(`Detected new entries: ${uniqueRows.length}`);
  for (const row of uniqueRows) {
    console.log(`- [CHORE] ${row.id} ${row.item}`);
    console.log(`  Trigger: ${row.trigger}`);
  }
  if (malformedAddedRows.length > 0) {
    console.error(`Malformed added rows: ${malformedAddedRows.length}`);
    for (const row of malformedAddedRows) console.error(`- ${row}`);
    process.exitCode = 1;
  }
  if (uniqueRows.length > 0) {
    console.log(
      '\nNext step: invoke $tech-debt-clickup-sync to search ClickUp, show the preview, and request confirmation before creation.',
    );
  }
}

if (allRows.length === 0 && tracker.includes('|')) {
  fail('no se encontraron filas válidas en el tracker');
}
