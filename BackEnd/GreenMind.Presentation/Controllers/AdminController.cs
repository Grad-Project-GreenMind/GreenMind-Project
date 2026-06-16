using GreenMind.Domain.Entities;
using GreenMind.ServiceAbstraction.DTOs;
using GreenMind.ServiceAbstraction.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GreenMindAI.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminDashboardService _service;

        public AdminController(IAdminDashboardService service)
        {
            _service = service;
        }

        [HttpPost("products")]
        public async Task<IActionResult> CreateProduct([FromForm] CreateUpdateProductDto dto)
        {
            return Ok(await _service.CreateProductAsync(dto));
        }

        [HttpPut("products/{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromForm] CreateUpdateProductDto dto)
        {
            var result = await _service.UpdateProductAsync(id, dto);
            return Ok(result);
        }

        [HttpDelete("products/{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            await _service.DeleteProductAsync(id);
            return Ok(new { message = "Product deleted successfully" });
        }
        [HttpGet("products")]
        public async Task<IActionResult> GetProducts()
        {
            var result = await _service.GetProductsAsync();
            return Ok(result);
        }

        [HttpGet("user-activities")]
        public async Task<IActionResult> GetUserActivities([FromQuery] string? search)
        {
            return Ok(await _service.GetUserActivitiesAsync(search));
        }

        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders()
        {
            return Ok(await _service.GetOrdersAsync());
        }
     
        [HttpGet("home-summary")]
        public async Task<IActionResult> GetHomeSummary()
        {
            var result = await _service.GetHomeSummaryAsync();
            return Ok(result);
        }
    }
}