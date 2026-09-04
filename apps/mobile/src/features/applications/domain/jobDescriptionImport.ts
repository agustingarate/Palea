export const JOB_DESCRIPTION_TEXT_LIMIT = 50_000;
export const JOB_DESCRIPTION_HTML_LIMIT = 100_000;

export type ImportStatus =
  'idle' | 'loading' | 'success' | 'empty' | 'error' | 'cancelled';

export type JobDescriptionImportResult =
  | { status: 'success'; text: string; html?: string }
  | { status: 'empty' }
  | { status: 'cancelled' };

/** A platform boundary: implementations must never return source DOM or metadata. */
export interface JobDescriptionImportPort {
  importFromUrl(
    input: { url: string },
    signal: AbortSignal,
  ): Promise<JobDescriptionImportResult>;
  importFromImage(
    input: { uri: string },
    signal: AbortSignal,
  ): Promise<JobDescriptionImportResult>;
}

export interface JobDescriptionImagePicker {
  pickImage(): Promise<{ uri: string } | null>;
}

/** Provider-neutral, ephemeral OCR signals. Source geometry never leaves the datasource. */
export interface OcrSemanticLine {
  text: string;
  fontSize: number;
  isBold: boolean;
  x: number;
  y: number;
  height: number;
}

export function normalizeVisibleText(value: string) {
  const normalized = value
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (normalized.length > JOB_DESCRIPTION_TEXT_LIMIT)
    throw new Error('Imported job description exceeds the text limit');
  return normalized;
}

export function visibleTextToSafeHtml(value: string) {
  const text = normalizeVisibleText(value);
  if (!text) return '';
  const html = text
    .split(/\n{2,}/)
    .map(formatBlock)
    .join('');
  if (html.length > JOB_DESCRIPTION_HTML_LIMIT)
    throw new Error('Imported job description exceeds the HTML limit');
  return html;
}

export function semanticOcrLinesToSafeHtml(lines: readonly OcrSemanticLine[]) {
  const usable = lines.filter((line) => line.text.trim());
  if (!usable.length) return '';
  const bodySize = median(usable.map((line) => line.fontSize).filter(Boolean));
  const html: string[] = [];
  const lineHeight = median(usable.map((line) => line.height).filter(Boolean));
  let paragraph: string[] = [];
  let bullets: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length)
      html.push(`<p>${formatInlineLabel(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const flushBullets = () => {
    if (bullets.length)
      html.push(
        `<ul>${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`,
      );
    bullets = [];
  };
  let previous: OcrSemanticLine | null = null;
  for (const line of usable) {
    const text = line.text.trim();
    const marker = text.match(/^(?:[-*•▪‣+«»›◦·]|\d+[.)])\s*(.+)$/);
    const verticalGap = previous ? line.y - (previous.y + previous.height) : 0;
    const startsNewBlock = Boolean(previous && verticalGap > lineHeight * 0.8);
    const heading = line.fontSize > bodySize * 1.28 && text.length <= 100;
    if (heading) {
      flushParagraph();
      flushBullets();
      html.push(`<h2>${escapeHtml(text)}</h2>`);
    } else if (marker?.[1]) {
      if (startsNewBlock) flushBullets();
      flushParagraph();
      bullets.push(marker[1]);
    } else if (line.isBold && !bullets.length) {
      if (startsNewBlock) flushParagraph();
      html.push(`<p><strong>${escapeHtml(text)}</strong></p>`);
    } else if (bullets.length && !startsNewBlock) {
      bullets[bullets.length - 1] = `${bullets[bullets.length - 1]} ${text}`;
    } else {
      if (startsNewBlock) flushParagraph();
      if (bullets.length) flushBullets();
      paragraph.push(text);
    }
    previous = line;
  }
  flushParagraph();
  flushBullets();
  const result = html.join('');
  if (result.length > JOB_DESCRIPTION_HTML_LIMIT)
    throw new Error('Imported job description exceeds the HTML limit');
  return result;
}

function median(values: readonly number[]) {
  if (!values.length) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 1;
}

/**
 * OCR cannot reliably express visual weight, so this only recognizes explicit
 * textual structure. It never treats the OCR result as HTML.
 */
function formatBlock(block: string) {
  const lines = block.split('\n');
  const html: string[] = [];
  let list: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (!list) return;
    html.push(`</${list}>`);
    list = null;
  };

  for (const line of lines) {
    const unordered = line.match(/^[-*•▪‣]\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    const nextList = unordered ? 'ul' : ordered ? 'ol' : null;
    if (nextList) {
      if (list && list !== nextList) closeList();
      if (!list) {
        list = nextList;
        html.push(`<${list}>`);
      }
      const item = unordered?.[1] ?? ordered?.[1];
      if (item) html.push(`<li>${escapeHtml(item)}</li>`);
      continue;
    }

    closeList();
    if (isHeading(line)) {
      html.push(`<h2>${escapeHtml(line)}</h2>`);
      continue;
    }
    html.push(`<p>${formatInlineLabel(line)}</p>`);
  }
  closeList();
  return html.join('');
}

function isHeading(line: string) {
  if (line.length > 80) return false;
  return (
    line.endsWith(':') || /^[A-ZÁÉÍÓÚÜÑ0-9][A-ZÁÉÍÓÚÜÑ0-9 &/|-]{2,}$/.test(line)
  );
}

function formatInlineLabel(line: string) {
  const label = line.match(/^([^:\n]{1,50}):(\s+.+)$/);
  if (!label) return escapeHtml(line);
  return `<strong>${escapeHtml(label[1] ?? '')}:</strong>${escapeHtml(label[2] ?? '')}`;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[
        character
      ]!,
  );
}
