using System.ComponentModel.DataAnnotations;

namespace GreenMind.Service.Authentication.DTOs
{
    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = null!;
        public string Role { get; set; } = string.Empty;
    }
}
