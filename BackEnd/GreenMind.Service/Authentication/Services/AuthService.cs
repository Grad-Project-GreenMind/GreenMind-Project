using Google.Apis.Auth;
using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using GreenMind.Service.Authentication.DTOs;
using GreenMind.ServiceAbstraction.Authentication;
using GreenMind.ServiceAbstraction.Authentication.DTOs;
using GreenMind.ServiceAbstraction.DTOs;
using GreenMind.ServiceAbstraction.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace GreenMind.Service.Authentication.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly JwtService _jwtService;
        private readonly IPasswordHasherService _hasher;

        public AuthService(ApplicationDbContext context, JwtService jwtService, IPasswordHasherService hasher)
        {
            _context = context;
            _jwtService = jwtService;
            _hasher = hasher;
        }

        public async Task<AuthResponseDto> RegisterUserAsync(RegisterUserDto dto)
        {
            var email = dto.Email.ToLower();
            if (await _context.Users.AnyAsync(x => x.Email.ToLower() == email))
                throw new Exception("Email already exists");

            var user = new User
            {
                Name = dto.Name,
                Email = email,
                PasswordHash = _hasher.Hash(dto.Password),
                CreatedDate = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // التصحيح هنا: الترتيب الصح (email, role, id, name)
            var token = _jwtService.GenerateToken(user.Email, "User", user.Id, user.Name);

            return new AuthResponseDto
            {
                Id = user.Id.ToString(),
                Token = token,
                IsSuccess = true,
                UserName = user.Name,
                Role = "User"
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var email = dto.Email.ToLower();
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email.ToLower() == email);

            if (user != null)
            {
                var isPasswordValid = _hasher.Verify(user.PasswordHash, dto.Password);

                if (isPasswordValid)
                {
                    // التصحيح هنا: بعتنا dto.Role (اللي هي "User") في مكانها الصح تاني باراميتر
                    var token = _jwtService.GenerateToken(user.Email, dto.Role, user.Id, user.Name);

                    return new AuthResponseDto
                    {
                        Id = user.Id.ToString(),
                        Token = token,
                        IsSuccess = true,
                        UserName = user.Name,
                        Role = dto.Role
                    };
                }
            }

            throw new Exception("بيانات الدخول غير صحيحة");
        }

        public async Task ResetPasswordAsync(ResetPasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null) throw new Exception("User not found");

            user.PasswordHash = _hasher.Hash(dto.NewPassword);
            await _context.SaveChangesAsync();
        }

        public async Task ForgotPasswordAsync(string email)
        {
            var user = await _context.Users.AnyAsync(u => u.Email == email.ToLower());
            if (!user) throw new Exception("Email not found");

            await Task.CompletedTask;
        }

        public async Task<AuthResponseDto> GoogleLoginAsync(string token, string role)
        {
            throw new NotImplementedException();
        }

        public async Task<AuthResponseDto> FacebookLoginAsync(string token, string role)
        {
            throw new NotImplementedException();
        }

        public async Task<AuthResponseDto> ExternalLoginAsync(string name, string role)
        {
            throw new NotImplementedException();
        }
    }
}