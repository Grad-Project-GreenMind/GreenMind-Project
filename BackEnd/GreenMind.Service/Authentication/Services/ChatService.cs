using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using GreenMind.ServiceAbstraction.DTOs;
using GreenMind.ServiceAbstraction.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace GreenMind.Services
{
    public class ChatService : IChatService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory; 

        public ChatService(ApplicationDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
        }

        public CreateNewChatResponse CreateNewChat(string? userId)
        {
            return new CreateNewChatResponse
            {
                SessionId = Guid.NewGuid().ToString(),
                Message = "New session started"
            };
        }

        public async Task<GenerateTitleResponse> GenerateChatTitleAsync(string sessionId, string aiBaseUrl)
        {
            var firstMessageRecord = await _context.ChatLogs
                .Where(c => c.SessionId == sessionId && c.IsFromUser)
                .OrderBy(c => c.Timestamp)
                .FirstOrDefaultAsync();

            if (firstMessageRecord == null || string.IsNullOrEmpty(firstMessageRecord.MessageText))
                return new GenerateTitleResponse { Title = "محادثة جديدة" };

            string firstMessage = firstMessageRecord.MessageText;

            var payload = new
            {
                messages = new[]
                {
            new { content = $"لخص هذا السؤال في عنوان من كلمتين فقط: {firstMessage}", role = "user" }
        }
            };

            string finalTitle = "";

            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.PostAsJsonAsync(aiBaseUrl, payload);

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<GenerateTitleResponse>();
                    if (result != null)
                    {
                        finalTitle = !string.IsNullOrWhiteSpace(result.Title)
                                     ? result.Title
                                     : result.AlternativeTitle;
                    }
                }
            }
            catch (Exception)
            {
               
            }

            if (string.IsNullOrWhiteSpace(finalTitle))
            {
                finalTitle = firstMessage.Length > 25 ? firstMessage.Substring(0, 22) + "..." : firstMessage;
            }

            try
            {
                finalTitle = finalTitle.Trim();
                firstMessageRecord.ChatTitle = finalTitle;
                _context.ChatLogs.Update(firstMessageRecord);
                await _context.SaveChangesAsync();
            }
            catch (Exception)
            {
               
            }

            return new GenerateTitleResponse { Title = finalTitle };
        }

        public class TitleResponse
        {
            public string title { get; set; } = string.Empty;
        }

        public ChatHistoryResponse GetUserHistory(string userId)
        {
            if (!int.TryParse(userId, out int userIdInt))
                return new ChatHistoryResponse { Chats = new List<ChatSessionDto>() };

            var chatLogs = _context.ChatLogs
                .AsNoTracking()
                .Where(log => log.UserId == userIdInt)
                .OrderBy(log => log.Timestamp)
                .ToList();

            var chatGroups = chatLogs.GroupBy(log => log.SessionId);
            var response = new ChatHistoryResponse { Chats = new List<ChatSessionDto>() };

            foreach (var group in chatGroups)
            {
                var messages = group.OrderBy(m => m.Timestamp).ToList();

                var firstUserMessage = messages.FirstOrDefault(m => m.IsFromUser);
                string firstMsgText = firstUserMessage?.MessageText ?? "محادثة سابقة";

                string sidebarTitle;

                if (firstUserMessage != null && !string.IsNullOrWhiteSpace(firstUserMessage.ChatTitle))
                {
                    sidebarTitle = firstUserMessage.ChatTitle;
                }
                else
                {
                    sidebarTitle = Regex.Replace(firstMsgText, @"[#*_\->\r\n]", " ").Trim();
                    if (sidebarTitle.Length > 35)
                    {
                        sidebarTitle = sidebarTitle.Substring(0, 35) + "...";
                    }
                }

                response.Chats.Add(new ChatSessionDto
                {
                    SessionId = group.Key,
                    Title = sidebarTitle, 
                    LastMessageAt = messages.LastOrDefault()?.Timestamp.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss"),
                    Messages = messages.Select(m => new ChatMessageDto
                    {
                        Sender = m.IsFromUser ? "user" : "assistant",
                        Text = m.MessageText,
                        Timestamp = m.Timestamp.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss")
                    }).ToList()
                });
            }

            response.Chats = response.Chats.OrderByDescending(c => c.LastMessageAt).ToList();
            return response;
        }
        public async Task<SendMessageResponse> ProcessMessageAsync(SendMessageRequest request, string aiBaseUrl, string currentUserId)
        {
            var sessionId = (string.IsNullOrWhiteSpace(request.SessionId) || request.SessionId == "string")
                            ? Guid.NewGuid().ToString()
                            : request.SessionId;

            if (!int.TryParse(currentUserId, out int userIdInt))
            {
                userIdInt = 6; 
            }

            var logs = await _context.ChatLogs
                .AsNoTracking()
                .Where(log => log.SessionId == sessionId)
                .OrderByDescending(log => log.Timestamp)
                .Take(10)
                .OrderBy(log => log.Timestamp)
                .ToListAsync();

            var historyMessages = logs.Select(log => new AiHistoryMessage
            {
                Sender = log.IsFromUser ? "user" : "assistant",
                Text = log.MessageText
            }).ToList();

            var aiRequest = new AiChatRequest
            {
                SessionId = sessionId,
                UserId = userIdInt.ToString(),
                Message = request.Message,
                History = historyMessages,
                Metadata = new { }
            };

            try
            {
                var client = _httpClientFactory.CreateClient();

                client.DefaultRequestHeaders.TryAddWithoutValidation("ngrok-skip-browser-warning", "true");

                var response = await client.PostAsJsonAsync(aiBaseUrl, aiRequest);

                if (!response.IsSuccessStatusCode)
                {
                    return new SendMessageResponse { Status = "error", Reply = "سيرفر الـ AI لا يستجيب حالياً." };
                }

                var result = await response.Content.ReadFromJsonAsync<SendMessageResponse>(
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (result != null)
                {
                    result.SessionId = sessionId;

                    string initialTitle = null;

                    if (!logs.Any())
                    {
                        initialTitle = request.Message.Length > 25
                                       ? request.Message.Substring(0, 22) + "..."
                                       : request.Message;
                    }

                    var chatEntries = new List<ChatLog>
            {
                new ChatLog
                {
                    SessionId = sessionId,
                    MessageText = request.Message,
                    IsFromUser = true,
                    Timestamp = DateTime.UtcNow,
                    UserId = userIdInt,
                    ChatTitle = initialTitle 
                },
                new ChatLog
                {
                    SessionId = sessionId,
                    MessageText = result.Reply,
                    IsFromUser = false,
                    Timestamp = DateTime.UtcNow.AddMilliseconds(50),
                    UserId = userIdInt
                }
            };

                    if (!string.IsNullOrEmpty(result.FollowUpQuestion))
                    {
                        chatEntries.Add(new ChatLog { SessionId = sessionId, MessageText = result.FollowUpQuestion, IsFromUser = false, Timestamp = DateTime.UtcNow.AddMilliseconds(100), UserId = userIdInt });
                    }

                    _context.ChatLogs.AddRange(chatEntries);
                    await _context.SaveChangesAsync();

                    return result;
                }

                return new SendMessageResponse { Status = "error", Reply = "حدث خطأ في معالجة رد الـ AI." };
            }
            catch (Exception ex)
            {
                return new SendMessageResponse { Status = "error", Reply = $"Backend Error: {ex.Message}" };
            }
        }
    }
}