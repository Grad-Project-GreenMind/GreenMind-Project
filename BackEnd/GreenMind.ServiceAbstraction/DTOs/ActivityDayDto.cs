namespace GreenMind.ServiceAbstraction.DTOs
{
    public class ActivityDayDto
    {
        public string Date { get; set; } = string.Empty;
        public List<ActivityLogDto> Logs { get; set; } = new();
    }
}