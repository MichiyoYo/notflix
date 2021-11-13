/**
 * Services for User Model
 * @requires ../models/user
 * @requires express-validator
 * @exports getUserDetails
 * @exports getUserList
 * @exports getUserFavs
 * @exports getUserWatchList
 * @exports userRegister
 * @exports userUpdate
 * @exports userAddToFavs
 * @exports userRemoveFromFavs
 * @exports userAddToWatchList
 * @exports userRemoveFromWatchList
 * @exports userDeregister
 */

/**
 * @description the User model
 * @ignore
 */
const UserModel = require("../models/user");

const { validationResult } = require("express-validator");

/**
 * @description the user entity
 * @ignore
 */
const Users = UserModel.User;

/**
 * Endpoint: /users/[username]
 * Retrieves the list of all the users
 * @async
 * @function GET getUserList
 * @param {Promise<string>} req the request
 * @param {Promise<object>} res the data from the storage
 * @example /users/mochi
 */
exports.getUserList = async function (req, res) {
  try {
    const users = await Users.find()
      .populate("FavoriteMovies", "Title")
      .populate("WatchList", "Title");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).send(`
    Oh no! Something went wrong! 😱
    Error: ${err}
    `);
  }
};

/**
 * Endpoint: /users/[username]
 * Retrieves the details of the user
 * @async
 * @function GET getUserDetails
 * @param {Promise<string>} req the request
 * @param {Promise<object>} res the data from the storage
 * @example /users/mochi
 */
exports.getUserDetails = async function (req, res) {
  const { username } = req.params;
  try {
    const user = await Users.findOne({ Username: username })
      .populate("FavoriteMovies", "Title")
      .populate("WatchList", "Title");
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).send(`Sorry, the user ${username} doesn't exist! 🤷`);
    }
  } catch (err) {
    res.status(500).send(`
    Oh no! Something went wrong! 😱
    Error: ${err}
    `);
  }
};

/**
 * Endpoint: /users/[username]/favorites
 * Retrieves the user's list of favorites
 * @async
 * @function GET getUserFavs
 * @param {Promise<string>} req the request
 * @param {Promise<object>} res the data from the storage
 * @example /users/loejester/favorites
 */
exports.getUserFavs = async function (req, res) {
  const { username } = req.params;
  try {
    const user = await Users.findOne({ Username: username }).populate(
      "FavoriteMovies"
    );
    if (!user) {
      res
        .status(404)
        .send(
          `Sorry, we don't have the user "${username}" in our database! 🤷`
        );
    } else {
      res.status(200).json({
        Favorites: user.FavoriteMovies,
      });
    }
  } catch (err) {
    res.status(500).send(`
    Oh no! Something went wrong! 😱
    Error: ${err}
    `);
  }
};

/**
 * Endpoint: /users/[username]/watchlist
 * Retrieves the user's watchlist
 * @async
 * @function GET getUserWatchList
 * @param {Promise<string>} req the request
 * @param {Promise<object>} res the data from the storage
 * @example /users/loejester/watchlist
 */
exports.getUserWatchList = async function (req, res) {
  const { username } = req.params;
  try {
    const user = await Users.findOne({ Username: username }).populate(
      "WatchList",
      "Title"
    );
    if (!user) {
      res
        .status(404)
        .send(
          `Sorry, we don't have the user "${username}" in our database! 🤷`
        );
    } else {
      res.status(200).json({
        WatchList: user.WatchList,
      });
    }
  } catch (err) {
    res.status(500).send(`
    Oh no! Something went wrong! 😱
    Error: ${err}
    `);
  }
};

/**
 * Endpoint: /register
 * The info of the new user must be sent in the body of the request as a JSON object in the format:
 * {
 *  "Username" : "mochi",
 *  "Password" : "ihatedogs",
 *  "Name" : "Mochi Abigail Lester",
 *  "Email" : "mochithecat@meow.com",
 *  "BirthDate" : new Date("2018-11-15"),
 * }
 * Adds a new user to the database
 * @async
 * @function POST userRegister
 * @param {Promise<object>} req the request object holding the data to send to the storage
 * @param {Promise<object>} res the data from the storage holding the info of the user
 */
