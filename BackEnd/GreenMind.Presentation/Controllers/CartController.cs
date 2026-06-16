using GreenMind.ServiceAbstraction.DTOs;
using GreenMind.ServiceAbstraction.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims; 
using System.Linq;

namespace GreenMindAI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] 
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                throw new UnauthorizedAccessException("User is not identified.");
            }
            return int.Parse(userIdClaim.Value);
        }

        [HttpGet] 
        public async Task<IActionResult> GetCart()
        {
            int userId = GetUserId();
            var cart = await _cartService.GetCartByUserIdAsync(userId);

            if (cart == null || cart.Items == null)
                return NotFound(new { message = "Cart is empty" });

            var response = new CartDto
            {
                CartItems = cart.Items.Select(i => new CartItemDto
                {
                    Id = i.ProductId,
                    Name = i.Product.Name,
                    Price = i.Product.Price,
                    Img = i.Product.Img,
                    Quantity = i.Quantity
                }).ToList(),

                SubTotal = cart.Items.Sum(i => i.Product.Price * i.Quantity),
                Discount = 100
            };

            response.Total = response.SubTotal - response.Discount > 0
                             ? response.SubTotal - response.Discount
                             : 0;

            return Ok(response);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto request)
        {
            int userId = GetUserId(); 
            await _cartService.AddItemToCartAsync(userId, request.ProductId, request.Quantity);

            return Ok(new { message = "Product added successfully to your cart!" });
        }

        [HttpPut("update-quantity")]
        public async Task<IActionResult> UpdateQuantity(int cartItemId, int newQuantity)
        {
            await _cartService.UpdateQuantityAsync(cartItemId, newQuantity);
            return Ok(new { message = "Quantity updated" });
        }

        [HttpDelete("remove/{cartItemId}")]
        public async Task<IActionResult> RemoveItem(int cartItemId)
        {
            await _cartService.RemoveItemFromCartAsync(cartItemId);
            return Ok(new { message = "Item removed" });
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            int userId = GetUserId(); 
            await _cartService.ClearCartAsync(userId);
            return Ok(new { message = "Cart cleared successfully" });
        }
    }
}