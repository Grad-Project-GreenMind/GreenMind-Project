using GreenMind.Domain.Entities;

namespace GreenMind.Domain.Contracts
{
    public interface IReviewRepository
    {
        Task AddAsync(Review review);
        Task<List<Review>> GetAllAsync(int limit);
    }
}