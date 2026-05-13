const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
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
      select: false, // excluded from queries by default
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Necklace",
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

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // OTP signup pre-hashes the password before storing the EmailVerification record.
  // Guard against double-hashing when the User document is created from that hash.
  if (/^\$2[aby]\$\d{2}\$/.test(this.password)) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
