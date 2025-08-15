// User repository abstrakce – centralizuje práci s modelem (příprava pro případné cachování nebo refactor)
const User = require('../models/User');

async function findUserByEmail(email) {
  return User.findOne({ email });
}

async function createUser(data) {
  const user = new User(data);
  await user.save();
  return user;
}

async function saveUser(user) {
  await user.save();
  return user;
}

module.exports = {
  findUserByEmail,
  createUser,
  saveUser,
};
