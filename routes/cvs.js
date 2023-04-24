const express = require("express");
const { check } = require("express-validator");
const { checkAuth } = require("../middleware/check-auth");
const { fileUpload } = require("../middleware/file-upload");
const cvsControllers = require("../controllers/cvs");
const router = express.Router();
const { getAllCvs, getCvsByUserId, getCvById, createCv, updateCv, deleteCv } =
  cvsControllers;

router.use(checkAuth);

router.get("/", getAllCvs);

router.get("/user/:userId", getCvsByUserId);

router.get("/:cvId", getCvById);

// router.get('/search?', getSearchResults);

router.post(
  "/",
  fileUpload.single("image"),
  // [
  //   check("name").not().isEmpty(),
  //   check("image").not().isEmpty(),
  //   check("author").not().isEmpty(),
  // ],
  createCv
);

router.patch(
  "/:cvId",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("image").not().isEmpty(),
    check("author").not().isEmpty(),
  ],
  updateCv
);

router.delete("/:cvId", deleteCv);

module.exports = router;
