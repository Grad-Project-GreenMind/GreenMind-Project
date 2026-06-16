using GreenMind.ServiceAbstraction.DTOs;
using System.Threading.Tasks;

namespace GreenMind.ServiceAbstraction.Interfaces
{
    public interface IChatService
    {
        
        Task<SendMessageResponse> ProcessMessageAsync(SendMessageRequest request, string aiBaseUrl, string userId);

        ChatHistoryResponse GetUserHistory(string userId);

        CreateNewChatResponse CreateNewChat(string? userId);

        /// <summary>
        /// </summary>
        /// <param name="sessionId"></param>
        /// <param name="aiBaseUrl"></param>
        Task<GenerateTitleResponse> GenerateChatTitleAsync(string sessionId, string aiBaseUrl);
    }
}