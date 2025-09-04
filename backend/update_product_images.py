#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.catalog.models import Product, ProductImage

def update_product_images():
    """Update existing products with images"""
    
    # Mapping of product names to image files
    product_image_mapping = {
        'Camiseta Gatuna Clásica': 'products/camiseta1.webp',
        'Collar Gatuno Premium': 'products/collar1.webp',
        'Hoodie Gato Espacial': 'products/saco1.webp',
        'Pantalón Gato Ninja': 'products/pantalon1.webp',
        'Camiseta Gato Vintage': 'products/camiseta1.webp',  # Reusing camiseta image
        'Mochila Gato Kawaii': 'products/collar1.webp',  # Placeholder
    }
    
    print("Updating product images...")
    
    for product_name, image_path in product_image_mapping.items():
        try:
            product = Product.objects.get(name=product_name)
            
            # Delete existing images for this product
            ProductImage.objects.filter(product=product).delete()
            
            # Create new product image
            product_image = ProductImage.objects.create(
                product=product,
                image=image_path,
                alt_text=f"Imagen de {product.name}",
                is_main=True,
                order=1
            )
            
            print(f"[OK] Updated image for: {product.name}")
            
        except Product.DoesNotExist:
            print(f"[ERROR] Product not found: {product_name}")
        except Exception as e:
            print(f"[ERROR] Error updating {product_name}: {str(e)}")
    
    print("\nImage update completed!")

if __name__ == '__main__':
    update_product_images()