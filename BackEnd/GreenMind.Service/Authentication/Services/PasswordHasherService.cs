using System.Security.Cryptography;
using GreenMind.ServiceAbstraction.Interfaces;

namespace GreenMind.Service.Authentication.Services
{
    public class PasswordHasherService : IPasswordHasherService
    {
        private const int SaltSize = 16;
        private const int KeySize = 32;
        private const int Iterations = 100_000;

        public string Hash(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(SaltSize);

            var key = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                Iterations,
                HashAlgorithmName.SHA256,
                KeySize);

            return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";
        }

        public bool Verify(string hashedPassword, string providedPassword)
        {
            var parts = hashedPassword.Split('.', 3);
            if (parts.Length != 3) return false;

            var iterations = int.Parse(parts[0]);
            var salt = Convert.FromBase64String(parts[1]);
            var key = Convert.FromBase64String(parts[2]);

            var keyToCheck = Rfc2898DeriveBytes.Pbkdf2(
                providedPassword,
                salt,
                iterations,
                HashAlgorithmName.SHA256,
                key.Length);

            return CryptographicOperations.FixedTimeEquals(keyToCheck, key);
        }
    }
}