import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { ApiError } from "../utils/ApiError.js";
import { getDbConnectionStatus } from "../config/database.js";
import { memoryStore } from "./memoryStore.js";

export const queryProducts = async (params = {}) => {
  const {
    keyword = "",
    category = "",
    minPrice,
    maxPrice,
    sortBy = "createdAt",
    order = "desc",
    page = 1,
    limit = 12,
    featured,
    bestSeller,
    newArrival,
  } = params;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  if (getDbConnectionStatus()) {
    const filter = { isActive: true };

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { tags: { $in: [new RegExp(keyword, "i")] } },
      ];
    }

    if (category) {
      // Find category by slug or id
      const catDoc = await Category.findOne({
        $or: [{ _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }, { slug: category }],
      });
      if (catDoc) {
        filter.category = catDoc._id;
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && minPrice !== "") filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== "") filter.price.$lte = Number(maxPrice);
    }

    if (featured === "true" || featured === true) filter.isFeatured = true;
    if (bestSeller === "true" || bestSeller === true) filter.isBestSeller = true;
    if (newArrival === "true" || newArrival === true) filter.isNewArrival = true;

    const sortObj = {};
    if (sortBy === "price_asc") sortObj.price = 1;
    else if (sortBy === "price_desc") sortObj.price = -1;
    else if (sortBy === "rating") sortObj.rating = -1;
    else sortObj[sortBy] = order === "asc" ? 1 : -1;

    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum),
      },
    };
  } else {
    // Memory store fallback
    let list = memoryStore.products.filter((p) => p.isActive);

    if (keyword) {
      const q = keyword.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (category) {
      const catObj = memoryStore.categories.find(
        (c) => c._id.toString() === category || c.slug === category
      );
      if (catObj) {
        list = list.filter((p) => p.category.toString() === catObj._id.toString());
      }
    }

    if (minPrice !== undefined && minPrice !== "") {
      list = list.filter((p) => p.price >= Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== "") {
      list = list.filter((p) => p.price <= Number(maxPrice));
    }

    if (featured === "true" || featured === true) list = list.filter((p) => p.isFeatured);
    if (bestSeller === "true" || bestSeller === true) list = list.filter((p) => p.isBestSeller);
    if (newArrival === "true" || newArrival === true) list = list.filter((p) => p.isNewArrival);

    // Sorting
    if (sortBy === "price_asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "name") {
      list.sort((a, b) => (order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    }

    const totalCount = list.length;
    const paginated = list.slice(skip, skip + limitNum).map((p) => {
      const cat = memoryStore.categories.find((c) => c._id.toString() === p.category?.toString());
      return {
        ...p,
        category: cat ? { _id: cat._id, name: cat.name, slug: cat.slug } : p.category,
      };
    });

    return {
      products: paginated,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum),
      },
    };
  }
};

export const getProductById = async (idOrSlug) => {
  if (getDbConnectionStatus()) {
    const isId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
    const filter = isId ? { _id: idOrSlug } : { slug: idOrSlug };
    const product = await Product.findOne(filter).populate("category", "name slug description");
    if (!product) throw new ApiError(404, "Product not found");
    return product;
  } else {
    const product = memoryStore.products.find(
      (p) => p._id.toString() === idOrSlug.toString() || p.slug === idOrSlug
    );
    if (!product) throw new ApiError(404, "Product not found");
    const cat = memoryStore.categories.find((c) => c._id.toString() === product.category?.toString());
    return {
      ...product,
      category: cat ? { _id: cat._id, name: cat.name, slug: cat.slug, description: cat.description } : product.category,
    };
  }
};

export const createProduct = async (productData) => {
  const slug =
    productData.slug ||
    productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  if (getDbConnectionStatus()) {
    return await Product.create({ ...productData, slug });
  } else {
    const newProd = {
      _id: "prod_" + Date.now(),
      ...productData,
      slug,
      rating: 0,
      numReviews: 0,
      createdAt: new Date(),
    };
    memoryStore.products.push(newProd);
    return newProd;
  }
};

export const updateProduct = async (id, updateData) => {
  if (getDbConnectionStatus()) {
    const product = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!product) throw new ApiError(404, "Product not found to update");
    return product;
  } else {
    const idx = memoryStore.products.findIndex((p) => p._id.toString() === id.toString());
    if (idx === -1) throw new ApiError(404, "Product not found to update");
    memoryStore.products[idx] = { ...memoryStore.products[idx], ...updateData };
    return memoryStore.products[idx];
  }
};

export const deleteProduct = async (id) => {
  if (getDbConnectionStatus()) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw new ApiError(404, "Product not found to delete");
    return true;
  } else {
    const idx = memoryStore.products.findIndex((p) => p._id.toString() === id.toString());
    if (idx === -1) throw new ApiError(404, "Product not found to delete");
    memoryStore.products.splice(idx, 1);
    return true;
  }
};

export const getRelatedProducts = async (productId, limit = 4) => {
  const current = await getProductById(productId);
  const catId = typeof current.category === "object" ? current.category._id : current.category;

  if (getDbConnectionStatus()) {
    return await Product.find({
      category: catId,
      _id: { $ne: current._id },
      isActive: true,
    })
      .limit(limit)
      .populate("category", "name slug");
  } else {
    return memoryStore.products
      .filter(
        (p) =>
          p._id.toString() !== current._id.toString() &&
          p.category.toString() === catId.toString() &&
          p.isActive
      )
      .slice(0, limit)
      .map((p) => {
        const cat = memoryStore.categories.find((c) => c._id.toString() === p.category?.toString());
        return { ...p, category: cat ? { _id: cat._id, name: cat.name, slug: cat.slug } : p.category };
      });
  }
};
