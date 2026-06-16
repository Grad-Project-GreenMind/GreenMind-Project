using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.ServiceAbstraction.DTOs
{
    public class CartItemDto
    {
        public int Id { get; set; } 
        public string Name { get; set; } = string.Empty; 
        public decimal Price { get; set; } 
        public string Img { get; set; } = string.Empty; 
        public int Quantity { get; set; } 
    }
}
