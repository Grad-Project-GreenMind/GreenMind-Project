using GreenMind.Presistance.Data.DbContexts;
using GreenMind.ServiceAbstraction.DTOs;
using GreenMind.ServiceAbstraction.Interfaces;
using Microsoft.EntityFrameworkCore;


namespace GreenMind.Service.Services
{
    public class ArticleService : IArticleService
    {
        private readonly ApplicationDbContext _context;

        public ArticleService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ArticlesPageDto> GetArticlesPageAsync()
        {
            var articles = await _context.Articles
                .OrderByDescending(x => x.IsFeatured)
                .ThenByDescending(x => x.CreatedAt)
                .ToListAsync();

            string Limit(string text)
            {
                if (string.IsNullOrEmpty(text))
                    return "";

                return text.Length <= 150 ? text : text[..150] + "...";
            }

            if (!articles.Any())
            {
                return new ArticlesPageDto
                {
                    FeaturedArticle = new ArticleCardDto
                    {
                        Id = 0,
                        Title = "No Articles Yet",
                        Description = "There are no articles available right now.",
                        ImageUrl = "",
                        Url = ""
                    },
                    AllArticles = new List<ArticleCardDto>()
                };
            }

            var featured = articles.FirstOrDefault(x => x.IsFeatured)
                           ?? articles.First();

            var featuredDto = new ArticleCardDto
            {
                Id = featured.Id,
                Title = featured.Title,
                Description = Limit(featured.Description),
                ImageUrl = featured.ImageUrl,

                Url = !string.IsNullOrEmpty(featured.ExternalUrl)
                    ? featured.ExternalUrl
                    : $"/articles/{featured.Id}"
            };

            var allArticlesDto = articles
                .Where(x => x.Id != featured.Id)
                .Select(x => new ArticleCardDto
                {
                    Id = x.Id,
                    Title = x.Title,
                    Description = Limit(x.Description),
                    ImageUrl = x.ImageUrl,

                    Url = !string.IsNullOrEmpty(x.ExternalUrl)
                        ? x.ExternalUrl
                        : $"/articles/{x.Id}"
                })
                .ToList();

            return new ArticlesPageDto
            {
                FeaturedArticle = featuredDto,
                AllArticles = allArticlesDto
            };
        }

        public async Task<ArticleCardDto?> GetByIdAsync(int id)
        {
            var article = await _context.Articles
                .FirstOrDefaultAsync(x => x.Id == id);

            if (article == null)
                return null;

            return new ArticleCardDto
            {
                Id = article.Id,
                Title = article.Title,
                Description = article.Description,
                ImageUrl = article.ImageUrl,

                Url = !string.IsNullOrEmpty(article.ExternalUrl)
                    ? article.ExternalUrl
                    : $"/articles/{article.Id}"
            };
        }
    }
}