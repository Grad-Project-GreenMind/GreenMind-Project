using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GreenMind.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HistoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public HistoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("{type}")]
        public async Task<IActionResult> GetHistoryByType(string type)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "1";
            int userId = int.Parse(userIdStr);

            // 1. لو المستخدم طلب تاريخ الأوردرات
            if (type.ToLower() == "order")
            {
                var orders = await _context.Orders
                    .Where(o => o.UserId == userId)
                    .OrderByDescending(o => o.OrderDate)
                    .Select(o => new
                    {
                        Id = o.Id,
                        Text = $"Order #{o.Id} - Total: {o.TotalAmount:0.##} EGP",
                        Date = o.OrderDate,
                        Image = "https://cdn-icons-png.flaticon.com/512/3500/3500833.png",
                        Status = o.Status.ToString()
                    })
                    .ToListAsync();

                return Ok(orders);
            }

            // 2. باقي الأنواع (AI, Fertilizer, etc.) بتيجي من جدول الهيستوري العادي
            var history = await _context.UserActivityHistory
                .Where(h => h.UserId == userId && h.Type.ToLower() == type.ToLower())
                .OrderByDescending(h => h.Id)
                .Select(h => new
                {
                    h.Id,
                    h.Text,
                    h.Date,
                    h.Image
                })
                .ToListAsync();

            return Ok(history);
        }

        [HttpDelete("{type}/{id}")]
        public async Task<IActionResult> DeleteSingleItem(string type, int id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "1";
            int userId = int.Parse(userIdStr);

            // لو النوع أوردر، نمسحه من جدول الـ Orders
            if (type.ToLower() == "order")
            {
                var order = await _context.Orders
                    .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);

                if (order == null) return NotFound(new { message = "Order not found" });

                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Order deleted successfully" });
            }

            var item = await _context.UserActivityHistory
                .FirstOrDefaultAsync(h => h.Id == id && h.UserId == userId && h.Type.ToLower() == type.ToLower());

            if (item == null) return NotFound(new { message = "History item not found" });

            _context.UserActivityHistory.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Item deleted successfully" });
        }
        [HttpDelete("{type}")]
        public async Task<IActionResult> DeleteAllByType(string type)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "1";
            int userId = int.Parse(userIdStr);

            if (type.ToLower() == "order")
            {
                var orders = await _context.Orders.Where(o => o.UserId == userId).ToListAsync();
                if (!orders.Any()) return Ok(new { message = "Order history is already empty" });

                _context.Orders.RemoveRange(orders);
                await _context.SaveChangesAsync();
                return Ok(new { message = "All orders deleted" });
            }

            var items = await _context.UserActivityHistory
                .Where(h => h.UserId == userId && h.Type.ToLower() == type.ToLower())
                .ToListAsync();

            if (!items.Any()) return Ok(new { message = "History is already empty" });

            _context.UserActivityHistory.RemoveRange(items);
            await _context.SaveChangesAsync();

            return Ok(new { message = "All history records for this type deleted" });
        }
    }
    }