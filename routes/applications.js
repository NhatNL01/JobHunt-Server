const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../middleware/check-auth');
const { fileUpload } = require('../middleware/file-upload');
const applicationsControllers = require('../controllers/applications');
const router = express.Router();
const {
  getAllApplications,
  getApplicationsByUserId,
  getApplicationById,
  createApplication,
  deleteApplication,
  getApplicationsByJobId
} = applicationsControllers;

router.use(checkAuth);

router.get('/', getAllApplications);

router.get('/user/:userId', getApplicationsByUserId);

router.get('/job/:jobId', getApplicationsByJobId);

router.get('/:applicationId', getApplicationById);

router.post(
  '/',
  // fileUpload.single('image'),
  // [
  //   check('title').not().isEmpty(),
  //   check('body').not().isEmpty(),
  //   check('tags').not().isEmpty(),
  //   check('titleURL').not().isEmpty(),
  //   check('author').not().isEmpty(),
  // ],
  createApplication
);

router.delete('/:applicationId', deleteApplication);

module.exports = router;
