namespace GreenMind.ServiceAbstraction.DTOs
{
    public class AuthResponseDto
    {
        // السطر ده هو اللي هيخلي ميار تعرف تسحب الـ Id وتخزنه عندها
        public string Id { get; set; } = string.Empty;

        public string Token { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;

        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}