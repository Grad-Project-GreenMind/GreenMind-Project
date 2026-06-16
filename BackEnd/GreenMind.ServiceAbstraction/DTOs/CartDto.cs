using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.ServiceAbstraction.DTOs
{
    public class CartDto
    {
        public List<CartItemDto> CartItems { get; set; } = new List<CartItemDto>();
        public decimal SubTotal { get; set; }
        public decimal Discount { get; set; } = 100;
        public decimal Total { get; set; }
    }
}
