using GreenMind.ServiceAbstraction.DTOs;

public interface IAdminDashboardService
{
    Task<AdminProductDto> CreateProductAsync(CreateUpdateProductDto dto);

    Task<AdminProductDto> UpdateProductAsync(int id, CreateUpdateProductDto dto);

    Task DeleteProductAsync(int id);
    Task<List<AdminProductDto>> GetProductsAsync();
    Task<OrdersResponseDto> GetOrdersAsync();

    Task<AdminHomeSummaryDto> GetHomeSummaryAsync();

    Task<UserActivitiesResponseDto> GetUserActivitiesAsync(string? search);
}