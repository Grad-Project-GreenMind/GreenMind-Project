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
        /// توليد عنوان ذكي للمحادثة بناءً على أول رسالة عن طريق مناداة موديل الـ AI.
        /// </summary>
        /// <param name="sessionId">معرف الجلسة لجلب أول رسالة</param>
        /// <param name="aiBaseUrl">الرابط الخاص بـ generate-title الخاص بتيم الـ AI</param>
        Task<GenerateTitleResponse> GenerateChatTitleAsync(string sessionId, string aiBaseUrl);
    }
}