// ===========================================
// makeAdmin.js — Promote a user to admin role
// ===========================================
// Usage: node makeAdmin.js <email>
// Example: node makeAdmin.js tia@example.com

require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const connectDB = require('./config/db')
const User = require('./models/User')

const email = process.argv[2]

if (!email) {
  console.error('Usage: node makeAdmin.js <email>')
  process.exit(1)
}

async function main() {
  await connectDB()

  const user = await User.findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    { role: 'admin' },
    { new: true }
  )

  if (!user) {
    console.error(`No user found with email: ${email}`)
    process.exit(1)
  }

  console.log(`OK: ${user.name} (${user.email}) is now an admin`)
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
