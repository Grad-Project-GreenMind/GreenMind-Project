using System.ComponentModel.DataAnnotations;

namespace GreenMind.ServiceAbstraction.DTOs
{
    public class CheckoutRequestDto
    {
        
        public CustomerDetailsDto CustomerDetails { get; set; } = null!;
        public CartDetailsDto CartDetails { get; set; } = null!;
        public string PaymentMethod { get; set; } = "Cash on delivery";
    }

    public class CustomerDetailsDto
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Phone number is required")]
        [RegularExpression(@"^01[0-2,5]{1}[0-9]{8}$", ErrorMessage = "Invalid Egyptian phone number")]
        public string Phone { get; set; } = null!;

        public string City { get; set; } = null!;
        public string Address { get; set; } = null!; 
        public string? Notes { get; set; }
    }

    public class CartDetailsDto
    {
        public int ItemsCount { get; set; }
        public decimal SubTotal { get; set; }
        public decimal Shipping { get; set; }
        public decimal Taxes { get; set; }
        public decimal Discount { get; set; } 
        public decimal Total { get; set; }
    }
}