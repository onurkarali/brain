import { z } from 'zod';

// --- Interfaces ---

interface Product {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly category: ProductCategory;
}

enum ProductCategory {
  Electronics = 'electronics',
  Clothing = 'clothing',
  Books = 'books',
}

// --- Validation ---

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  category: z.nativeEnum(ProductCategory),
});

type CreateProductInput = z.infer<typeof CreateProductSchema>;

// --- Service ---

class ProductService {
  private products: Map<string, Product> = new Map();
  private nextId = 1;

  async create(input: unknown): Promise<Product> {
    const validated = CreateProductSchema.parse(input);
    const product: Product = {
      id: String(this.nextId++),
      ...validated,
    };
    this.products.set(product.id, product);
    return product;
  }

  async findById(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async findAll(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async delete(id: string): Promise<boolean> {
    return this.products.delete(id);
  }
}

export { Product, ProductCategory, ProductService, CreateProductSchema };
