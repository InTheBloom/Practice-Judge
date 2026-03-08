// /api/submissions

const express = require('express');
const { db } = require('./db.js');

const submissionsRouter = express.Router({ mergeParams: true });
module.exports = { submissionsRouter };

