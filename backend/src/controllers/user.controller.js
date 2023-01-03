const userCtrls = {};
const bycrypt = require("bcrypt");
const User = require("../models/UserModel");
// helper token
const { tokenGenerator } = require("../helpers/jwt");

userCtrls.userpueba = (req, res) => {
  res.status(200).send({
    message: "funciona user",
    user: req.user,
  });
};

//      SINGUP
userCtrls.signup = async (req, res) => {
  const errors = [];
  //    get data from req
  let { name, username, email, password, confirm_password } = req.body;
  //    check the data
  if (!name || !username || !email || !password) {
    return res
      .status(400)
      .json({ status: "Error 404", message: "Missing credentials" });
  }
  //    check match password
  if (password != confirm_password) {
    errors.push({ text: "Passwords do not match" });
  }
  //    check password has more 4 charter
  if (password.length < 4) {
    errors.push({ text: "Password must be at least 4 characters" });
  }
  if (errors.length > 0) {
    res.status(400).json({
      errors,
      name,
      username,
      email,
      password,
      confirm_password,
    });
    return;
  }
  //    duplicates user control
  User.find({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
  }).exec(async (err, user) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "Error", message: "Error while saving user" });
    }
    if (user && user.length >= 1) {
      return res.status(200).send({
        status: "Success",
        message: "User already exists",
      });
    }
    const userSave = new User({ name, username, email, password });
    //   password encryption
    userSave.password = await bycrypt.hash(password, 10);
    //   save user to database
    userSave.save((err, userStored) => {
      if (err || !userStored) {
        return res
          .status(500)
          .send({ status: "Error", message: "Error while saving user" });
      }
      //   return data
      return res.status(200).json({
        status: "Success",
        message: "Register successfully",
        user: userStored,
      });
    });
  });
};

// signin controller
userCtrls.signin = async (req, res) => {
  // Get params from body
  const { username, email, password } = req.body;
  // Search on the database
  if (email && password) {
    if (!email || !password) {
      return res.status(400).json({
        status: "Error",
        message: "Missing credentials (email)",
      });
    }
    User.findOne({ email: email.toLowerCase() })
      // .select({ "password": 0 })
      .exec((err, user) => {
        if (err || !user) {
          return res
            .status(404)
            .json({ status: "Error", message: "Email not found" });
        }
        // Check password
        const pwd = bycrypt.compareSync(password, user.password);
        if (!pwd) {
          return res.status(400).json({
            status: "Error",
            message: "Password incorrect",
          });
        }
        // Token
        // Return User data
        return res.status(200).json({
          status: "Success",
          message: "Signin successfully",
          user: { id: user._id, name: user.name, username: user.email },
        });
      });
  } else if (!email) {
    if (!username || !password) {
      return res.status(400).json({
        status: "Error",
        message: "Missing credentials (username)",
      });
    }
    User.findOne({ username: username.toLowerCase() })
      // .select({ "password": 0 })
      .exec((err, user) => {
        if (err || !user) {
          return res
            .status(404)
            .json({ status: "Error", message: "Username not found" });
        }
        // Check password
        const pwd = bycrypt.compareSync(password, user.password);
        if (!pwd) {
          return res.status(400).json({
            status: "Error",
            message: "Password incorrect",
          });
        }
        // Token
        const token = tokenGenerator(user);
        // Return User data
        return res.status(200).json({
          status: "Success",
          message: "Signin successfully",
          user: { id: user._id, name: user.name, username: user.username },
          token,
        });
      });
  }
};

userCtrls.getOneProfile = (req, res) => {
  // receive id
  const id = req.params.id;
  // get data from database
  User.findById(id) 
    .select({ password: 0, role: 0 })
    .exec((err, user) => {
      if (err || !user) {
        res.status(404).json({
          status: "Error",
          message: "User not found or something went wrong",
        });
      }
      return res.status(200).json({
        status: "Success",
        user: user,
      });
    });
};

userCtrls.userList = (req, res) => {
  res.status(200).json({
    status: "Success",
    message: "User list"
  })
}

module.exports = userCtrls;
