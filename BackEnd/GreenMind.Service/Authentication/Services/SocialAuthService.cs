using System.Text.Json;
using GreenMind.ServiceAbstraction.Interfaces;

namespace GreenMind.Service.Authentication.Services
{
    public class SocialAuthService : ISocialAuthService
    {
        private readonly HttpClient _http;

        public SocialAuthService(HttpClient http)
        {
            _http = http;
        }

        public async Task<(string Email, string Name)> VerifyGoogleAsync(string token)
        {
            var url = $"https://oauth2.googleapis.com/tokeninfo?id_token={token}";
            var resp = await _http.GetAsync(url);

            if (!resp.IsSuccessStatusCode)
                throw new Exception("Invalid Google token");

            var json = await resp.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var email = doc.RootElement.GetProperty("email").GetString();
            var name = doc.RootElement.TryGetProperty("name", out var n)
                ? n.GetString()
                : "User";

            if (string.IsNullOrWhiteSpace(email))
                throw new Exception("Google token has no email");

            return (email!, name ?? "User");
        }

        public async Task<(string? Email, string Name)> VerifyFacebookAsync(string token)
        {
            var url = $"https://graph.facebook.com/me?fields=id,name,email&access_token={token}";
            var resp = await _http.GetAsync(url);

            if (!resp.IsSuccessStatusCode)
                throw new Exception("Invalid Facebook token");

            var json = await resp.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var email = doc.RootElement.TryGetProperty("email", out var e)
                ? e.GetString()
                : null;

            var name = doc.RootElement.TryGetProperty("name", out var n)
                ? n.GetString()
                : "User";

            return (email, name ?? "User");
        }
    }
}