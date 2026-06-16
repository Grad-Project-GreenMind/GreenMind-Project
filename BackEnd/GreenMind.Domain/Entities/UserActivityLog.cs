namespace GreenMind.Domain.Entities
{
    public class UserActivityLog
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? EndedAt { get; set; }
    }
}