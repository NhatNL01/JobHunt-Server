const express = require("express");
const { check } = require("express-validator");
const { checkAuth } = require("../middleware/check-auth");
const { fileUpload } = require("../middleware/file-upload");
const companiesControllers = require("../controllers/companies");
const router = express.Router();
const {
  getAllCompanies,
  getCompanyById,
  getSearchResults,
  createCompany,
  addMenberToCompany,
  updateCompany,
  deleteCompany,
} = companiesControllers;

router.get("/search?", getSearchResults);

router.get("/", getAllCompanies);

router.get("/:companyId", getCompanyById);

router.use(checkAuth);

router.post(
  "/",
  fileUpload.single("avatar"),
  // [
  //   check('title').not().isEmpty(),
  //   check('body').not().isEmpty(),
  //   check('tags').not().isEmpty(),
  //   check('titleURL').not().isEmpty(),
  //   check('author').not().isEmpty(),
  // ],
  createCompany
);

router.patch(
  "/:companyId/add/:memberId",
  // fileUpload.single('image'),
  // [
  //   check('title').not().isEmpty(),
  //   check('body').not().isEmpty(),
  //   check('tags').not().isEmpty(),
  //   check('titleURL').not().isEmpty(),
  // ],
  addMenberToCompany
);

router.patch(
  "/:companyId",
  fileUpload.single("image"),
  // [
  //   check('title').not().isEmpty(),
  //   check('body').not().isEmpty(),
  //   check('tags').not().isEmpty(),
  //   check('titleURL').not().isEmpty(),
  // ],
  updateCompany
);

router.delete("/:companyId", deleteCompany);

module.exports = router;
