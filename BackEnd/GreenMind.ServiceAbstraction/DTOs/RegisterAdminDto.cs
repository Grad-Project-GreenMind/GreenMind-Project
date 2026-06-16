using System.ComponentModel.DataAnnotations;

namespace GreenMind.Service.Authentication.DTOs
{
    public class RegisterAdminDto
    {
        [Required]
        [MinLength(3)]
        public string Name { get; set; } = null!;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = null!;
    }
}
