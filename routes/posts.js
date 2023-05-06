const express = require("express");
const { check } = require("express-validator");
const { checkAuth, authorize } = require("../middleware/check-auth");
const { fileUpload } = require("../middleware/file-upload");
const postsControllers = require("../controllers/posts");
const router = express.Router();
const {
  getAllPosts,
  getAllPostsPaginate,
  getPostsByUserId,
  getPostsByType,
  getPostsByTypeAndUserId,
  getPostsByTypeAndUserIdsofCompanyId,
  getPostById,
  getSearchResults,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  unicornPost,
  ununicornPost,
  unbookmarkPost,
  bookmarkPost,
} = postsControllers;

router.get("/", getAllPostsPaginate);

router.get("/all", getAllPosts);

router.get("/user/:userId", getPostsByUserId);

router.get("/type/:postType", getPostsByType);

router.get("/type/job/user/:userId", getPostsByTypeAndUserId);

router.get("/type/job/company/:companyId", getPostsByTypeAndUserIdsofCompanyId);

router.get("/:titleURL/:postId", getPostById);

router.get("/search?", getSearchResults);

router.use(checkAuth);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("body").not().isEmpty(),
    check("tags").not().isEmpty(),
    check("titleURL").not().isEmpty(),
    check("author").not().isEmpty(),
  ],
  createPost
);

router.patch(
  "/:titleURL/:postId",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("body").not().isEmpty(),
    check("tags").not().isEmpty(),
    check("titleURL").not().isEmpty(),
  ],
  updatePost
);

router.delete("/:titleURL/:postId", deletePost);

router.put("/:postId/like", likePost);

router.put("/:postId/unlike", unlikePost);

router.put("/:postId/unicorn", unicornPost);

router.put("/:postId/ununicorn", ununicornPost);

router.put("/:postId/bookmark", bookmarkPost);

router.put("/:postId/unbookmark", unbookmarkPost);

module.exports = router;
