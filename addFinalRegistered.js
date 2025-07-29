require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function addFinalRegisteredField() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const result = await User.updateMany(
    { finalRegistered: { $exists: false } },
    { $set: { finalRegistered: false } }
  );
  console.log('Updated users:', result.modifiedCount);
  await mongoose.disconnect();
}

addFinalRegisteredField().then(() => {
  console.log('Done.');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
