using GreenMind.ServiceAbstraction.DTOs;

namespace GreenMind.ServiceAbstraction.Interfaces
{
    public interface IProductService
    {
       
        Task<IEnumerable<ProductDto>> GetProductsAsync(string? category, string? search);
    }
}