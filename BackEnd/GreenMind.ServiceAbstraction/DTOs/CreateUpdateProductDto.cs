using Microsoft.AspNetCore.Http;
namespace GreenMind.ServiceAbstraction.DTOs
{
    public class CreateUpdateProductDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public string CategoryName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public IFormFile? Image { get; set; }
    }
}