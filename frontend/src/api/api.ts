import type { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  Product, 
  SizeConfiguration,
  Category, 
  ProductVariant, 
  ProductImage, 
  Cart, 
  CartItem, 
  Order, 
  Address,
  PaginatedResponse,
  ApiError 
} from './types';

const API_BASE_URL = 'http://localhost:8000/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    this.token = localStorage.getItem('access_token');
  }

  private saveToken(token: string) {
    localStorage.setItem('access_token', token);
    this.token = token;
  }

  private saveRefreshToken(token: string) {
    localStorage.setItem('refresh_token', token);
  }

  private removeTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.token = null;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const defaultHeaders: HeadersInit = {};

    // Don't set Content-Type for FormData, let browser set it
    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    if (this.token) {
      defaultHeaders.Authorization = `Bearer ${this.token}`;
      console.log('Sending token:', this.token.substring(0, 10) + '...')
    } else {
      console.log('No token available for request to:', endpoint)
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshToken();
          if (refreshed && this.token) {
            // Retry with new token
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${this.token}`,
            };
            const retryResponse = await fetch(url, config);
            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
          // If refresh failed or retry failed, logout
          this.removeTokens();
          window.location.href = '/login';
          throw new Error('Sesi�n expirada');
        }

        let errorData: { [key: string]: unknown } = {};
        try {
          errorData = await response.json();
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
        }

        // Handle Django REST framework error format first
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors[0] as string;
        } else if (errorData.message && typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        }

        // Include field-specific errors in the message for debugging
        const fieldErrors = errorData as { [key: string]: string[] };
        const fieldErrorMessages: string[] = [];
        Object.keys(fieldErrors).forEach(field => {
          if (field !== 'non_field_errors' && field !== 'message' && Array.isArray(fieldErrors[field])) {
            fieldErrorMessages.push(`${field}: ${fieldErrors[field].join(', ')}`);
          }
        });
        
        if (fieldErrorMessages.length > 0) {
          errorMessage += ` - ${fieldErrorMessages.join(' | ')}`;
        }

        const error: ApiError = {
          message: errorMessage,
          errors: fieldErrors || {}
        };
        
        throw error;
      }

      // Don't try to parse JSON if there's no content
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return {} as T;
    } catch (error) {
      if (error instanceof Error || (error && typeof error === 'object' && 'message' in error)) {
        throw error;
      }
      throw new Error('Error de conexión');
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.saveToken(data.access);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Generic HTTP Methods
  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.saveToken(response.access);
    this.saveRefreshToken(response.refresh);
    
    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.saveToken(response.access);
    this.saveRefreshToken(response.refresh);
    
    return response;
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await this.makeRequest('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch {
        // Ignore logout errors
      }
    }
    this.removeTokens();
  }

  async getCurrentUser(): Promise<User> {
    return await this.makeRequest<User>('/auth/user/');
  }

  // Product Methods
  async getProducts(page = 1, category?: number, search?: string): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (category) params.append('category', category.toString());
    if (search) params.append('search', search);
    
    // Add cache busting parameter to avoid stale data
    params.append('_t', Date.now().toString());

    return await this.makeRequest<PaginatedResponse<Product>>(
      `/catalog/products/?${params.toString()}`
    );
  }

  async getProduct(id: number): Promise<Product> {
    return await this.makeRequest<Product>(`/catalog/products/${id}/`);
  }

  async getProductVariants(productId: number): Promise<ProductVariant[]> {
    return await this.makeRequest<ProductVariant[]>(`/catalog/products/${productId}/variants/`);
  }

  async getProductImages(productId: number): Promise<ProductImage[]> {
    return await this.makeRequest<ProductImage[]>(`/catalog/products/${productId}/images/`);
  }

  // Category Methods
  async getCategories(): Promise<Category[]> {
    const response = await this.makeRequest<PaginatedResponse<Category>>('/catalog/categories/');
    return response.results;
  }

  // Admin Methods - Category Management
  async getAdminCategories(): Promise<Category[]> {
    const response = await this.makeRequest<PaginatedResponse<Category>>('/catalog/categories/');
    return response.results;
  }

  async createCategory(categoryData: {
    name: string;
    description?: string;
    is_active?: boolean;
  }): Promise<Category> {
    return await this.makeRequest<Category>('/catalog/categories/', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  }

  async updateCategory(categoryId: number, categoryData: Partial<Category>): Promise<Category> {
    return await this.makeRequest<Category>(`/catalog/categories/${categoryId}/`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
  }

  async deleteCategory(categoryId: number): Promise<void> {
    await this.makeRequest(`/catalog/categories/${categoryId}/`, {
      method: 'DELETE'
    });
  }

  // Admin Methods - Size Management  
  async getAdminSizes(): Promise<SizeConfiguration[]> {
    const response = await this.makeRequest<PaginatedResponse<SizeConfiguration>>('/catalog/sizes/');
    return response.results;
  }

  async createSize(sizeData: {
    code: string;
    name: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<SizeConfiguration> {
    return await this.makeRequest<SizeConfiguration>('/catalog/sizes/', {
      method: 'POST',
      body: JSON.stringify(sizeData)
    });
  }

  async updateSize(sizeId: number, sizeData: Partial<SizeConfiguration>): Promise<SizeConfiguration> {
    return await this.makeRequest<SizeConfiguration>(`/catalog/sizes/${sizeId}/`, {
      method: 'PUT',
      body: JSON.stringify(sizeData)
    });
  }

  async deleteSize(sizeId: number): Promise<void> {
    await this.makeRequest(`/catalog/sizes/${sizeId}/`, {
      method: 'DELETE'
    });
  }

  // Cart Methods
  async getCart(): Promise<Cart> {
    return await this.makeRequest<Cart>('/orders/cart/current/');
  }

  async addToCart(productVariantId: number, quantity: number): Promise<CartItem> {
    return await this.makeRequest<CartItem>('/orders/cart-items/', {
      method: 'POST',
      body: JSON.stringify({
        product_variant_id: productVariantId,
        quantity,
      }),
    });
  }

  async updateCartItem(itemId: number, quantity: number): Promise<CartItem> {
    return await this.makeRequest<CartItem>(`/orders/cart-items/${itemId}/update_quantity/`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(itemId: number): Promise<void> {
    await this.makeRequest(`/orders/cart-items/${itemId}/`, {
      method: 'DELETE',
    });
  }

  async clearCart(): Promise<void> {
    await this.makeRequest('/orders/cart/clear/', {
      method: 'POST',
    });
  }

  // Order Methods
  async getOrders(): Promise<PaginatedResponse<Order>> {
    return await this.makeRequest<PaginatedResponse<Order>>('/orders/orders/');
  }

  async getOrder(id: number): Promise<Order> {
    return await this.makeRequest<Order>(`/orders/orders/${id}/`);
  }

  async createOrder(addressId: number): Promise<Order> {
    return await this.makeRequest<Order>('/orders/orders/', {
      method: 'POST',
      body: JSON.stringify({
        shipping_address: addressId,
      }),
    });
  }

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    return await this.makeRequest<Order>(`/orders/orders/${orderId}/update_status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async processCheckout(orderData: {
    shipping_address: {
      street_address: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    payment_method: {
      type: string;
      last_four: string;
      card_brand: string;
    };
    items: {
      product_variant_id: number;
      quantity: number;
      unit_price: number;
    }[];
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
  }): Promise<{ message: string; order: Order }> {
    return await this.makeRequest<{ message: string; order: Order }>('/orders/orders/process_checkout/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Address Methods
  async getAddresses(): Promise<Address[]> {
    return await this.makeRequest<Address[]>('/customers/addresses/');
  }

  async createAddress(address: Omit<Address, 'id' | 'user'>): Promise<Address> {
    return await this.makeRequest<Address>('/customers/addresses/', {
      method: 'POST',
      body: JSON.stringify(address),
    });
  }

  async updateAddress(id: number, address: Partial<Address>): Promise<Address> {
    return await this.makeRequest<Address>(`/customers/addresses/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(address),
    });
  }

  async deleteAddress(id: number): Promise<void> {
    await this.makeRequest(`/customers/addresses/${id}/`, {
      method: 'DELETE',
    });
  }

  // Admin Methods - User Management
  async getAdminUsers(page = 1): Promise<PaginatedResponse<User>> {
    return await this.makeRequest<PaginatedResponse<User>>(
      `/customers/admin/users/?page=${page}`
    );
  }

  async activateUser(userId: number): Promise<{ message: string }> {
    return await this.makeRequest<{ message: string }>(
      `/customers/admin/users/${userId}/activate/`,
      { method: 'POST' }
    );
  }

  async deactivateUser(userId: number): Promise<{ message: string }> {
    return await this.makeRequest<{ message: string }>(
      `/customers/admin/users/${userId}/deactivate/`,
      { method: 'POST' }
    );
  }

  async deleteUser(userId: number): Promise<void> {
    await this.makeRequest(`/customers/admin/users/${userId}/`, {
      method: 'DELETE'
    });
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    return await this.makeRequest<User>(`/customers/admin/users/${userId}/`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async getUserStats(): Promise<{
    total_users: number;
    active_users: number;
    inactive_users: number;
    staff_users: number;
  }> {
    return await this.makeRequest('/customers/admin/users/stats/');
  }

  // Admin Methods - Product Management
  async getAdminProducts(page = 1): Promise<PaginatedResponse<Product>> {
    return await this.makeRequest<PaginatedResponse<Product>>(
      `/catalog/admin/products/?page=${page}`
    );
  }

  async toggleProductActive(productId: number): Promise<{ message: string }> {
    return await this.makeRequest<{ message: string }>(
      `/catalog/admin/products/${productId}/toggle_active/`,
      { method: 'POST' }
    );
  }

  async toggleProductFeatured(productId: number): Promise<{ message: string }> {
    return await this.makeRequest<{ message: string }>(
      `/catalog/admin/products/${productId}/toggle_featured/`,
      { method: 'POST' }
    );
  }

  async getProductStats(): Promise<{
    total_products: number;
    active_products: number;
    inactive_products: number;
    featured_products: number;
    total_variants: number;
    out_of_stock: number;
    low_stock: number;
  }> {
    return await this.makeRequest('/catalog/admin/products/stats/');
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await this.makeRequest('/catalog/admin/products/low_stock/');
  }

  async createProduct(productData: {
    name: string;
    description?: string;
    category: number;
    price: string;
    sku?: string;
    is_active?: boolean;
    is_featured?: boolean;
  }): Promise<Product> {
    return await this.makeRequest<Product>('/catalog/admin/products/', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async updateProduct(productId: number, productData: {
    name?: string;
    description?: string;
    category?: number;
    price?: string;
    sku?: string;
    is_active?: boolean;
    is_featured?: boolean;
  }): Promise<Product> {
    return await this.makeRequest<Product>(`/catalog/admin/products/${productId}/`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }


  async deleteProduct(productId: number): Promise<void> {
    await this.makeRequest(`/catalog/admin/products/${productId}/`, {
      method: 'DELETE'
    });
  }

  // Product Image Methods
  async uploadProductImage(productId: number, imageFile: File, altText?: string, isMain?: boolean): Promise<ProductImage> {
    if (!productId) {
      throw new Error('Product ID is required for image upload');
    }
    
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('product', String(productId));
    if (altText) formData.append('alt_text', altText);
    if (isMain !== undefined) formData.append('is_main', String(isMain));

    return await this.makeRequest<ProductImage>('/catalog/product-images/', {
      method: 'POST',
      body: formData
    });
  }

  async updateProductImage(imageId: number, altText?: string, isMain?: boolean): Promise<ProductImage> {
    const data: Record<string, unknown> = {};
    if (altText !== undefined) data.alt_text = altText;
    if (isMain !== undefined) data.is_main = isMain;

    return await this.makeRequest<ProductImage>(`/catalog/product-images/${imageId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteProductImage(imageId: number): Promise<void> {
    await this.makeRequest(`/catalog/product-images/${imageId}/`, {
      method: 'DELETE'
    });
  }

  async setMainProductImage(imageId: number): Promise<{ message: string }> {
    return await this.makeRequest<{ message: string }>(`/catalog/product-images/${imageId}/set_main/`, {
      method: 'POST'
    });
  }

  // Product Variant Methods
  async createProductVariant(productId: number, variantData: {
    size: string;
    color: string;
    stock_quantity: number;
    price_adjustment?: number;
  }): Promise<ProductVariant> {
    return await this.makeRequest<ProductVariant>('/catalog/variants/', {
      method: 'POST',
      body: JSON.stringify({
        product: productId,
        ...variantData
      })
    });
  }

  async updateProductVariant(variantId: number, variantData: Partial<{
    size: string;
    color: string;
    stock_quantity: number;
    price_adjustment: number;
  }>): Promise<ProductVariant> {
    return await this.makeRequest<ProductVariant>(`/catalog/variants/${variantId}/`, {
      method: 'PATCH',
      body: JSON.stringify(variantData)
    });
  }

  async deleteProductVariant(variantId: number): Promise<void> {
    await this.makeRequest(`/catalog/variants/${variantId}/`, {
      method: 'DELETE'
    });
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;