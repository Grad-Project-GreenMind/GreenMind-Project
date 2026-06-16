using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenMind.Presistance.DataSeed
{
    public class CategorySeed : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> builder)
        {
            builder.HasData(
                new Category { Id = 1, Name = "Seeds", CreatedDate = new DateTime(2026, 1, 1) },
                new Category { Id = 2, Name = "Soil", CreatedDate = new DateTime(2026, 1, 1) },
                new Category { Id = 3, Name = "Tools", CreatedDate = new DateTime(2026, 1, 1) }
             
            );
        }

        public static async Task SeedAsync(ApplicationDbContext context)
        {
            if (!await context.Categories.AnyAsync())
            {
                var categories = new List<Category>
                {
                    new Category { Name = "Seeds", CreatedDate = new DateTime(2026, 1, 1) },
                    new Category { Name = "Soil", CreatedDate = new DateTime(2026, 1, 1) },
                    new Category { Name = "Tools", CreatedDate = new DateTime(2026, 1, 1) },
                 
                };
                await context.Categories.AddRangeAsync(categories);
                await context.SaveChangesAsync();
            }
        }
    }
}