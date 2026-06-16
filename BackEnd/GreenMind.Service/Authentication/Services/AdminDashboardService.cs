using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using GreenMind.ServiceAbstraction.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.IO;

namespace GreenMind.Service.Services
{
    public class AdminDashboardService : IAdminDashboardService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private static readonly string[] AllowedCategories = { "Seeds", "Soil", "Tools" };

        public AdminDashboardService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        private async Task<AdminProductDto> MapToDto(int productId)
        {
            var entity = await _context.Products
                .Include(x => x.Category)
                .FirstOrDefaultAsync(x => x.Id == productId);

            if (entity == null)
                throw new Exception("Product not found");

            return new AdminProductDto
            {
                Id = entity.Id.ToString(),
                Name = entity.Name,
                Description = entity.Desc ?? "",
                Image = entity.Img,
                Category = entity.Category?.Name ?? "No Category",
                Price = $"{entity.Price}$"
            };
        }

        public async Task<AdminProductDto> CreateProductAsync(CreateUpdateProductDto dto)
        {
            ValidateProduct(dto);

            var category = await GetOrCreateCategoryAsync(dto.CategoryName);

            var entity = new Product
            {
                Name = dto.Name.Trim(),
                Desc = dto.Description.Trim(),
                CategoryId = category.Id,
                Price = dto.Price,
                Img = "", 
                IsAdminProduct = true
            };

            _context.Products.Add(entity);
            await _context.SaveChangesAsync(); 

            var imageUrl = await SaveImageWithIdAsync(dto.Image!, entity.Id);

            entity.Img = imageUrl;
            await _context.SaveChangesAsync();

            _context.UserActivityLogs.Add(new UserActivityLog
            {
                UserName = "Admin",
                ActionType = "CreateProduct",
                StartedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return await MapToDto(entity.Id);
        }

        public async Task<AdminProductDto> UpdateProductAsync(int id, CreateUpdateProductDto dto)
        {
            ValidateProduct(dto, true);

            var entity = await _context.Products
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null)
                throw new Exception("Product not found");

            var category = await GetOrCreateCategoryAsync(dto.CategoryName);

            entity.Name = dto.Name.Trim();
            entity.Desc = dto.Description?.Trim();
            entity.CategoryId = category.Id;
            entity.Price = dto.Price;

            if (dto.Image != null && dto.Image.Length > 0)
            {
                entity.Img = await SaveImageWithIdAsync(dto.Image, entity.Id);
            }

            _context.UserActivityLogs.Add(new UserActivityLog
            {
                UserName = "Admin",
                ActionType = "UpdateProduct",
                StartedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return await MapToDto(entity.Id);
        }

       
        public async Task DeleteProductAsync(int id)
        {
            var entity = await _context.Products
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null)
                throw new Exception("Product not found");

            _context.Products.Remove(entity);

            _context.UserActivityLogs.Add(new UserActivityLog
            {
                UserName = "Admin",
                ActionType = "DeleteProduct",
                StartedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }
        private async Task<string> SaveImageWithIdAsync(IFormFile image, int productId)
        {
            var extension = Path.GetExtension(image.FileName).ToLower();
            var allowed = new[] { ".jpg", ".jpeg", ".png" };

            if (!allowed.Contains(extension))
                throw new Exception("Invalid image");

            var fileName = $"{productId}{extension}";
            var path = Path.Combine("wwwroot", "images");

            if (!Directory.Exists(path))
                Directory.CreateDirectory(path);

            var fullPath = Path.Combine(path, fileName);

            if (File.Exists(fullPath))
                File.Delete(fullPath);

            using var stream = new FileStream(fullPath, FileMode.Create);
            await image.CopyToAsync(stream);

            var request = _httpContextAccessor.HttpContext!.Request;
            var baseUrl = $"{request.Scheme}://{request.Host}";

            return $"{baseUrl}/images/{fileName}";
        }

        public async Task<OrdersResponseDto> GetOrdersAsync()
        {
            var orders = await _context.Orders
                .Include(x => x.User)
                .OrderByDescending(x => x.OrderDate)
                .Select(x => new AdminOrderDto
                {
                    Id = x.Id.ToString(),
                    Customer = x.User != null ? x.User.Name : "Unknown",
                    Date = x.OrderDate.ToString("dd/MM/yyyy"),
                    Price = x.TotalAmount.ToString("0.##"),
                   
                    Status = x.Status.ToString()
                })
                .ToListAsync();

            return new OrdersResponseDto { Orders = orders };
        }

        public async Task<UserActivitiesResponseDto> GetUserActivitiesAsync(string? search)
        {
            var query = _context.UserActivityLogs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(x =>
                    x.UserName.Contains(search) ||
                    x.ActionType.Contains(search));
            }

            var rows = await query.ToListAsync();

            var activities = rows
                .GroupBy(x => x.StartedAt.Date)
                .Select(g => new ActivityDayDto
                {
                    Date = g.Key.ToString("yyyy/M/d"),
                    Logs = g.Select(x => new ActivityLogDto
                    {
                        Time = x.StartedAt.ToString("hh:mm tt", new CultureInfo("en-US")),
                        Action = $"User: {x.UserName} - {x.ActionType}"
                    }).ToList(),
                })
                .ToList();

            return new UserActivitiesResponseDto { Activities = activities };
        }

        public async Task<List<AdminProductDto>> GetProductsAsync()
        {
            var products = await _context.Products
                .Include(x => x.Category)
                .Where(x => x.IsAdminProduct && x.Category!.Name.ToLower() != "string")
                .OrderByDescending(x => x.Id)
                .ToListAsync();

            return products.Select(x => new AdminProductDto
            {
                Id = x.Id.ToString(),
                Name = x.Name,
                Description = x.Desc ?? "",
                Image = x.Img,
                Category = x.Category != null ? x.Category.Name : "",
                Price = $"{x.Price}$"
            }).ToList();
        }

        private async Task<Category> GetOrCreateCategoryAsync(string name)
        {
            var normalized = name.Trim().ToLower();
            var category = await _context.Categories
                .FirstOrDefaultAsync(x => x.Name.ToLower() == normalized);

            if (category != null)
                return category;

            category = new Category { Name = name.Trim() };
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return category;
        }

        public async Task<AdminHomeSummaryDto> GetHomeSummaryAsync()
        {
            var today = DateTime.UtcNow.Date;
            var month = today.Month;
            var year = today.Year;

            var totalUsers = await _context.Users.CountAsync();
            var totalProducts = await _context.Products.CountAsync();
            var totalOrders = await _context.Orders.CountAsync();

            var logs = await _context.UserActivityLogs
                .OrderByDescending(x => x.StartedAt)
                .Take(10)
                .ToListAsync();

            var recentActivity = logs.Select(x => new RecentActivityDto
            {
                Name = x.UserName,
                Action = GetActionText(x.ActionType, x.UserName),
                Time = x.StartedAt.ToString("hh:mm tt", CultureInfo.InvariantCulture)
            }).ToList();

            var allOrderItems = await _context.OrderItems
                .Include(oi => oi.Product)
                .ThenInclude(p => p.Category)
                .ToListAsync();

            var performance = AllowedCategories.Select(categoryName => new PerformanceDto
            {
                Item = categoryName,
                Value = allOrderItems
                    .Count(oi => oi.Product?.Category?.Name == categoryName)
                    .ToString()
            }).ToList();

            var todayRevenueRaw = await _context.Orders
                .Where(x => x.OrderDate.Date == today)
                .SumAsync(x => (decimal?)x.TotalAmount);

            var monthlyRevenueRaw = await _context.Orders
                .Where(x => x.OrderDate.Month == month && x.OrderDate.Year == year)
                .SumAsync(x => (decimal?)x.TotalAmount);

            var todayRevenue = todayRevenueRaw ?? 0;
            var monthlyRevenue = monthlyRevenueRaw ?? 0;

            return new AdminHomeSummaryDto
            {
                Stats = new List<AdminStatDto>
                {
                    new AdminStatDto { Title = "Total Users", Value = totalUsers.ToString() },
                    new AdminStatDto { Title = "Total Products", Value = totalProducts.ToString() },
                    new AdminStatDto { Title = "Total Orders", Value = totalOrders.ToString() }
                },
                RecentActivity = recentActivity,
                Performance = performance,
                Revenue = new RevenueDto
                {
                    Today = todayRevenue.ToString("0"),
                    Monthly = monthlyRevenue.ToString("0")
                }
            };
        }

        private string GetActionText(string actionType, string userName)
        {
            return actionType switch
            {
                "Register" => $"{userName} created an account",
                "Login" => $"{userName} logged in",
                "CreateProduct" => $"{userName} added a product",
                "UpdateProduct" => $"{userName} updated a product",
                "DeleteProduct" => $"{userName} deleted a product",
                "CreateOrder" => $"{userName} placed an order",
                _ => actionType
            };
        }

        private static void ValidateProduct(CreateUpdateProductDto dto, bool isUpdate = false)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new Exception("Name required");

            if (string.IsNullOrWhiteSpace(dto.CategoryName))
                throw new Exception("Category required");

            if (dto.Price <= 0)
                throw new Exception("Price invalid");

            if (!isUpdate && dto.Image == null)
                throw new Exception("Image required");
        }
    }
}