import * as bcrypt from 'bcryptjs';

export function verifyPassword(plain: string, hashed: string): boolean {
  let hash = hashed;
  if (hash.startsWith('$2y$')) {
    hash = hash.replace('$2y$', '$2b$'); // compatibilidad con hashes de Laravel/PHP
  }
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

export function getPasswordHash(password: string): string {
  const salt = bcrypt.genSaltSync(8); // mismos 8 rounds que en Python
  return bcrypt.hashSync(password, salt);
}

export function needsRehash(hashed: string): boolean {
  return (
    hashed.startsWith('$2y$') ||
    (!hashed.startsWith('$2b$08$') && !hashed.startsWith('$2a$08$'))
  );
}
