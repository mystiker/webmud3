/**
 * A utility type that makes specified keys in a given type required.
 *
 * @template T - The original type.
 * @template K - The keys within T that should be required.
 *
 * @property {T} - The original type.
 * @property {Object} - An object where the specified keys are required.
 *
 * @example
 * // Define an interface with optional properties
 * interface User {
 *   id?: number;
 *   name?: string;
 *   age?: number;
 * }
 *
 * // Use WithRequired to make 'id' and 'name' required
 * type UserWithRequiredIdAndName = WithRequired<User, 'id' | 'name'>;
 *
 * // Now 'id' and 'name' are required, but 'age' is still optional
 * const user1: UserWithRequiredIdAndName = {
 *   id: 1,
 *   name: 'John Doe'
 * };
 *
 * const user2: UserWithRequiredIdAndName = {
 *   id: 2,
 *   name: 'Jane Doe',
 *   age: 30
 * };
 *
 * // The following would cause a TypeScript error because 'id' and 'name' are required
 * const user3: UserWithRequiredIdAndName = {
 *   name: 'John Doe'
 * };
 *
 * @example
 * // Define another interface with optional properties
 * interface Product {
 *   id?: string;
 *   name?: string;
 *   price?: number;
 *   description?: string;
 * }
 *
 * // Use WithRequired to make 'id' required
 * type ProductWithRequiredId = WithRequired<Product, 'id'>;
 *
 * // Now 'id' is required, but 'name', 'price', and 'description' are still optional
 * const product1: ProductWithRequiredId = {
 *   id: 'abc123'
 * };
 *
 * const product2: ProductWithRequiredId = {
 *   id: 'xyz789',
 *   name: 'Gadget',
 *   price: 99.99,
 *   description: 'A useful gadget'
 * };
 *
 * // The following would cause a TypeScript error because 'id' is required
 * const product3: ProductWithRequiredId = {
 *   name: 'Gadget',
 *   price: 99.99
 * };
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
