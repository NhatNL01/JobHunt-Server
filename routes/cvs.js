const express = require('express');
const { check } = require('express-validator');
const { checkAuth } = require('../middleware/check-auth');
const { fileUpload } = require('../middleware/file-upload');
const cvsControllers = require('../controllers/cvs');
const router = express.Router();
const {
  getAllCvs,
  getCvsByUserId,
  getCvById,
  createCv,
  updateCv,
  deleteCv,
} = cvsControllers;

router.use(checkAuth);

router.get('/', getAllCvs);

router.get('/user/:userId', getCvsByUserId);

router.get('/:cvId', getCvById);

// router.get('/search?', getSearchResults);

router.post(
  '/',
  fileUpload.single('image'),
  // [
  //   check('title').not().isEmpty(),
  //   check('body').not().isEmpty(),
  //   check('tags').not().isEmpty(),
  //   check('titleURL').not().isEmpty(),
  //   check('author').not().isEmpty(),
  // ],
  createCv
);

router.patch(
  '/:cvId',
  fileUpload.single('image'),
  // [
  //   check('title').not().isEmpty(),
  //   check('body').not().isEmpty(),
  //   check('tags').not().isEmpty(),
  //   check('titleURL').not().isEmpty(),
  // ],
  updateCv
);

router.delete('/:cvId', deleteCv);

// router.put('/:postId/like', likePost);

// router.put('/:postId/unlike', unlikePost);

// router.put('/:postId/unicorn', unicornPost);

// router.put('/:postId/ununicorn', ununicornPost);

// router.put('/:jobId/bookmark', bookmarkJob);

// router.put('/:jobId/unbookmark', unbookmarkJob);

module.exports = router;
