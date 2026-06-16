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
        private readonly IHttpClientFactory _httpClientFactory; // إضافة السطر ده

        // تعديل الـ Constructor لاستقبال الـ Factory
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
            // 1. جلب أول رسالة للمستخدم (هنا هنحتاج نرجع السجل كله عشان نحدثه مش بس النص)
            var firstMessageRecord = await _context.ChatLogs
                .Where(c => c.SessionId == sessionId && c.IsFromUser)
                .OrderBy(c => c.Timestamp)
                .FirstOrDefaultAsync();

            if (firstMessageRecord == null || string.IsNullOrEmpty(firstMessageRecord.MessageText))
                return new GenerateTitleResponse { Title = "محادثة جديدة" };

            string firstMessage = firstMessageRecord.MessageText;

            // 2. إعداد الـ Payload للـ AI
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
                    // حل تحذير CS8600: إضافة ? لتعريف أن الـ result يمكن أن يكون null
                    var result = await response.Content.ReadFromJsonAsync<GenerateTitleResponse>();
                    if (result != null)
                    {
                        finalTitle = !string.IsNullOrWhiteSpace(result.Title)
                                     ? result.Title
                                     : result.AlternativeTitle;
                    }
                }
            }
            // حل تحذير CS0168: مسح متغير الـ ex لأننا مش بنستخدمه جوه الـ catch block
            catch (Exception)
            {
                // Log error here
            }

            // لو الـ AI مفشلش بنستخدم رده، لو فشل بنستخدم الـ Fallback بتاعك
            if (string.IsNullOrWhiteSpace(finalTitle))
            {
                finalTitle = firstMessage.Length > 25 ? firstMessage.Substring(0, 22) + "..." : firstMessage;
            }

            // *** جديد: تثبيت العنوان في الداتابيز ***
            try
            {
                finalTitle = finalTitle.Trim();
                // بنسيف العنوان في أول سجل للمحادثة
                firstMessageRecord.ChatTitle = finalTitle;
                _context.ChatLogs.Update(firstMessageRecord);
                await _context.SaveChangesAsync();
            }
            catch (Exception)
            {
                // لو السيف فشل لأي سبب، بنكمل عشان الرد يرجع للمستخدم على الأقل
            }

            return new GenerateTitleResponse { Title = finalTitle };
        }

        // الـ Model اللي هيستقبل الرد
        public class TitleResponse
        {
            // حل تحذير CS8618: إعطاء قيمة ابتدائية فارغة منعاً للـ Null warning
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

                // 1. جلب أول رسالة للمستخدم في هذا الـ Session
                var firstUserMessage = messages.FirstOrDefault(m => m.IsFromUser);
                string firstMsgText = firstUserMessage?.MessageText ?? "محادثة سابقة";

                string sidebarTitle;

                // 2. التحقق: لو الـ ChatTitle متسيف وجاهز في الداتا بيز نستخدمه فوراً
                if (firstUserMessage != null && !string.IsNullOrWhiteSpace(firstUserMessage.ChatTitle))
                {
                    sidebarTitle = firstUserMessage.ChatTitle;
                }
                else
                {
                    // Fallback: لو لسه مفيش عنوان ذكي متسيف، بنضف نص الرسالة وبناخد منها جزء
                    sidebarTitle = Regex.Replace(firstMsgText, @"[#*_\->\r\n]", " ").Trim();
                    if (sidebarTitle.Length > 35)
                    {
                        sidebarTitle = sidebarTitle.Substring(0, 35) + "...";
                    }
                }

                response.Chats.Add(new ChatSessionDto
                {
                    SessionId = group.Key,
                    Title = sidebarTitle, // العنوان الذكي أو المؤقت هنا
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
            // 1. تحديد الـ SessionId
            var sessionId = (string.IsNullOrWhiteSpace(request.SessionId) || request.SessionId == "string")
                            ? Guid.NewGuid().ToString()
                            : request.SessionId;

            // 2. التحقق من الـ UserId (قادم من الـ Token)
            if (!int.TryParse(currentUserId, out int userIdInt))
            {
                userIdInt = 6; // Fallback في حالة عدم وجود يوزر حقيقي
            }

            // 3. جلب الـ History من الداتابيز لتحسين رد الـ AI
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

            // 4. بناء طلب الـ AI
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
                // 5. استخدام الـ _httpClientFactory لحل إيرور الـ Reference
                var client = _httpClientFactory.CreateClient();

                // إضافة الـ Header لتخطي تحذير ngrok
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

                    // *** جديد: تحديد الـ ChatTitle ***
                    string initialTitle = null;

                    // بنشوف لو ده أول سؤال خالص في السيرفر للشات ده (يعني الـ History فاضي)
                    if (!logs.Any())
                    {
                        // بندي له عنوان مؤقت مبدئي يعبر عن أول سؤال عشان يظهر فوراً في الـ Sidebar
                        initialTitle = request.Message.Length > 25
                                       ? request.Message.Substring(0, 22) + "..."
                                       : request.Message;
                    }

                    // 6. حفظ المحادثة في الداتابيز (سؤال اليوزر + رد الـ AI)
                    var chatEntries = new List<ChatLog>
            {
                new ChatLog
                {
                    SessionId = sessionId,
                    MessageText = request.Message,
                    IsFromUser = true,
                    Timestamp = DateTime.UtcNow,
                    UserId = userIdInt,
                    ChatTitle = initialTitle // هينزل هنا العنوان المؤقت لو كان شات جديد، أو null لو شات قديم
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

                    // 7. حفظ سؤال المتابعة لو موجود
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