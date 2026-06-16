using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.Domain.Entities
{
    public class Payment : BaseEntity
    {
        public decimal Amount { get; set; }
        public string Method { get; set; } = null!; 
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        public int OrderId { get; set; }
        public Order Order { get; set; } = null!;
    }
}
