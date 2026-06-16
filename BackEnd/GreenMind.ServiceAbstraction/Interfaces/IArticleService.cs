using GreenMind.ServiceAbstraction.DTOs;

namespace GreenMind.ServiceAbstraction.Interfaces
{
    public interface IArticleService
    {
        Task<ArticlesPageDto> GetArticlesPageAsync();
        Task<ArticleCardDto?> GetByIdAsync(int id);
    }
}
