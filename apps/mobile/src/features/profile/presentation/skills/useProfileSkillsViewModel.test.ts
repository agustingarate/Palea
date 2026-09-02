import { sameIds } from './profileSelection';

describe('sameIds', () => {
  it('compares a skills selection independently of its visual order', () => {
    expect(sameIds(['skill-b', 'skill-a'], ['skill-a', 'skill-b'])).toBe(true);
    expect(sameIds(['skill-a'], ['skill-a', 'skill-b'])).toBe(false);
    expect(sameIds(['skill-a'], ['skill-c'])).toBe(false);
  });
});
