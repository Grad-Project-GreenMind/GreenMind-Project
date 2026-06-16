using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using GreenMind.ServiceAbstraction.DTOs;
using GreenMind.ServiceAbstraction.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.Service.Services.ShoppingCart
{
    public class OrderService : IOrderService
    {
        private readonly ApplicationDbContext _context;

        public OrderService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<OrderResponseDto>> GetUserOrdersAsync(int userId)
        {
            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new OrderResponseDto
                {
                    Id = o.Id,
                    OrderDate = o.OrderDate,
                    TotalAmount = o.TotalAmount,
                    // ✅ التعديل هنا: ضيفي ToString()
                    Status = o.Status.ToString()
                })
                .ToListAsync();

            return orders;
        }
        public async Task<int> PlaceOrderAsync(int userId, CheckoutRequestDto checkoutDto)
        {
            //var cart = await _context.Carts
            //    .Include(c => c.Items)
            //    .ThenInclude(ci => ci.Product)
            //    .FirstOrDefaultAsync(c => c.UserId == userId);

            //if (cart == null || !cart.Items.Any())
            //    throw new Exception("The basket is empty, add the first products!");

           
            var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
                throw new Exception("Cart not found");

            cart.Items = await _context.CartItems
                .Where(ci => ci.CartId == cart.Id)
                .Include(ci => ci.Product)
                .ToListAsync();

            if (cart.Items == null || !cart.Items.Any())
                throw new Exception("The basket is empty, add the first products!");
            var subTotal = cart.Items.Sum(item => item.Quantity * item.Product.Price);

            var discount = checkoutDto.CartDetails.Discount;

            var shipping = 0m;
            var taxes = 0m;
            var total = subTotal - discount + shipping + taxes;

            var address = new Address
            {
                City = checkoutDto.CustomerDetails.City,    
                Street = checkoutDto.CustomerDetails.Address, 
                Phone = checkoutDto.CustomerDetails.Phone,    
                Notes = checkoutDto.CustomerDetails.Notes,    
                UserId = userId
            };
            _context.Addresses.Add(address);
            var order = new Order
            {
                UserId = userId,
                OrderDate = DateTime.UtcNow,
                Status = OrderStatus.Pending,
                SubTotal = subTotal,            
                DiscountAmount = discount,     
                ShippingCost = shipping,      
                TaxAmount = taxes,           
                TotalAmount = total,            
                PaymentMethod = checkoutDto.PaymentMethod,
                Phone = checkoutDto.CustomerDetails.Phone,
                Notes = checkoutDto.CustomerDetails.Notes
            };

            foreach (var item in cart.Items)
            {
                order.OrderItems.Add(new OrderItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.Product.Price
                });
            }

            _context.Orders.Add(order);

            order.Address = address;

            _context.CartItems.RemoveRange(cart.Items);
            await _context.SaveChangesAsync();

            return order.Id;
        }
    }
}