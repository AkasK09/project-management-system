const bcrypt = require('bcryptjs');

describe('Unit Tests - Password Hashing', () => {
  it('should hash password successfully and verify correct matching', async () => {
    const rawPassword = 'secretPassword123';
    const hash = await bcrypt.hash(rawPassword, 10);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(rawPassword);

    const isMatch = await bcrypt.compare(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isFailMatch = await bcrypt.compare('wrongPassword', hash);
    expect(isFailMatch).toBe(false);
  });
});
