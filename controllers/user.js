const bcrypt = require("bcrypt"); 
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

exports.signup = async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      email: req.body.email,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).json({ message: "Utilisateur enregistré" });
  } catch (error) {
    res.status(500).json({ message: "Erreur d'enregistrement" });
  }
};

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).json({ message: "Utilisateur/mot de passe invalide" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({ userId: user._id, token });
  } catch (error) {
    res.status(500).json({ message: "Utilisateur/mot de passe invalide" });
  }
};
