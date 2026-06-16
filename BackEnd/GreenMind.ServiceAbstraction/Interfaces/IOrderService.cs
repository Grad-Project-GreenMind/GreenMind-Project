using GreenMind.ServiceAbstraction.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.ServiceAbstraction.Interfaces
{
    public interface IOrderService
    {
        
        Task<int> PlaceOrderAsync(int userId, CheckoutRequestDto checkoutDto);
        Task<IEnumerable<OrderResponseDto>> GetUserOrdersAsync(int userId);

    }
}