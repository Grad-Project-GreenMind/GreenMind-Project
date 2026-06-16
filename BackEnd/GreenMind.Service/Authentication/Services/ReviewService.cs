using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using GreenMind.ServiceAbstraction.DTOs;
using GreenMind.ServiceAbstraction.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace GreenMind.Service.Services
{
    public class ReviewService : IReviewService
    {
        private readonly ApplicationDbContext _context;

        public ReviewService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddReviewAsync(CreateReviewDto dto)
        {
            var defaultUser = await _context.Users.FirstOrDefaultAsync();
            var defaultProduct = await _context.Products.FirstOrDefaultAsync();

            if (defaultUser == null || defaultProduct == null)
            {
                throw new Exception("Cannot save review: Database must have at least one User and one Product to satisfy constraints.");
            }

            var review = new Review
            {
                Name = dto.Name?.Trim() ?? string.Empty,
                Phone = dto.Phone?.Trim() ?? string.Empty,
                Email = dto.Email?.Trim().ToLower() ?? string.Empty,
                Position = string.IsNullOrWhiteSpace(dto.Position) ? null : dto.Position.Trim(),

                Comment = WebUtility.HtmlEncode(dto.Message?.Trim() ?? string.Empty),

                ReviewDate = DateTime.UtcNow,
                UserId = defaultUser.Id,
                ProductId = defaultProduct.Id
            };

            try
            {
                await _context.Reviews.AddAsync(review);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                throw new Exception("An error occurred while saving the review to the database.", ex);
            }
        }

        public async Task<List<ReviewResponseDto>> GetReviewsAsync(int? limit)
        {
            var query = _context.Reviews
                .Include(r => r.User)
                .OrderByDescending(r => r.ReviewDate)
                .AsQueryable();

            if (limit.HasValue && limit.Value > 0)
            {
                query = query.Take(limit.Value);
            }

            return await query
                .Select(r => new ReviewResponseDto
                {
                    Id = r.Id,
                    Name = r.User.Name,
                    Position = r.Position,
                    Message = r.Comment,
                    UserImage = r.User.ProfilePic,
                    CreatedAt = r.ReviewDate
                })
                .ToListAsync();
        }
    }
}