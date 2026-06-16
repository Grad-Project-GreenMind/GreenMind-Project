using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.ServiceAbstraction.DTOs
{
    public class FacebookLoginDto
    {
        public string? Token { get; set; }
        public string? Role { get; set; }
    }
}
