public interface IUserActivityLogger
{
    Task LogAsync(string userName, string actionType);
}