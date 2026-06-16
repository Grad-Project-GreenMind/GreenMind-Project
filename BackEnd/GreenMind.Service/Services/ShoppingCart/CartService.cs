using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using GreenMind.ServiceAbstraction.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GreenMind.Service.Services.ShoppingCart
{
    public class CartService : ICartService
    {
        private readonly ApplicationDbContext _context;

        public CartService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Cart?> GetCartByUserIdAsync(int userId)
        {
            return   await _context.Carts 
                .Include(c => c.Items)
                .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }

        public async Task AddItemToCartAsync(int userId, int productId, int quantity)
        {
            var cart = await _context.Carts.Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart { UserId = userId };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            var existingItem = cart.Items.FirstOrDefault(ci => ci.ProductId == productId);

            if (existingItem != null)
            {
                existingItem.Quantity += quantity;
            }
            else
            {
                var newItem = new CartItem
                {
                    CartId = cart.Id,
                    ProductId = productId,
                    Quantity = quantity
                };
                _context.CartItems.Add(newItem);
            }
            await _context.SaveChangesAsync();
        }

        public async Task RemoveItemFromCartAsync(int cartItemId)
        {
            var item = await _context.CartItems.FindAsync(cartItemId);
            if (item != null)
            {
                _context.CartItems.Remove(item);
                await _context.SaveChangesAsync();
            }
        }

        public async Task UpdateQuantityAsync(int cartItemId, int newQuantity)
        {
            var item = await _context.CartItems.FindAsync(cartItemId);
            if (item != null && newQuantity > 0)
            {
                item.Quantity = newQuantity;
                await _context.SaveChangesAsync();
            }
        }

        public async Task ClearCartAsync(int userId)
        {
            var cart = await _context.Carts.Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart != null)
            {
                _context.CartItems.RemoveRange(cart.Items);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<decimal> GetCartTotalAsync(int userId)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null) return 0;

            return cart.Items.Sum(item => item.Product.Price * item.Quantity);
        }
    }
}