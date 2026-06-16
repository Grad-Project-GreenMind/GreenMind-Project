using GreenMind.Domain.Contracts;
using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using Microsoft.EntityFrameworkCore;

namespace GreenMind.Presistance.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly ApplicationDbContext _context;

        public ProductRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Product>> GetAllAsync()
        {
            return await _context.Products.ToListAsync();
        }

        public IQueryable<Product> GetProductsWithCategories()
        {
            return _context.Products.Include(p => p.Category).AsQueryable();
        }
    }
}