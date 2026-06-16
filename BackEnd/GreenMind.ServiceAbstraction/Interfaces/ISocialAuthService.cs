namespace GreenMind.ServiceAbstraction.Interfaces
{
    public interface ISocialAuthService
    {
        Task<(string Email, string Name)> VerifyGoogleAsync(string token);
        Task<(string? Email, string Name)> VerifyFacebookAsync(string token);
    }
}