using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;

namespace GreenMind.Presistance.Data.Seed
{
    public static class ArticleSeeder
    {
        public static void Seed(ApplicationDbContext context)
        {
            if (context.Articles.Any())
                return;

            context.Articles.AddRange(
                new Article
                {
                    Title = "Modern Farming Techniques",
                    Description = "Learn about modern agriculture and smart farming methods.",
                    ImageUrl = "https://www.fao.org/uploads/RTEmagicC_WM3.jpg.jpg",
                    ExternalUrl = "https://www.fao.org/land-water/water/water-management/en/",
                    IsFeatured = true,
                    CreatedAt = DateTime.Now
                },
         new Article
         {
             Title = "Global Agriculture Development (World Bank)",
             Description = "How agriculture supports global development and economy.",
             ImageUrl = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
             ExternalUrl = "https://www.worldbank.org/en/topic/agriculture/overview",
             IsFeatured = false,
             CreatedAt = DateTime.Now
         },
        new Article
        {
            Title = "Smart Agriculture with AI",
            Description = "How AI is transforming agriculture and crop production.",
            ImageUrl = "https://images.unsplash.com/photo-1586771107445-d3ca888129ff",
            ExternalUrl = "https://www.fao.org/digital-agriculture/en/",
            IsFeatured = false,
            CreatedAt = DateTime.Now
        },
         new Article
         {
             Title = "7 Applications of AI in Agriculture | 2024 Updated",
             Description = "AI in agriculture profoundly influences these seven essential fields, showcasing its versatility and impact..",
             ImageUrl = "https://static.wixstatic.com/media/4c4fd6_a7ddcb3331254013958c48b326f2981e~mv2.jpg/v1/fill/w_700,h_394,al_c,q_90,enc_avif,quality_auto/4c4fd6_a7ddcb3331254013958c48b326f2981e~mv2.jpg",
             ExternalUrl = "https://www.basic.ai/blog-post/7-applications-of-ai-in-agriculture?utm_source=chatgpt.com",
             IsFeatured = false,
             CreatedAt = DateTime.Now
         },
           new Article
           {
               Title = "Sustainable Farming & Agriculture Articles",
               Description = "AI in agriculture profoundly influences these seven essential fields, showcasing its versatility and impact..",
               ImageUrl = "https://ogden_images.s3.amazonaws.com/www.motherearthnews.com/images/2021/01/17151949/AdobeStock_187309336-750x500.jpeg",
               ExternalUrl = "https://www.motherearthnews.com/homesteading-and-livestock/sustainable-farming/?utm_source=chatgpt.com",
               IsFeatured = false,
               CreatedAt = DateTime.Now
           },
            new Article
            {
                Title = "Agriculture Net website",
                Description = "This content aimed at all segments of society, focusing on agriculture and the environment.",
                ImageUrl = "https://cdn.prod.website-files.com/66604a97df59732aab43fcc8/66d08e5c47c0fdcef8938eed_artificial-intelligence.webp",
                ExternalUrl = "https://www.zira3a.net/",
                IsFeatured = false,
                CreatedAt = DateTime.Now
            },
             new Article
             {
                 Title = "How to Make Your Farm Friendly for Wildlife",
                 Description = "This Massachusetts horse-farming couple wanted to learn how to make your farm friendly for wildlife so they could grow food and welcome wild animals",
                 ImageUrl = "https://ogden_images.s3.amazonaws.com/www.motherearthnews.com/images/2025/02/25092243/how-to-make-your-farm-friendly-for-wildlife-1089x840.jpg",
                 ExternalUrl = "https://www.motherearthnews.com/homesteading-and-livestock/wildlife-garden-zmaz09jjzraw/",
                 IsFeatured = false,
                 CreatedAt = DateTime.Now
             }


            );

            context.SaveChanges();
        }
    }
}