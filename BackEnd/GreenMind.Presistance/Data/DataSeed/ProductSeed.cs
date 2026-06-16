using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GreenMind.Presistance.DataSeed
{
    public class ProductSeed : IEntityTypeConfiguration<Product>
    {
        public void Configure(EntityTypeBuilder<Product> builder)
        {
            builder.HasData(
                new Product { Id = 1, CategoryId = 1, Name = "Premium Mint Seeds", Price = 50, Desc = "Refreshing aroma, vibrant leaves. Perfect for teas, cooking, and home gardens. Easy to grow!", Img = "/images/mint-seeds.png" },
                new Product { Id = 2, CategoryId = 1, Name = "Coffee Seeds", Price = 50, Desc = "Grow coffee at home with premium seeds. Cultivate aromatic beans for your daily brew. Perfect for enthusiasts.", Img = "/images/coffee.png" },
                new Product { Id = 3, CategoryId = 1, Name = "Premium Dill Seeds", Price = 50, Desc = "Peppery and aromatic. Fast-growing, easy care. Perfect for pickling, fish, and salads.", Img = "/images/s.png" },
                new Product { Id = 4, CategoryId = 1, Name = "Premium Pea Seeds", Price = 50, Desc = "Fresh, sweet garden peas. Easy to grow, tender, and delicious pods. Enjoy homegrown peas in 60-70 days.", Img = "/images/pea.png" },
                new Product { Id = 5, CategoryId = 1, Name = "Premium Rice Seeds", Price = 50, Desc = "High yield, excellent taste. Ideal for paddy, disease resistant. Perfect for the Egyptian climate.", Img = "/images/ri.png" },
                new Product { Id = 6, CategoryId = 1, Name = "Premium Arugula Seeds", Price = 50, Desc = "Crisp, peppery leaves. Ideal for salads and sandwiches. Fast-growing and rich in vitamins.", Img = "/images/arugula.png" },
                new Product { Id = 7, CategoryId = 1, Name = "Premium White Bean Seeds", Price = 50, Desc = "Rich in protein and fiber. Ideal for healthy Egyptian cooking. Grow fresh beans for soups and stews.", Img = "/images/white-bean.png" },

                new Product { Id = 8, CategoryId = 2, Name = "Organic Seed Starting", Price = 100, Desc = "8 Quarts formula. Specialized for seed germination and cuttings. Approved for organic growing.", Img = "/images/organic-seed.png" },
                new Product { Id = 9, CategoryId = 2, Name = "Potting Mix", Price = 100, Desc = "Available in .75 or 1.5 cubic feet. Formulated for herbs, vegetables, and indoor plants.", Img = "/images/P.png" },
                new Product { Id = 10, CategoryId = 2, Name = "Garden Soil", Price = 100, Desc = "1 Cubic foot. Formulated for flower beds, vegetable gardens, trees, and shrubs. For in-ground use.", Img = "/images/garden-soil.png" },
                new Product { Id = 11, CategoryId = 2, Name = "Composted Manure", Price = 100, Desc = "Enriched with Humus. Available in .75 cubic feet bags for nutrient-rich soil.", Img = "/images/composted-manure.png" },
                new Product { Id = 12, CategoryId = 2, Name = "Potting Soil", Price = 100, Desc = "1 Cubic foot. Ideal for container gardens, hanging baskets, and window boxes.", Img = "/images/potting-soil.png" },

                new Product { Id = 13, CategoryId = 3, Name = "Digging Fork", Price = 200, Img = "/images/Rectangle.png" },
                new Product { Id = 14, CategoryId = 3, Name = "Shovel", Price = 200, Img = "/images/shovel.png" },
                new Product { Id = 15, CategoryId = 3, Name = "Square-Point Shovel", Price = 200, Img = "/images/T.png" },
                new Product { Id = 16, CategoryId = 3, Name = "Watering Can", Price = 200, Img = "/images/watering.png" },
                new Product { Id = 17, CategoryId = 3, Name = "Hand Cultivator", Price = 200, Img = "/images/Hand.png" },
                new Product { Id = 18, CategoryId = 3, Name = "Round-Point Shovel", Price = 200, Img = "/images/point-Shovel.png" }
            );
        }

        public static async Task SeedAsync(ApplicationDbContext context)
        {
            if (!await context.Products.AnyAsync())
            {
                var products = new List<Product>
                {
                    new Product { Id = 1, CategoryId = 1, Name = "Premium Mint Seeds", Price = 50, Desc = "Refreshing aroma...", Img = "/images/mint-seeds.png" },
                   
                };
                await context.Products.AddRangeAsync(products);
                await context.SaveChangesAsync();
            }
        }
    }
}