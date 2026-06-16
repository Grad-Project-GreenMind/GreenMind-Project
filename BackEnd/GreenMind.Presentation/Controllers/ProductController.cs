using GreenMind.ServiceAbstraction.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GreenMind.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? category, [FromQuery] string? search)
        {
            var products = await _productService.GetProductsAsync(category, search);
            return Ok(products);
        }
    }
}