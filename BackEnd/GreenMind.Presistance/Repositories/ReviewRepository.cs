using GreenMind.Domain.Contracts;
using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using Microsoft.EntityFrameworkCore;

namespace GreenMind.Presistance.Repositories
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly ApplicationDbContext _context;
        public ReviewRepository(ApplicationDbContext context) => _context = context;

        public async Task AddAsync(Review review)
        {
            await _context.Reviews.AddAsync(review);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Review>> GetAllAsync(int limit)
        {
            return await _context.Reviews
                .OrderByDescending(r => r.ReviewDate)
                .Take(limit)
                .ToListAsync();
        }
    }
}