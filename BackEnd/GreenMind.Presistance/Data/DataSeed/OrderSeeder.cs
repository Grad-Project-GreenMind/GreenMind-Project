using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GreenMind.DataSeed
{
    public static class OrderSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            if (context.Orders.Any())
                return;

            var user = context.Users.FirstOrDefault();
            var address = context.Addresses.FirstOrDefault();

            if (user == null || address == null)
                return;

            var orders = new List<Order>
            {
                new Order
                {
                    UserId = user.Id,
                    AddressId = address.Id,
                    Phone = "01000000000",
                    OrderDate = DateTime.UtcNow.AddDays(-1),
                    TotalAmount = 150,
                   
                    Status = OrderStatus.Pending
                },
                new Order
                {
                    UserId = user.Id,
                    AddressId = address.Id,
                    Phone = "01000000000",
                    OrderDate = DateTime.UtcNow.AddHours(-5),
                    TotalAmount = 300,
                    Status = OrderStatus.Delivered
                },
                new Order
                {
                    UserId = user.Id,
                    AddressId = address.Id,
                    Phone = "01000000000",
                    OrderDate = DateTime.UtcNow,
                    TotalAmount = 450,
                    Status = OrderStatus.Shipped
                }
            };

            await context.Orders.AddRangeAsync(orders);
            await context.SaveChangesAsync();
        }
    }
}