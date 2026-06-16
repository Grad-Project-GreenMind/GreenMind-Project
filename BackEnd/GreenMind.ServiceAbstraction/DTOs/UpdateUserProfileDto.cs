using Microsoft.AspNetCore.Http; 
using System;

namespace GreenMind.ServiceAbstraction.DTOs
{
    public class UpdateUserProfileDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Gender { get; set; }

        public IFormFile? ProfilePic { get; set; }
    }
}