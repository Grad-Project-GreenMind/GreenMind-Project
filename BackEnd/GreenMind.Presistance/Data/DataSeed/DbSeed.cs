using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using System.Threading.Tasks;

namespace GreenMind.Presistance.Data
{
    public static class DbSeed
    {
        public static async Task SeedReviewsAsync(ApplicationDbContext context)
        {
            if (context.Reviews.Any()) return;

            context.Reviews.AddRange(
                new Review
                {
                    Name = "Ahmed Ali",
                    Phone = "01000000000",
                    Email = "ahmed@test.com",
                    Position = "Developer",
                    Comment = "Great service!"
                },
                new Review
                {
                    Name = "Sara Mohamed",
                    Phone = "01111111111",
                    Email = "sara@test.com",
                    Position = "Designer",
                    Comment = "Amazing experience!"
                }
            );

            await context.SaveChangesAsync();
        }
    }
}