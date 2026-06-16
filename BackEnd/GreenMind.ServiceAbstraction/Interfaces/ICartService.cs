using GreenMind.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.ServiceAbstraction.Interfaces
{
    public interface ICartService
    {
        Task<Cart?> GetCartByUserIdAsync(int userId);
        Task AddItemToCartAsync(int userId, int productId, int quantity);
        Task RemoveItemFromCartAsync(int cartItemId);
        Task UpdateQuantityAsync(int cartItemId, int newQuantity);
        Task ClearCartAsync(int userId);
        Task<decimal> GetCartTotalAsync(int userId);
      
    }
}