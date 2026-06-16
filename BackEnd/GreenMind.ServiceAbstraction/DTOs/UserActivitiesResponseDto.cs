namespace GreenMind.ServiceAbstraction.DTOs
{
    public class UserActivitiesResponseDto
    {
        public List<ActivityDayDto> Activities { get; set; } = new();
    }
}
