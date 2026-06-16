using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.Domain.Entities
{
    public class Category : BaseEntity
    {
        public string Name { get; set; } = null!;

        public int Id { get; set; } 
        public ICollection<Product> Products { get; set; } = new HashSet<Product>();
    }
}
