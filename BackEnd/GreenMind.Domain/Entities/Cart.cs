using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.Domain.Entities
{
    public class Cart : BaseEntity
    {
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public ICollection<CartItem> Items { get; set; } = new HashSet<CartItem>();
    }
}
