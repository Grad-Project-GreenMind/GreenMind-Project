namespace GreenMind.ServiceAbstraction.DTOs
{
    public class OrderResponseDto
    {
        public int Id { get; set; }
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Status { get; set; }
     
    }
}