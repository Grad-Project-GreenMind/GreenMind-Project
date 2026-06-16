using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO; 

namespace GreenMind.Service.Authentication.Services
{
    using GreenMind.Presistance.Data.DbContexts;
    using GreenMind.ServiceAbstraction.DTOs;
    using GreenMind.ServiceAbstraction.Interfaces;
    using Microsoft.EntityFrameworkCore;

    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordHasherService _hasher;

        public UserService(ApplicationDbContext context, IPasswordHasherService hasher)
        {
            _context = context;
            _hasher = hasher;
        }

        public async Task<UserProfileDto> GetProfileAsync(int userId)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Id == userId);

            if (user == null)
                throw new Exception("User not found");

            return new UserProfileDto
            {
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                Gender = user.Gender,
                ProfilePic = !string.IsNullOrEmpty(user.ProfilePic)
                    ? $"https://greenmind.runasp.net/images/profiles/{user.ProfilePic}"
                    : null
            };
        }

        public async Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateUserProfileDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);

            if (user == null) throw new Exception("User not found");

            user.Name = dto.Name.Trim();
            user.Phone = dto.Phone?.Trim();
            user.Gender = dto.Gender?.Trim();

            if (dto.ProfilePic != null && dto.ProfilePic.Length > 0)
            {
                var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "profiles");

                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath);

                var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(dto.ProfilePic.FileName)}";
                var filePath = Path.Combine(folderPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.ProfilePic.CopyToAsync(stream);
                }

                user.ProfilePic = fileName;
            }

            await _context.SaveChangesAsync();

            return new UserProfileDto
            {
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                Gender = user.Gender,
                ProfilePic = !string.IsNullOrEmpty(user.ProfilePic)
                    ? $"https://greenmind.runasp.net/images/profiles/{user.ProfilePic}"
                    : null
            };
        }

        public async Task<string> ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Id == userId);

            if (user == null)
                throw new Exception("User not found");

            if (string.IsNullOrWhiteSpace(dto.CurrentPassword))
                throw new Exception("Current password is required");

            if (string.IsNullOrWhiteSpace(dto.NewPassword))
                throw new Exception("New password is required");

            if (dto.NewPassword != dto.ConfirmPassword)
                throw new Exception("Passwords do not match");

            if (!_hasher.Verify(user.PasswordHash, dto.CurrentPassword))
                throw new Exception("Current password is incorrect");

            user.PasswordHash = _hasher.Hash(dto.NewPassword);
            await _context.SaveChangesAsync();

            return "Password changed successfully.";
        }
    }
}