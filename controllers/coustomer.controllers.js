const Coustomer = require("../models/coustomer.db");

const createCoustomer = async (req, res) => {
  try {
    const coustomer = new Coustomer(req.body);
    const newCoustomer = await coustomer.save();
    return res.status(201).json(newCoustomer);
  } catch (err) {
    res.status(500).send(err);
  }
};

const GetCoustomer = async (req, res) => {
  try {
    let filter = {};
    if (req.query.name) {
      filter.Name = { $regex: req.query.name, $options: "i" };
    }
    if (req.query.gender) {
      filter.Gender = req.query.gender;
    }
    if (req.query.address) {
      filter.Address = { $regex: req.query.address, $options: "i" };
    }
    if (req.query.amount) {
      filter.Amount = { $eq: req.query.amount };
    }
    if (req.query.rate) {
      filter.Rate = { $eq: req.query.rate };
    }
    if (req.query.phoneNumber) {
      filter.PhoneNumber = { $eq: req.query.phoneNumber };
    }
    if (req.query.category) {
      filter.Category = { $regex: req.query.category, $options: "i" };
    }
    if (req.query.remarks) {
      filter.Remarks = { $regex: req.query.remarks, $options: "i" };
    }
    if (req.query.createdAt) {
      filter.createdAt = { $eq: req.query.createdAt };
    }
    if (req.query.updatedAt) {
      filter.updatedAt = { $eq: req.query.updatedAt };
    }
    let sort = {};
    if (req.query.sortBy) {
      let parts = req.query.sortBy.split(":");
      sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    }
    let options = {};
    if (req.query.range) {
      let parts = req.query.range.split(":");
      options.skip = parseInt(parts[0]);
      options.limit = parseInt(parts[1]) - options.skip;
    }
    // if (req.query.date) {
    //   let coustomers = await Coustomer.find({ date: req.query.date });
    //   res.status(200).json(coustomers);
    // }
    let coustomers = await Coustomer.find(filter, null, options).sort(sort);
    res.status(200).json(coustomers);
  } catch (err) {
    console.log(err);
  }
};
const GetCoustomerById = async (req, res) => {
  try {
    const coustomer = await Coustomer.findById(req.params.id);
    if (coustomer) {
      return res.status(201).json(coustomer);
    } else {
      console.log("User not found");
    }
  } catch (err) {
    console.log(err);
  }
};
const UpdateCoustomer = async (req, res) => {
  try {
    const data = await Coustomer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.status(201).json(data);
  } catch (err) {
    console.log(err);
  }
};
const DeleteCoustomer = async (req, res) => {
  try {
    const coustomer = await Coustomer.findByIdAndDelete(req.params.id);
    if (coustomer) {
      return res.status(201).json("Coustomer Deleted Successfully");
    } else {
      console.log("User not found");
    }
  } catch (err) {
    console.log(err);
  }
};
module.exports = {
  createCoustomer,
  GetCoustomer,
  UpdateCoustomer,
  DeleteCoustomer,
  GetCoustomerById,
};
