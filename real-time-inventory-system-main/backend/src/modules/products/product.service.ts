import prisma from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";
import type {
  CreateProductInput,
  UpdateProductInput,
} from "./product.schemas.js";

export class ProductService {
  static async createProduct(data: CreateProductInput) {
    const existingProduct = await prisma.product.findUnique({
      where: {
        sku: data.sku,
      },
    });

    if (existingProduct) {
      throw new AppError("SKU already exists", 409);
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        unit: data.unit,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        unit: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return product;
  }

  static async getProducts() {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        unit: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return products;
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        unit: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  }

  static async updateProduct(id: string, data: UpdateProductInput) {
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new AppError("Product not found", 404);
    }

    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (skuExists) {
        throw new AppError("SKU already exists", 409);
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        unit: data.unit,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        unit: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedProduct;
  }

  static async deleteProduct(id: string) {
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new AppError("Product not found", 404);
    }

    await prisma.product.delete({
      where: { id },
    });
  }
}