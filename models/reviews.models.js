const { response } = require("express");
const db = require("../db/connection");
const { reviewData } = require("../db/data/test-data");

const allowedColumns = Object.keys(reviewData[0]);
allowedColumns.push("comment_count");

const rejectWrongQuery = (method) => {
  return Promise.reject({ status: 400, msg: `Invalid ${method} query` });
};
const rejectWrongData = () => {
  return Promise.reject({ status: 404, msg: "Not found" });
};

exports.selectReviewById = async (review_id) => {
  const { rows } = await db.query(
    `SELECT reviews.*, COUNT(comment_id) AS comment_count
    FROM reviews 
    LEFT JOIN users ON users.username = reviews.owner
    LEFT JOIN comments ON comments.review_id = reviews.review_id
    WHERE reviews.review_id = $1
    GROUP BY reviews.review_id;`,
    [review_id]
  );
  if (rows.length === 0) {
    return rejectWrongData();
  }
  return rows;
};

exports.updateReview = async (review_id, inc_votes) => {
  if (!inc_votes) return Promise.reject({ status: 400, msg: "Malformed body" });
  const { rows } = await db.query(
    `UPDATE reviews
  SET
    votes = votes + $2
  WHERE review_id = $1
  RETURNING *`,
    [review_id, inc_votes]
  );
  if (rows.length === 0) {
    return rejectWrongData();
  }
  return rows;
};

exports.selectReviews = async (
  sort_by = "created_at",
  order = "desc",
  category
) => {
  if (!allowedColumns.includes(sort_by)) return rejectWrongQuery("sort");
  if (!["asc", "desc"].includes(order)) return rejectWrongQuery("order");

  let allowedCategories = [];
  if (category) {
    categories = await db.query(`SELECT slug FROM categories`);
    allowedCategories = categories.rows.map((category) => category.slug);
    if (!allowedCategories.includes(category))
      return rejectWrongQuery("category");
  }

  let queryValues = [];
  let queryStr = `SELECT reviews.*, COUNT(comment_id) AS comment_count
  FROM reviews 
  LEFT JOIN users ON users.username = reviews.owner
  LEFT JOIN comments ON comments.review_id = reviews.review_id`;

  if (category) {
    queryStr += ` WHERE reviews.category = $1`;
    queryValues.push(category);
  }

  queryStr += ` GROUP BY reviews.review_id
  ORDER BY reviews.${sort_by} ${order};`;

  const { rows } = await db.query(queryStr, queryValues);
  if (rows.length === 0) {
    if (allowedCategories.includes(category)) return [];
    return rejectWrongData();
  }
  return rows;
};