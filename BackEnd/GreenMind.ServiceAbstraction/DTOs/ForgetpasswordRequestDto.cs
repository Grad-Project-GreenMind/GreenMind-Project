namespace GreenMind.ServiceAbstraction.DTOs
{
    public class ForgotPasswordRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
