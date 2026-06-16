using System.ComponentModel.DataAnnotations;

namespace GreenMind.ServiceAbstraction.DTOs
{
    public class CreateReviewDto
    {
        [Required(ErrorMessage = "Name is required.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone is required.")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; } = string.Empty;

        
        public string? Position { get; set; }

        [Required(ErrorMessage = "Message is required.")]
        public string Message { get; set; } = string.Empty;
    }
}