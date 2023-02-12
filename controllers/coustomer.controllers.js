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
const loggedin = async (req, res) => {
  try {
    if (req.userid) {
      return res.status(201).json(req.userid);
    } else {
      res.status(404).send("User not Loggedin");
    }
  } catch (err) {
    console.log(err);
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
      const [field, order] = req.query.sortBy.split(":");
      sort[field] = order === "desc" ? -1 : 1;
    }
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let options = {
      limit: limit,
      skip: (page - 1) * limit,
    };
    let coustomers = await Coustomer.find(filter, null, options).sort(sort);
    let totalDocuments = await Coustomer.countDocuments(filter);
    let totalPages = Math.ceil(totalDocuments / limit);
    res.status(200).json({
      data: coustomers,
      totalPages: totalPages,
    });
  } catch (err) {
    res.status(502);
    console.log(err);
  }
};
const GetCoustomerById = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    let coustomer;
    if (!isNaN(id)) {
      coustomer = await Coustomer.find({
        $or: [
          { "id": id },
          { "Amount": id },
        ]
      });
    } else {
      coustomer = await Coustomer.find({
        $or: [
          { "Name": { $regex: req.params.id, $options: "i" } },
          { "Address": { $regex: req.params.id, $options: "i" } },
          { "Category": { $regex: req.params.id, $options: "i" } },
          {"Remarks":{$regex: req.params.id, $options: "i" }},
          {"Weight": { $regex: req.params.id, $options:"i"}},
          // { "_id": { $eq: req.params.id }},
        ]
      });
    }
    return res.status(200).send(coustomer);
  } catch (err) {
    res.status(500).send(err);
    console.log(err);
  }
}

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
  loggedin,
};
