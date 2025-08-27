// tests/api/cat-facts.spec.ts
import { test, expect } from '@playwright/test';

type Fact = { fact: string; length: number };
type BreedsResponse = {
  data: Array<{ breed: string; country: string; origin: string; coat: string; pattern: string }>;
  current_page: number;
  per_page: number;
  last_page?: number;
  total?: number;
};

test.describe('Cat Facts API', () => {
  const BASE = 'https://catfact.ninja';

  test('GET /fact - single random fact with correct length', async ({ request }) => {
    const res = await test.step('Request a random cat fact', async () => {
      const r = await request.get(`${BASE}/fact`);
      expect(r.ok(), `HTTP ${r.status()}`).toBeTruthy();
      return r;
    });

    const body = await test.step('Parse JSON body', async () => res.json()) as Fact;

    await test.step('Validate shape and invariants', async () => {
      expect(body).toEqual(expect.objectContaining({
        fact: expect.any(String),
        length: expect.any(Number),
      }));
      // Invariant: reported length matches string length
      expect(body.fact.length).toBe(body.length);
      expect(body.fact.trim().length).toBeGreaterThan(0);
    });
  });

  test('GET /facts?limit=3 - list of facts, each well-formed', async ({ request }) => {
    const res = await test.step('Request a list of 3 facts', async () => {
      const r = await request.get(`${BASE}/facts`, { params: { limit: 3 } });
      expect(r.ok(), `HTTP ${r.status()}`).toBeTruthy();
      return r;
    });

    const body = await test.step('Parse JSON body', async () => res.json()) as { data: Fact[] };

    await test.step('Validate list shape and each item', async () => {
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data.length).toBeLessThanOrEqual(3);

      for (const f of body.data) {
        expect(f).toEqual(expect.objectContaining({
          fact: expect.any(String),
          length: expect.any(Number),
        }));
        expect(f.fact.length).toBe(f.length);
      }

      // Optional: ensure facts look unique-ish
      const unique = new Set(body.data.map(f => f.fact));
      expect(unique.size).toBe(body.data.length);
    });
  });

  test('GET /breeds?limit=2 - breed objects with expected fields', async ({ request }) => {
    const res = await test.step('Request 2 breeds', async () => {
      const r = await request.get(`${BASE}/breeds`, { params: { limit: 2 } });
      expect(r.ok(), `HTTP ${r.status()}`).toBeTruthy();
      return r;
    });

    const body = await test.step('Parse JSON body', async () => res.json()) as BreedsResponse;

    await test.step('Validate breed list shape and fields', async () => {
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data.length).toBeLessThanOrEqual(2);

      for (const b of body.data) {
        expect(b).toEqual(expect.objectContaining({
          breed: expect.any(String),
          country: expect.any(String),
          origin: expect.any(String),
          coat: expect.any(String),
          pattern: expect.any(String),
        }));
      }

      // Optional pagination sanity
      expect(typeof body.current_page).toBe('number');
      expect(typeof body.per_page).toBe('number');
    });
  });
});
