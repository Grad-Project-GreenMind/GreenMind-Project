using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.ServiceAbstraction.DTOs
{
    public class UserProfileDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty; // Read-only
        public string? Phone { get; set; }
        public string? Gender { get; set; }
        public string? ProfilePic { get; set; }
    }
}
