using GreenMind.Service.Authentication.DTOs;
using GreenMind.ServiceAbstraction.Authentication.DTOs;
using GreenMind.ServiceAbstraction.DTOs; 

namespace GreenMind.ServiceAbstraction.Authentication
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterUserAsync(RegisterUserDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task ResetPasswordAsync(ResetPasswordDto dto);

        Task ForgotPasswordAsync(string email);
        Task<AuthResponseDto> GoogleLoginAsync(string token, string role);
        Task<AuthResponseDto> FacebookLoginAsync(string token, string role);
    }
}