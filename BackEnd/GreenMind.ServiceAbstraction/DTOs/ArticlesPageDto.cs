namespace GreenMind.ServiceAbstraction.DTOs
{
    public class ArticlesPageDto
    {
        public ArticleCardDto FeaturedArticle { get; set; } = new();
        public List<ArticleCardDto> AllArticles { get; set; } = new();
    }
}