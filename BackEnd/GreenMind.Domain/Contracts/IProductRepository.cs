using GreenMind.Domain.Entities;

namespace GreenMind.Domain.Contracts
{
    public interface IProductRepository
    {
        Task<IEnumerable<Product>> GetAllAsync();

        IQueryable<Product> GetProductsWithCategories();

    }
}
