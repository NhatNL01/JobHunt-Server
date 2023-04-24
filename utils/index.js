const jwt = require("jsonwebtoken");
const DatauriParser = require("datauri/parser");
const parser = new DatauriParser();

const path = require("path");
const { cloudinary } = require("../config/cloudinary");
require("dotenv").config();
const { JWT_KEY } = process.env;

const uploadToCloudinary = async (file) => {
  try {
    const extName = path.extname(file.originalname).toString();
    const file64 = parser.format(extName, file.buffer);
    const uploadedResponse = await cloudinary.uploader.upload(
      file64.content,
      // file,
      {
        upload_preset: "JobHunt",
        resource_type: "auto",
        filename_override: file.originalname,
      }
    );
    return uploadedResponse.url;
  } catch (err) {
    console.log("Cloudinary err:", err);
  }
};

const createJWTtoken = (id, email) => {
  let jwtToken;
  try {
    jwtToken = jwt.sign(
      { userId: id, email: email },
      JWT_KEY,
      { expiresIn: "10h" } //token expires in 1 hr
    );
  } catch (err) {
    console.log(err); //return err ('Signup failed, please try again', 500)
  }
  return jwtToken;
};

exports.uploadToCloudinary = uploadToCloudinary;
exports.createJWTtoken = createJWTtoken;
