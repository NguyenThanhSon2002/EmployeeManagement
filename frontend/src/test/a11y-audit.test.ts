import { describe, it, expect } from 'vitest';
import { MOCK_SHIFT_TEMPLATES } from '@/test/fixtures';

/**
 * Calculates relative luminance of an sRGB hex color.
 * Formula per WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculates contrast ratio between two hex colors.
 * Formula: (L1 + 0.05) / (L2 + 0.05)
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Phase 06: WCAG 2.1 AA Accessibility & Contrast Audit (TSK-E02)', () => {
  it('verifies that all default shift templates comply with WCAG 2.1 AA contrast requirements (>= 4.5:1)', () => {
    for (const template of MOCK_SHIFT_TEMPLATES) {
      const ratio = getContrastRatio(template.colorCode, template.textColor);
      // WCAG AA requirement for normal text is >= 4.5:1
      expect(
        ratio,
        `Shift ${template.shiftCode} (${template.shiftName}) has contrast ratio ${ratio.toFixed(2)}, which must be >= 4.5`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('verifies system UI token contrast for dark text on white surface', () => {
    const textPrimary = '#1f1f1f'; // --color-text-primary
    const bgSurface = '#ffffff';   // --color-surface
    const ratio = getContrastRatio(textPrimary, bgSurface);
    expect(ratio).toBeGreaterThanOrEqual(7.0); // AAA standard level
  });

  it('verifies system primary brand color button contrast with white text', () => {
    const primaryColor = '#1677ff'; // --color-primary
    const whiteText = '#ffffff';
    const ratio = getContrastRatio(primaryColor, whiteText);
    expect(ratio).toBeGreaterThanOrEqual(3.0); // Pass for active interactive button controls
  });
});
