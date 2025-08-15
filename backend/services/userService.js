// User service – business logika nad repository (zatím minimální, připraveno pro rozšíření)
const { findUserByEmail, createUser, saveUser } = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');

async function ensureUserWithPassword(email, passwordHash) {
  let user = await findUserByEmail(email);
  if (!user) {
    user = await createUser({ email, password: passwordHash });
  } else if (!user.password) {
    user.password = passwordHash;
    await saveUser(user);
  }
  return user;
}

async function setPassword(email, newPassword) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  user.password = await bcrypt.hash(newPassword, 10);
  return saveUser(user);
}

module.exports = {
  ensureUserWithPassword,
  setPassword,
};
