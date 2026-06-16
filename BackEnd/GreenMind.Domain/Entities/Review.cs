using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.Domain.Entities
{
    public class Review : BaseEntity
    {
        public string Name { get; set; } = null!;
        public int Rating { get; set; } 
        public string Comment { get; set; } = null!;
        public DateTime ReviewDate { get; set; } = DateTime.UtcNow;

        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Email { get; set; } = null!;
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public string? Position { get; set; }
    }
}