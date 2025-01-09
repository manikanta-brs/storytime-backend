import Category from "../models/categoryModel.js";
const getCategories = async (req, res, next) => {
  try {
    const category = await Category.find();
    res.status(200).json(category);
  } catch (e) {
    return next(e);
  }
};

export { getCategories };
