using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.Domain.Entities
{
    public class ChatLog : BaseEntity
    {
        public string SessionId { get; set; } = null!;
        public string MessageText { get; set; } = null!;
        public bool IsFromUser { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public string? ChatTitle { get; set; }
    }
}
