using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.ServiceAbstraction.DTOs
{
    public class ProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!; 
        public string Category { get; set; } = null!; 
        public decimal Price { get; set; }
        public string? Desc { get; set; } 
        public string Img { get; set; } = null!;

    }
}
