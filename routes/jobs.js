const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../middleware/check-auth');
const { fileUpload } = require('../middleware/file-upload');
const jobsControllers = require('../controllers/jobs');
const router = express.Router();
const {
  getAllJobs,
  getJobsByUserId,
  getJobsByCompanyId,
  getJobById,
  getSearchResults,
  createJob,
  updateJob,
  deletejob,
  unbookmarkJob,
  bookmarkJob,
} = jobsControllers;

router.get('/search?', getSearchResults);

router.get('/', getAllJobs);

router.get('/user/:userId', getJobsByUserId);

router.get('/company/:companyId', getJobsByCompanyId);

router.get('/:jobId', getJobById);

router.use(checkAuth);

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
  createJob
);

router.patch(
  '/:jobId',
  // fileUpload.single('image'),
  // [
  //   check('title').not().isEmpty(),
  //   check('body').not().isEmpty(),
  //   check('tags').not().isEmpty(),
  //   check('titleURL').not().isEmpty(),
  // ],
  updateJob
);

router.delete('/:jobId', deletejob);

router.put('/:jobId/bookmark', bookmarkJob);

router.put('/:jobId/unbookmark', unbookmarkJob);

module.exports = router;
