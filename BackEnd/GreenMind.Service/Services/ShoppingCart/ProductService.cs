using GreenMind.Domain.Contracts;
using GreenMind.ServiceAbstraction.DTOs;
using GreenMind.ServiceAbstraction.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GreenMind.Service
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;

        public 
            ProductService(IProductRepository productRepository)
        {
            _productRepository = productRepository;
        }

        public async Task<IEnumerable<ProductDto>> GetProductsAsync(string? category, string? search)
        {
            var query = _productRepository.GetProductsWithCategories();

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(p => p.Category.Name.ToLower() == category.ToLower());
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p => p.Name.ToLower().Contains(search.ToLower()));
            }

            return await query.Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                Desc = p.Desc,
                Img = p.Img,
                Category = p.Category.Name
            }).ToListAsync();
        }
    }
}