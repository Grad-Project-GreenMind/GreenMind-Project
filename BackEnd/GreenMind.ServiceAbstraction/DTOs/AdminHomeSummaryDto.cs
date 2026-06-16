namespace GreenMind.ServiceAbstraction.DTOs
{
    public class AdminHomeSummaryDto
    {
        public List<AdminStatDto> Stats { get; set; } = new();
        public List<RecentActivityDto> RecentActivity { get; set; } = new();
        public List<PerformanceDto> Performance { get; set; } = new();
        public RevenueDto Revenue { get; set; } = new();
    }
}
