using System.ComponentModel.DataAnnotations;

namespace GreenMind.ServiceAbstraction.Authentication.DTOs
{
    public class GoogleLoginDto
    {
        [Required]
        public string? Token { get; set; } 

        [Required]
        public string Role { get; set; } = "User"; 
    }
}