exports.userRegister = function (req, res) {
  // check the validation object for errors
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const username = req.body.Username,
    password = req.body.Password,
    name = req.body.Name,
    email = req.body.Email,
    birthDate = req.body.BirthDate;

  let hashedPassword = Users.hashPassword(password);

  Users.findOne({ Username: username })
    .then((user) => {
      if (user) {
        return res
          .status(400)
          .send(`⛔ Bad Request: The user ${username} already exists.`);
      } else {
        Users.create({
          Username: username,
          Password: hashedPassword,
          Name: name,
          Email: email,
          BirthDate: new Date(birthDate),
        })
          .then((user) => {
            res.status(201).json(user);
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send(`
            Oh no! Something went wrong! 😱
            Error: ${err}
            `);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(`
      Oh no! Something went wrong! 😱
      Error: ${err}
      `);
    });
};

/**
 * Endpoint: /users/[username]
 * The fields to update must be sent in the body of the request as a JSON object in the format:
 * {
 *  "Username" : "newusername",
 *  "Password" : "newpassword",
 *  "Email" : "newemail"
 *   ...
 * }
 * Username, Password and Email are mandatory
 * Updates a user with new info
 * @async
 * @function PUT userUpdate
 * @param {Promise<object>} req the request object holding the data to send to the storage
 * @param {Promise<object>} res the data from the storage holding the info of the user
 * @example /users/mochi
 */
exports.userUpdate = function (req, res) {
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const username = req.body.Username,
    password = req.body.Password,
    name = req.body.Name,
    email = req.body.Email,
    birthDate = req.body.BirthDate;

  let hashedPassword = Users.hashPassword(password);
  Users.findOneAndUpdate(
    { Username: username },
    {
      $set: {
        Username: username,
        Password: hashedPassword,
        Name: name,
        Email: email,
        BirthDate: birthDate,
      },
    },
    { new: true, upsert: false }
  )
    .then((updatedUser) => {
      if (updatedUser) {
        res.status(200).json(updatedUser);
      } else {
        res
          .status(404)
          .send("Sorry, we don't have that user in our database! 🤷");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(`
      Oh no! Something went wrong! 😱
      Error: ${err}
      `);
    });
};

/**
 * Endpoint: /users/[username]/favorites/[movieId]
 * Adds a movie to a user's list of favorites
 * @async
 * @function POST userAddToFavs
 * @param {Promise<string>} req the request
 * @param {Promise<string>} res a message about the result of the operation
 * @example /users/mochi/favorites/6138df5bc6e139efe0c91ca2
 */
exports.userAddToFavs = function (req, res) {
  const { username, movieId } = req.params;
  Users.findOneAndUpdate(
    { Username: username },
    {
      $addToSet: {
        FavoriteMovies: movieId,
      },
    },
    { new: true }
  )
    .then((updatedUser) => {
      res
        .status(200)
        .send(
          `The movie has been successfully added to ${username}'s list of favorites! 👌`
        );
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(`
      Oh no! Something went wrong! 😱
      Error: ${err}
      `);
    });
};

/**
 * Endpoint: /users/[username]/watchlist/[movieId]
 * Adds a movie to a user's watchlist
 * @async
 * @function POST userAddToFavs
 * @param {Promise<string>} req the request
 * @param {Promise<string>} res a message about the result of the operation
 * @example /users/mochi/watchlist/6138df5bc6e139efe0c91ca2
 */
exports.userAddToWatchList = function (req, res) {
  const { username, movieId } = req.params;
  Users.findOneAndUpdate(
    { Username: username },
    {
      $addToSet: {
        WatchList: movieId,
      },
    },
    { new: true }
  )
    .then((updatedUser) => {
      res
        .status(200)
        .send(
          `The movie has been successfully added to ${username}'s watch list! 👌`
        );
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(`
      Oh no! Something went wrong! 😱
      Error: ${err}
      `);
    });
};

/**
 * Endpoint: /users/[username]/favorites/[movieId]
 * Removes a movie from a user's list of favorites
 * @async
 * @function DELETE userRemoveFromFavs
 * @param {Promise<string>} req the request
 * @param {Promise<string>} res a message about the result of the operation
 * @example /users/mochi/favorites/6138df5bc6e139efe0c91ca2
 */
exports.userRemoveFromFavs = function (req, res) {
  const { username, movieId } = req.params;
  Users.findOneAndUpdate(
    { Username: username },
    {
      $pull: {
        FavoriteMovies: movieId,
      },
    },
    { new: true }
  )
    .then((updatedUser) => {
      res
        .status(200)
        .send(
          `The movie has been successfully removed from ${username}'s list of favorites! 👌`
        );
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(errorMsg(500, err));
    });
};

/**
 * Endpoint: /users/[username]/watchlist/[movieId]
 * Removes a movie to a user's watchlist
 * @async
 * @function DELETE userRemoveFromWatchList
 * @param {Promise<string>} req the request
 * @param {Promise<string>} res a message about the result of the operation
 * @example /users/mochi/watchlist/6138df5bc6e139efe0c91ca2
 */
exports.userRemoveFromWatchList = function (req, res) {
  const { username, movieId } = req.params;
  Users.findOneAndUpdate(
    { Username: username },
    {
      $pull: {
        WatchList: movieId,
      },
    },
    { new: true }
  )
    .then((updatedUser) => {
      res
        .status(200)
        .send(
          `The movie has been successfully removed from ${username}'s watch list! 👌`
        );
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(errorMsg(500, err));
    });
};

/**
 * Endpoint: /users/[username]/deregister
 * Deregisters a user
 * @async
 * @function DELETE userDeregister
 * @param {Promise<string>} req the request
 * @param {Promise<string>} res a message about the result of the operation
 * @example /users/mochi/deregister
 */
exports.userDeregister = function (req, res) {
  const { username } = req.params;
  Users.findOneAndRemove({ Username: username })
    .then((usrtoRemove) => {
      if (!usrtoRemove) {
        res.status(404).send(`The user ${username} doesn't exist. 🤷`);
      } else {
        res
          .status(200)
          .send(`The user ${username} was successfully deregistered. 👋`);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(errorMsg(500, err));
    });
};
