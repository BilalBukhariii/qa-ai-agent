import TestCase from "../models/TestCase.js";

export const getTestCases = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.ticket) filter.ticket = req.query.ticket;

    const testCases = await TestCase.find(filter)
      .populate("ticket", "title jiraId type")
      .sort({ createdAt: -1 });
    res.json(testCases);
  } catch (error) {
    next(error);
  }
};

export const getTestCaseById = async (req, res, next) => {
  try {
    const testCase = await TestCase.findById(req.params.id).populate("ticket");
    if (!testCase) {
      res.status(404);
      throw new Error("Test case not found");
    }
    res.json(testCase);
  } catch (error) {
    next(error);
  }
};

export const createTestCase = async (req, res, next) => {
  try {
    const testCase = await TestCase.create(req.body);
    res.status(201).json(testCase);
  } catch (error) {
    next(error);
  }
};

export const updateTestCase = async (req, res, next) => {
  try {
    const testCase = await TestCase.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!testCase) {
      res.status(404);
      throw new Error("Test case not found");
    }
    res.json(testCase);
  } catch (error) {
    next(error);
  }
};

export const deleteTestCase = async (req, res, next) => {
  try {
    const testCase = await TestCase.findByIdAndDelete(req.params.id);
    if (!testCase) {
      res.status(404);
      throw new Error("Test case not found");
    }
    res.json({ message: "Test case removed" });
  } catch (error) {
    next(error);
  }
};
