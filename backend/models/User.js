const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true, // removes whitespace from both ends
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true, // no two users can have the same email
      lowercase: true, // always store emails in lowercase
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },

    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // don't include password in queries by default
    },

  
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Necklace", // references the Necklace model
      },
    ],

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    aiAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    aiAnalysisSavedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

//automatically hash password before saving to database
userSchema.pre("save", async function (next) {
  // Only hash if password was modified (not on every save)
  if (!this.isModified("password")) return next();

  // OTP signup stores a bcrypt password hash while the email is verified.
  // Do not hash bcrypt strings a second time when creating the user.
  if (/^\$2[aby]\$\d{2}\$/.test(this.password)) return next();

  // Generate a salt (random data to make hash unique) and hash
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
