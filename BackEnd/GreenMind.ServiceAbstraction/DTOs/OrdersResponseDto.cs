namespace GreenMind.ServiceAbstraction.DTOs
{
    public class OrdersResponseDto
    {
        public List<AdminOrderDto> Orders { get; set; } = new();
    }
}
