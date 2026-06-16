namespace GreenMind.ServiceAbstraction.DTOs
{
    public class ArticleCardDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty; 
    }
}
