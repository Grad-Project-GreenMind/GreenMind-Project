using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.Domain.Entities
{
    public class Address : BaseEntity
    {
        public string City { get; set; } = null!;
        public string Street { get; set; } = null!;
        public string Phone { get; set; } = null!; 
        public string? Notes { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
