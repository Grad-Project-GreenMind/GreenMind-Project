using GreenMind.ServiceAbstraction.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GreenMindAI.Controllers
{
    [Route("articles/api")]
    [ApiController]
    public class ArticlesController : ControllerBase
    {
        private readonly IArticleService _articleService;

        public ArticlesController(IArticleService articleService)
        {
            _articleService = articleService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _articleService.GetArticlesPageAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var article = await _articleService.GetByIdAsync(id);

            if (article == null)
                return NotFound();

            return Ok(article);
        }
    }
}