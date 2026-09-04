import {
  JOB_DESCRIPTION_TEXT_LIMIT,
  normalizeVisibleText,
  semanticOcrLinesToSafeHtml,
  visibleTextToSafeHtml,
} from './jobDescriptionImport';

describe('job-description local import domain', () => {
  it('normalizes visible text and escapes it before editor prefill', () => {
    expect(normalizeVisibleText(' a\r\n  b \n\n\n c ')).toBe('a\nb\n\nc');
    expect(visibleTextToSafeHtml('<script>alert(1)</script>')).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
    );
  });

  it('rejects hostile oversized text at the local boundary', () => {
    expect(() =>
      visibleTextToSafeHtml('x'.repeat(JOB_DESCRIPTION_TEXT_LIMIT + 1)),
    ).toThrow();
  });

  it('formats explicit OCR structure without accepting OCR markup', () => {
    expect(
      visibleTextToSafeHtml(
        'REQUISITOS\n- TypeScript\n- Comunicación\n\nExperiencia:\n1. Tres años\n2. Trabajo remoto\n\nUbicación: Remoto',
      ),
    ).toBe(
      '<h2>REQUISITOS</h2><ul><li>TypeScript</li><li>Comunicación</li></ul><h2>Experiencia:</h2><ol><li>Tres años</li><li>Trabajo remoto</li></ol><p><strong>Ubicación:</strong> Remoto</p>',
    );
  });

  it('uses local OCR typography signals without retaining geometry', () => {
    expect(
      semanticOcrLinesToSafeHtml([
        {
          text: 'Senior Engineer',
          fontSize: 24,
          isBold: true,
          x: 0,
          y: 0,
          height: 24,
        },
        {
          text: 'Construí productos accesibles.',
          fontSize: 14,
          isBold: false,
          x: 0,
          y: 40,
          height: 14,
        },
        {
          text: 'IMPORTANTE',
          fontSize: 14,
          isBold: true,
          x: 0,
          y: 80,
          height: 14,
        },
      ]),
    ).toBe(
      '<h2>Senior Engineer</h2><p>Construí productos accesibles.</p><p><strong>IMPORTANTE</strong></p>',
    );
  });

  it('normalizes OCR bullet glyphs and joins wrapped bullet lines', () => {
    expect(
      semanticOcrLinesToSafeHtml([
        {
          text: 'What You Bring',
          fontSize: 20,
          isBold: true,
          x: 0,
          y: 0,
          height: 20,
        },
        {
          text: '« 8+ years of experience in software engineering',
          fontSize: 14,
          isBold: false,
          x: 0,
          y: 36,
          height: 14,
        },
        {
          text: 'with a strong focus on mobile development',
          fontSize: 14,
          isBold: false,
          x: 28,
          y: 52,
          height: 14,
        },
        {
          text: '+ Deep expertise in React Native',
          fontSize: 14,
          isBold: false,
          x: 0,
          y: 68,
          height: 14,
        },
      ]),
    ).toBe(
      '<h2>What You Bring</h2><ul><li>8+ years of experience in software engineering with a strong focus on mobile development</li><li>Deep expertise in React Native</li></ul>',
    );
  });
});
