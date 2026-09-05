import { describe, it, expect } from 'vitest';
import { mockTenders, MockTender } from './mock-data';

describe('mockTenders', () => {
  it('should have at least 8 entries', () => {
    expect(mockTenders.length).toBeGreaterThanOrEqual(8);
  });

  it('each tender should have all required fields', () => {
    mockTenders.forEach((tender) => {
      expect(tender).toHaveProperty('id');
      expect(tender).toHaveProperty('title');
      expect(tender).toHaveProperty('buyerName');
      expect(tender).toHaveProperty('country');
      expect(tender).toHaveProperty('deadline');
      expect(tender).toHaveProperty('estimatedValue');
      expect(tender).toHaveProperty('currency');
      expect(tender).toHaveProperty('score');
      expect(tender).toHaveProperty('matchBand');
      expect(tender).toHaveProperty('status');
      expect(tender).toHaveProperty('fitTags');
      expect(tender).toHaveProperty('hasRisk');
      expect(tender).toHaveProperty('source');
    });
  });

  it('each tender score should be between 0 and 100', () => {
    mockTenders.forEach((tender) => {
      expect(tender.score).toBeGreaterThanOrEqual(0);
      expect(tender.score).toBeLessThanOrEqual(100);
    });
  });

  it('each tender deadline should be a valid ISO date string', () => {
    mockTenders.forEach((tender) => {
      const date = new Date(tender.deadline);
      expect(date.toString()).not.toBe('Invalid Date');
      expect(tender.deadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('each tender matchBand should be a valid band', () => {
    const validBands = ['strong', 'worth-reviewing', 'low-priority', 'not-recommended'];
    mockTenders.forEach((tender) => {
      expect(validBands).toContain(tender.matchBand);
    });
  });

  it('each tender status should be a valid status', () => {
    const validStatuses = ['open', 'deadline-soon', 'expired', 'cancelled', 'updated'];
    mockTenders.forEach((tender) => {
      expect(validStatuses).toContain(tender.status);
    });
  });

  it('each tender fitTags should be a non-empty array of strings', () => {
    mockTenders.forEach((tender) => {
      expect(Array.isArray(tender.fitTags)).toBe(true);
      expect(tender.fitTags.length).toBeGreaterThan(0);
      tender.fitTags.forEach((tag) => {
        expect(typeof tag).toBe('string');
      });
    });
  });
});
