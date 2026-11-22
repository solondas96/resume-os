import { describe, it, expect } from 'vitest';
import { composeBullet } from './bulletBuilder';

describe('bullet builder', () => {
  it('positive: assembles an XYZ-style bullet from the user\'s parts', () => {
    const b = composeBullet({
      intent: 'improve',
      did: 'the checkout flow',
      change: 'cutting drop-off by 18%',
      how: 'removing a redundant step',
    });
    expect(b.text).toBe('Improved the checkout flow, cutting drop-off by 18%, by removing a redundant step.');
    expect(b.hasMetric).toBe(true);
    expect(b.prompt).toBeUndefined();
  });

  it('negative: a missing metric triggers a prompt and never invents a number', () => {
    const b = composeBullet({ intent: 'build', did: 'a reporting dashboard', change: 'so ops could self-serve' });
    expect(b.hasMetric).toBe(false);
    expect(b.prompt).toMatch(/percentage|estimate/i);
    expect(b.text).not.toMatch(/\d/);
  });

  it('uses the chosen verb when given, otherwise the first verb for the intent', () => {
    expect(composeBullet({ intent: 'lead', verb: 'drove', did: 'the migration' }).text).toBe('Drove the migration.');
    expect(composeBullet({ intent: 'lead', did: 'the migration' }).text).toBe('Led the migration.');
  });
});
