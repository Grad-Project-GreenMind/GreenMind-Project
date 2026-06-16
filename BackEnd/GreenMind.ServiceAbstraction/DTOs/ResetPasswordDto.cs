using System.ComponentModel.DataAnnotations;

namespace GreenMind.ServiceAbstraction.Authentication.DTOs
{
    public class ResetPasswordDto
    {


        public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)]
        public string NewPassword { get; set; } = null!;
        public string ConfirmNewPassword { get; set; } = null!;
        [Required]
        public string Role { get; set; } = null!; 
        public string Otp { get; set; } = null!;
    }
}