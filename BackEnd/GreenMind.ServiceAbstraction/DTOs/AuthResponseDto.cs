namespace GreenMind.ServiceAbstraction.DTOs
{
    public class AuthResponseDto
    {
        public string Id { get; set; } = string.Empty;

        public string Token { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;

        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}