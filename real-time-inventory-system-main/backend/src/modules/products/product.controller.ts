import type { Request, Response, NextFunction } from "express";
import {
  createProductSchema,
  updateProductSchema,
} from "./product.schemas";
import { ProductService } from "./product.service";

function getParamId(req: Request) {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

export class ProductController {
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProductSchema.parse(req.body);
      const product = await ProductService.createProduct(data);

      return res.status(201).json({
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const products = await ProductService.getProducts();

      return res.status(200).json({
        products,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const product = await ProductService.getProductById(getParamId(req));

      return res.status(200).json({
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = updateProductSchema.parse(req.body);
      const product = await ProductService.updateProduct(getParamId(req), data);

      return res.status(200).json({
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      await ProductService.deleteProduct(getParamId(req));

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
